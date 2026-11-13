const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const {
  sequelize,
  ExamDatesheet,
  ExamDatesheetEntry,
  ClassIncharge,
  ClassSubject,
  Student,
  Teacher,
  User,
  Notification,
} = require('../models');
const { protect, authorize } = require('../middleware/auth');

async function verifyTeacherIncharge(teacherId, cls, section) {
  if (!teacherId) return false;
  const record = await ClassIncharge.findOne({
    where: {
      teacher_id: teacherId,
      class: cls,
      section,
      is_active: true,
    },
  });
  return Boolean(record);
}

const DATESHEET_INCLUDES = [
  { model: ExamDatesheetEntry, as: 'entries' },
  { model: Teacher, as: 'createdByTeacher', attributes: ['id', 'name', 'subject'] },
  { model: User, as: 'createdByUser', attributes: ['id', 'name', 'role'] },
  { model: User, as: 'reviewedByUser', attributes: ['id', 'name'] },
  { model: User, as: 'declaredByUser', attributes: ['id', 'name'] },
];

const sortDatesheetEntries = (dsJson) => {
  if (Array.isArray(dsJson.entries)) {
    dsJson.entries.sort((a, b) => {
      const dateCmp = String(a.exam_date || '').localeCompare(String(b.exam_date || ''));
      if (dateCmp !== 0) return dateCmp;
      return String(a.start_time || '').localeCompare(String(b.start_time || ''));
    });
  }
  return dsJson;
};

async function notifyAdminsOnSubmission(datesheet, senderUserId) {
  try {
    const admins = await User.findAll({
      where: { role: { [Op.in]: ['admin', 'admin2'] }, is_active: true },
      attributes: ['id'],
    });
    if (!admins.length) return;
    await Notification.bulkCreate(
      admins.map((adm) => ({
        title: 'Exam Datesheet Submitted for Review',
        message: `Class Incharge submitted "${datesheet.exam_name}" datesheet for ${datesheet.class} - Section ${datesheet.section}.`,
        type: 'exam_datesheet',
        recipient_type: 'individual',
        recipient_user_id: adm.id,
        sent_by: senderUserId,
      })),
      { individualHooks: true }
    );
  } catch (err) {
    console.error('[Datesheets] Admin notification error:', err.message);
  }
}

// GET /api/datesheets/incharge — Assigned classes + datesheets + subject suggestions
router.get('/incharge', protect, authorize('teacher', 'admin', 'admin2'), async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    let assignedClasses = [];
    let where = {};

    if (req.user.role === 'teacher') {
      const incharges = await ClassIncharge.findAll({
        where: { teacher_id: req.user.linked_teacher_id || -1, is_active: true },
        order: [['class', 'ASC'], ['section', 'ASC']],
      });
      assignedClasses = incharges.map((ic) => ({
        id: ic.id,
        class: ic.class,
        section: ic.section,
        session_id: ic.session_id,
      }));
      if (assignedClasses.length === 0) {
        return res.json({ assignedClasses: [], datesheets: [] });
      }
      where = {
        [Op.or]: assignedClasses.map((ac) => ({ class: ac.class, section: ac.section })),
      };
    } else {
      const students = await Student.findAll({
        where: { is_active: true, approval_status: 'approved' },
        attributes: ['class', 'section', 'session_id'],
        group: ['class', 'section', 'session_id'],
        order: [['class', 'ASC'], ['section', 'ASC']],
      });
      const seen = new Set();
      assignedClasses = [];
      students.forEach((s) => {
        const key = `${s.class}::${s.section}`;
        if (!seen.has(key)) {
          seen.add(key);
          assignedClasses.push({ class: s.class, section: s.section, session_id: s.session_id });
        }
      });
    }

    const datesheets = await ExamDatesheet.findAll({
      where,
      include: DATESHEET_INCLUDES,
      order: [['updated_at', 'DESC']],
    });

    res.json({
      assignedClasses,
      datesheets: datesheets.map((d) => sortDatesheetEntries(d.toJSON())),
    });
  } catch (err) {
    console.error('[Datesheets][GET /incharge]', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/datesheets — Create draft or submit exam datesheet (Class Incharge or Admin)
router.post('/', protect, authorize('teacher', 'admin', 'admin2'), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      exam_name,
      exam_type = 'unit_test',
      class: cls,
      section,
      session_id = null,
      instructions = null,
      entries,
      action = 'draft', // 'draft' | 'submit'
    } = req.body;

    if (!exam_name?.trim() || !cls?.trim() || !section?.trim()) {
      await t.rollback();
      return res.status(400).json({ message: 'Exam name, class, and section are required.' });
    }
    if (!Array.isArray(entries) || entries.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: 'At least one subject exam schedule entry is required.' });
    }

    for (const entry of entries) {
      if (!entry.subject?.trim() || !entry.exam_date || !entry.start_time || !entry.end_time) {
        await t.rollback();
        return res.status(400).json({
          message: 'Every exam entry must include subject, exam date, start time, and end time.',
        });
      }
    }

    if (req.user.role === 'teacher') {
      const ok = await verifyTeacherIncharge(req.user.linked_teacher_id, cls.trim(), section.trim());
      if (!ok) {
        await t.rollback();
        return res.status(403).json({
          message: `Only the assigned Class Incharge can create datesheets for ${cls} - Section ${section}.`,
        });
      }
    }

    const status = action === 'submit' ? 'submitted' : 'draft';
    const datesheet = await ExamDatesheet.create(
      {
        exam_name: exam_name.trim(),
        exam_type,
        class: cls.trim(),
        section: section.trim(),
        session_id: session_id || null,
        created_by_teacher_id: req.user.linked_teacher_id || null,
        created_by_user_id: req.user.id,
        status,
        instructions: instructions ? String(instructions).trim() : null,
      },
      { transaction: t }
    );

    await ExamDatesheetEntry.bulkCreate(
      entries.map((e) => ({
        datesheet_id: datesheet.id,
        subject: String(e.subject).trim(),
        exam_date: e.exam_date,
        start_time: String(e.start_time).trim(),
        end_time: String(e.end_time).trim(),
        room: e.room ? String(e.room).trim() : null,
        syllabus_notes: e.syllabus_notes ? String(e.syllabus_notes).trim() : null,
      })),
      { transaction: t }
    );

    await t.commit();

    if (status === 'submitted') {
      await notifyAdminsOnSubmission(datesheet, req.user.id);
    }

    const created = await ExamDatesheet.findByPk(datesheet.id, { include: DATESHEET_INCLUDES });
    res.status(201).json(sortDatesheetEntries(created.toJSON()));
  } catch (err) {
    await t.rollback();
    console.error('[Datesheets][POST /]', err);
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/datesheets/:id — Update draft/rejected/submitted datesheet and optionally submit
router.put('/:id', protect, authorize('teacher', 'admin', 'admin2'), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const datesheet = await ExamDatesheet.findByPk(req.params.id);
    if (!datesheet) {
      await t.rollback();
      return res.status(404).json({ message: 'Datesheet not found.' });
    }

    if (req.user.role === 'teacher') {
      const ok = await verifyTeacherIncharge(req.user.linked_teacher_id, datesheet.class, datesheet.section);
      if (!ok) {
        await t.rollback();
        return res.status(403).json({ message: 'Only the assigned Class Incharge can update this datesheet.' });
      }
      if (['approved', 'declared'].includes(datesheet.status)) {
        await t.rollback();
        return res.status(400).json({
          message: `Cannot edit a datesheet that has already been ${datesheet.status}.`,
        });
      }
    }

    const {
      exam_name,
      exam_type,
      instructions,
      entries,
      action, // optional: 'draft' | 'submit'
    } = req.body;

    if (entries !== undefined) {
      if (!Array.isArray(entries) || entries.length === 0) {
        await t.rollback();
        return res.status(400).json({ message: 'At least one exam entry is required.' });
      }
      for (const entry of entries) {
        if (!entry.subject?.trim() || !entry.exam_date || !entry.start_time || !entry.end_time) {
          await t.rollback();
          return res.status(400).json({
            message: 'Every exam entry must include subject, exam date, start time, and end time.',
          });
        }
      }
    }

    let nextStatus = datesheet.status;
    let clearReview = false;
    if (action === 'submit') {
      nextStatus = 'submitted';
      clearReview = true;
    } else if (action === 'draft' && !['approved', 'declared'].includes(datesheet.status)) {
      nextStatus = 'draft';
    }

    await datesheet.update(
      {
        exam_name: exam_name !== undefined ? String(exam_name).trim() : datesheet.exam_name,
        exam_type: exam_type !== undefined ? exam_type : datesheet.exam_type,
        instructions: instructions !== undefined ? (instructions ? String(instructions).trim() : null) : datesheet.instructions,
        status: nextStatus,
        ...(clearReview ? { review_notes: null, reviewed_by: null, reviewed_at: null } : {}),
      },
      { transaction: t }
    );

    if (entries !== undefined) {
      await ExamDatesheetEntry.destroy({ where: { datesheet_id: datesheet.id }, transaction: t });
      await ExamDatesheetEntry.bulkCreate(
        entries.map((e) => ({
          datesheet_id: datesheet.id,
          subject: String(e.subject).trim(),
          exam_date: e.exam_date,
          start_time: String(e.start_time).trim(),
          end_time: String(e.end_time).trim(),
          room: e.room ? String(e.room).trim() : null,
          syllabus_notes: e.syllabus_notes ? String(e.syllabus_notes).trim() : null,
        })),
        { transaction: t }
      );
    }

    await t.commit();

    if (action === 'submit') {
      await notifyAdminsOnSubmission(datesheet, req.user.id);
    }

    const updated = await ExamDatesheet.findByPk(datesheet.id, { include: DATESHEET_INCLUDES });
    res.json(sortDatesheetEntries(updated.toJSON()));
  } catch (err) {
    await t.rollback();
    console.error('[Datesheets][PUT /:id]', err);
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/datesheets/:id
router.delete('/:id', protect, authorize('teacher', 'admin', 'admin2'), async (req, res) => {
  try {
    const datesheet = await ExamDatesheet.findByPk(req.params.id);
    if (!datesheet) return res.status(404).json({ message: 'Datesheet not found.' });

    if (req.user.role === 'teacher') {
      const ok = await verifyTeacherIncharge(req.user.linked_teacher_id, datesheet.class, datesheet.section);
      if (!ok) return res.status(403).json({ message: 'Access denied.' });
      if (!['draft', 'rejected'].includes(datesheet.status)) {
        return res.status(400).json({ message: 'Only draft or rejected datesheets can be deleted by the incharge.' });
      }
    }

    await ExamDatesheetEntry.destroy({ where: { datesheet_id: datesheet.id } });
    await datesheet.destroy();
    res.json({ message: 'Datesheet deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/datesheets/admin — Admin view of ALL class-wise datesheets before & after declaration
router.get('/admin', protect, authorize('admin', 'admin2'), async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const { status, class: cls, exam_name } = req.query;
    const where = {};
    if (status && status !== 'all') where.status = status;
    if (cls && cls !== 'all') where.class = cls;
    if (exam_name) where.exam_name = { [Op.like]: `%${exam_name.trim()}%` };

    const allDatesheets = await ExamDatesheet.findAll({
      include: DATESHEET_INCLUDES,
      order: [['class', 'ASC'], ['section', 'ASC'], ['updated_at', 'DESC']],
    });

    const summary = {
      total: allDatesheets.length,
      draft: allDatesheets.filter((d) => d.status === 'draft').length,
      submitted: allDatesheets.filter((d) => d.status === 'submitted').length,
      approved: allDatesheets.filter((d) => d.status === 'approved').length,
      rejected: allDatesheets.filter((d) => d.status === 'rejected').length,
      declared: allDatesheets.filter((d) => d.status === 'declared').length,
    };

    // Build class-section matrix showing active class/section coverage across school
    const [activeStudents, activeIncharges] = await Promise.all([
      Student.findAll({
        where: { is_active: true, approval_status: 'approved' },
        attributes: ['class', 'section'],
        group: ['class', 'section'],
      }),
      ClassIncharge.findAll({
        where: { is_active: true },
        include: [{ model: Teacher, as: 'teacher', attributes: ['id', 'name'] }],
      }),
    ]);

    const classSectionMap = new Map();
    activeStudents.forEach((s) => {
      const key = `${s.class}::${s.section}`;
      if (!classSectionMap.has(key)) {
        classSectionMap.set(key, { class: s.class, section: s.section, inchargeName: null });
      }
    });
    activeIncharges.forEach((ic) => {
      const key = `${ic.class}::${ic.section}`;
      const existing = classSectionMap.get(key) || { class: ic.class, section: ic.section, inchargeName: null };
      existing.inchargeName = ic.teacher?.name || existing.inchargeName;
      classSectionMap.set(key, existing);
    });
    allDatesheets.forEach((d) => {
      const key = `${d.class}::${d.section}`;
      if (!classSectionMap.has(key)) {
        classSectionMap.set(key, { class: d.class, section: d.section, inchargeName: d.createdByTeacher?.name || null });
      }
    });

    const filtered = allDatesheets
      .filter((d) => {
        if (status && status !== 'all' && d.status !== status) return false;
        if (cls && cls !== 'all' && d.class !== cls) return false;
        if (exam_name && !d.exam_name.toLowerCase().includes(exam_name.trim().toLowerCase())) return false;
        return true;
      })
      .map((d) => sortDatesheetEntries(d.toJSON()));

    const classMatrix = Array.from(classSectionMap.values()).sort((a, b) => {
      const c = String(a.class).localeCompare(String(b.class), undefined, { numeric: true });
      return c !== 0 ? c : String(a.section).localeCompare(String(b.section));
    });

    res.json({
      datesheets: filtered,
      summary,
      classMatrix,
    });
  } catch (err) {
    console.error('[Datesheets][GET /admin]', err);
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/datesheets/:id/review — Admin / Admin2 approve or reject datesheet
router.put('/:id/review', protect, authorize('admin', 'admin2'), async (req, res) => {
  try {
    const { decision, review_notes } = req.body;
    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ message: 'Decision must be approved or rejected.' });
    }
    if (decision === 'rejected' && !review_notes?.trim()) {
      return res.status(400).json({ message: 'Please provide review remarks when rejecting a datesheet.' });
    }

    const datesheet = await ExamDatesheet.findByPk(req.params.id);
    if (!datesheet) return res.status(404).json({ message: 'Datesheet not found.' });
    if (datesheet.status === 'declared') {
      return res.status(400).json({ message: 'This datesheet has already been declared.' });
    }

    await datesheet.update({
      status: decision,
      review_notes: review_notes ? String(review_notes).trim() : null,
      reviewed_by: req.user.id,
      reviewed_at: new Date(),
    });

    if (datesheet.created_by_user_id) {
      try {
        await Notification.create({
          title: decision === 'approved' ? 'Exam Datesheet Approved' : 'Exam Datesheet Needs Revision',
          message:
            decision === 'approved'
              ? `Your "${datesheet.exam_name}" datesheet for ${datesheet.class} - Section ${datesheet.section} was approved by Admin and is awaiting final declaration.`
              : `Your "${datesheet.exam_name}" datesheet for ${datesheet.class} - Section ${datesheet.section} was returned for changes: ${review_notes.trim()}`,
          type: 'exam_datesheet',
          recipient_type: 'individual',
          recipient_user_id: datesheet.created_by_user_id,
          sent_by: req.user.id,
        });
      } catch (notifErr) {
        console.error('[Datesheets][Review] Notification error:', notifErr.message);
      }
    }

    const updated = await ExamDatesheet.findByPk(datesheet.id, { include: DATESHEET_INCLUDES });
    res.json({
      message: `Datesheet ${decision === 'approved' ? 'approved' : 'rejected'} successfully.`,
      datesheet: sortDatesheetEntries(updated.toJSON()),
    });
  } catch (err) {
    console.error('[Datesheets][PUT /:id/review]', err);
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/datesheets/:id/declare — Admin declares a datesheet & sends notification to everyone
router.put('/:id/declare', protect, authorize('admin', 'admin2'), async (req, res) => {
  try {
    const datesheet = await ExamDatesheet.findByPk(req.params.id, { include: DATESHEET_INCLUDES });
    if (!datesheet) return res.status(404).json({ message: 'Datesheet not found.' });

    if (datesheet.status === 'declared') {
      return res.status(400).json({ message: 'Datesheet is already declared.' });
    }
    if (!datesheet.entries || datesheet.entries.length === 0) {
      return res.status(400).json({ message: 'Cannot declare an empty datesheet with no exam entries.' });
    }

    await datesheet.update({
      status: 'declared',
      reviewed_by: datesheet.reviewed_by || req.user.id,
      reviewed_at: datesheet.reviewed_at || new Date(),
      declared_by: req.user.id,
      declared_at: new Date(),
    });

    // Notify everyone in the school (Students, Parents, Teachers, Staff, Admins)
    try {
      const sorted = sortDatesheetEntries(datesheet.toJSON());
      const firstDate = sorted.entries[0]?.exam_date;
      const lastDate = sorted.entries[sorted.entries.length - 1]?.exam_date;
      const rangeText = firstDate && lastDate && firstDate !== lastDate ? `${firstDate} to ${lastDate}` : (firstDate || '');

      await Notification.create({
        title: `Exam Datesheet Declared: ${datesheet.exam_name} (${datesheet.class} - ${datesheet.section})`,
        message: `The ${datesheet.exam_name} examination datesheet for ${datesheet.class} - Section ${datesheet.section}${rangeText ? ` (${rangeText})` : ''} has been officially declared. Check the Upcoming Exams section for your full schedule.`,
        type: 'exam_datesheet',
        recipient_type: 'all',
        recipient_role: 'all',
        sent_by: req.user.id,
      });
    } catch (notifErr) {
      console.error('[Datesheets][Declare] Broadcast notification failed:', notifErr.message);
    }

    const updated = await ExamDatesheet.findByPk(datesheet.id, { include: DATESHEET_INCLUDES });
    res.json({
      message: `Datesheet declared for ${datesheet.class} - Section ${datesheet.section} and notifications sent to everyone.`,
      datesheet: sortDatesheetEntries(updated.toJSON()),
    });
  } catch (err) {
    console.error('[Datesheets][PUT /:id/declare]', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/datesheets/bulk-declare — Declare multiple approved/submitted datesheets together and broadcast one notification
router.post('/bulk-declare', protect, authorize('admin', 'admin2'), async (req, res) => {
  try {
    const { ids, exam_name } = req.body;
    const where = { status: { [Op.in]: ['approved', 'submitted'] } };
    if (Array.isArray(ids) && ids.length > 0) {
      where.id = { [Op.in]: ids };
    } else if (exam_name) {
      where.exam_name = exam_name;
    }

    const targets = await ExamDatesheet.findAll({
      where,
      include: [{ model: ExamDatesheetEntry, as: 'entries' }],
    });

    const validTargets = targets.filter((d) => Array.isArray(d.entries) && d.entries.length > 0);
    if (validTargets.length === 0) {
      return res.status(400).json({ message: 'No eligible approved or submitted datesheets with entries found to declare.' });
    }

    const now = new Date();
    for (const ds of validTargets) {
      await ds.update({
        status: 'declared',
        reviewed_by: ds.reviewed_by || req.user.id,
        reviewed_at: ds.reviewed_at || now,
        declared_by: req.user.id,
        declared_at: now,
      });
    }

    const classSummary = validTargets.map((d) => `${d.class}-${d.section}`).join(', ');
    const titleExam = exam_name || (validTargets.length === 1 ? validTargets[0].exam_name : 'Examination');

    try {
      await Notification.create({
        title: `Examination Datesheet Declared: ${titleExam}`,
        message: `Official exam datesheets have been declared for ${validTargets.length} class(es) (${classSummary}). Students and teachers can now view the complete schedule in Upcoming Exams.`,
        type: 'exam_datesheet',
        recipient_type: 'all',
        recipient_role: 'all',
        sent_by: req.user.id,
      });
    } catch (notifErr) {
      console.error('[Datesheets][BulkDeclare] Broadcast notification error:', notifErr.message);
    }

    res.json({
      message: `Declared ${validTargets.length} datesheet(s) and notified everyone.`,
      declaredCount: validTargets.length,
    });
  } catch (err) {
    console.error('[Datesheets][POST /bulk-declare]', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/datesheets/student — Declared datesheets for logged-in Student/Parent (or queried class/section for staff)
router.get('/student', protect, async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    let cls = req.query.class;
    let section = req.query.section;

    if (req.user.role === 'student' || req.user.role === 'parent') {
      const stu = req.user.linkedStudent;
      if (!stu) {
        return res.json({ datesheets: [], upcomingEntries: [] });
      }
      cls = stu.class;
      section = stu.section;
    }

    const where = { status: 'declared' };
    if (cls) where.class = cls;
    if (section) where.section = section;

    const datesheets = await ExamDatesheet.findAll({
      where,
      include: [
        { model: ExamDatesheetEntry, as: 'entries' },
        { model: Teacher, as: 'createdByTeacher', attributes: ['id', 'name'] },
        { model: User, as: 'declaredByUser', attributes: ['id', 'name'] },
      ],
      order: [['declared_at', 'DESC'], ['created_at', 'DESC']],
    });

    const formatted = datesheets.map((d) => sortDatesheetEntries(d.toJSON()));
    const todayStr = new Date().toISOString().slice(0, 10);

    const upcomingEntries = [];
    formatted.forEach((ds) => {
      (ds.entries || []).forEach((entry) => {
        upcomingEntries.push({
          ...entry,
          exam_name: ds.exam_name,
          exam_type: ds.exam_type,
          class: ds.class,
          section: ds.section,
          instructions: ds.instructions,
          isUpcoming: String(entry.exam_date) >= todayStr,
        });
      });
    });

    upcomingEntries.sort((a, b) => {
      const dateCmp = String(a.exam_date).localeCompare(String(b.exam_date));
      if (dateCmp !== 0) return dateCmp;
      return String(a.start_time).localeCompare(String(b.start_time));
    });

    res.json({
      datesheets: formatted,
      upcomingEntries: upcomingEntries.filter((e) => e.isUpcoming),
      allEntries: upcomingEntries,
    });
  } catch (err) {
    console.error('[Datesheets][GET /student]', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

