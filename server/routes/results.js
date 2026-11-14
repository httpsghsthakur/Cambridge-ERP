const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const {
  Result,
  ResultSubject,
  Student,
  Teacher,
  ClassIncharge,
  User,
  Notification,
  Attendance,
  Session,
  ClassSubject,
} = require('../models');
const { protect, authorize, hasPermission } = require('../middleware/auth');
const { validateResultCreate, validateResultInchargeReview } = require('../middleware/validator');
const { cacheMiddleware } = require('../utils/cache');
const { getTeacherAllowedClasses, isClassMatch } = require('../utils/teacherAllowedClasses');

const calcGrade = (pct) =>
  pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 40 ? 'D' : 'F';

const teacherCanEnter = async (teacherRecord, cls, section, subject) => {
  if (!teacherRecord) return true; // If not linked, allow mark entry fallback
  const assigned = teacherRecord.assigned_classes?.split(',').map((s) => s.trim()).filter(Boolean) || [];

  if (assigned.length > 0 && !assigned.some(c => c.toLowerCase() === 'all' || c === '*')) {
    const classMatches = assigned.some(c => isClassMatch(c, cls));
    if (!classMatches) {
      const cs = await ClassSubject.findOne({
        where: { teacher_id: teacherRecord.id, class: cls }
      });
      if (!cs) {
        const incharge = await ClassIncharge.findOne({
          where: { teacher_id: teacherRecord.id, class: cls, is_active: true }
        });
        if (!incharge) return false;
      }
    }
  }

  if (subject && teacherRecord.subject) {
    const subjects = teacherRecord.subject.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    const subClean = subject.trim().toLowerCase();
    const hasSubMatch = subjects.some(s => s === subClean || s === 'all' || s === 'general');
    if (!hasSubMatch) {
      const cs = await ClassSubject.findOne({
        where: { teacher_id: teacherRecord.id, subject }
      });
      if (!cs) return false;
    }
  }
  return true;
};

// Notification Helpers
const notifyClassIncharge = async (cls, section, examName, submittedByUserId) => {
  try {
    const incharge = await ClassIncharge.findOne({ where: { class: cls, section, is_active: true } });
    if (!incharge) return;
    const teacherUser = await User.findOne({ where: { linked_teacher_id: incharge.teacher_id, is_active: true } });
    if (!teacherUser) return;
    
    await Notification.create({
      title: 'Results Submitted for Review',
      message: `Marks have been submitted for ${cls} ${section} - ${examName} and require your review.`,
      type: 'result',
      recipient_type: 'individual',
      recipient_user_id: teacherUser.id,
      sent_by: submittedByUserId
    });
  } catch (err) {
    console.error('Notification error:', err);
  }
};

const notifyAdmins = async (cls, section, examName, approvedByUserId) => {
  try {
    const admins = await User.findAll({ where: { role: { [Op.in]: ['admin', 'admin2'] }, is_active: true } });
    const notifications = admins.map(admin => ({
      title: 'Results Approved by Incharge',
      message: `Results for ${cls} ${section} - ${examName} have been approved and are ready for final admin review.`,
      type: 'result',
      recipient_type: 'individual',
      recipient_user_id: admin.id,
      sent_by: approvedByUserId
    }));
    if (notifications.length > 0) {
      await Notification.bulkCreate(notifications);
    }
  } catch (err) {
    console.error('Notification error:', err);
  }
};

// GET /api/results/student/:studentId
router.get('/student/:studentId', protect, async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId, 10);

    if ((req.user.role === 'parent' || req.user.role === 'student')) {
      const linkedId = req.user.linked_student_id || req.user.linkedStudent?.id;
      if (!linkedId || linkedId !== studentId) {
        return res.status(403).json({ message: 'Access denied to this student.' });
      }
    }

    if (req.user.role === 'teacher') {
      const student = await Student.findByPk(studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found.' });
      }
      const allowedClasses = await getTeacherAllowedClasses(req.user.linked_teacher_id);
      const matches = allowedClasses.some(ac => isClassMatch(ac, student.class));
      if (!matches) {
        return res.status(403).json({ message: 'Access denied. Student is not in your assigned classes.' });
      }
    }

    const where = { student_id: studentId };
    if (req.user.role === 'parent' || req.user.role === 'student') where.is_published = true;

    const [results, attRows] = await Promise.all([
      Result.findAll({
        where,
        include: [
          { model: ResultSubject, as: 'subjects' },
          {
            model: Student,
            as: 'student',
            include: [{ model: Session, as: 'session', attributes: ['id', 'name'] }],
          },
        ],
        order: [['created_at', 'DESC']],
      }),
      Attendance.findAll({
        where: { student_id: studentId },
      }),
    ]);

    const workingDays = attRows.filter((r) => r.status !== 'holiday').length;
    const attendedDays = attRows.filter((r) => r.status === 'present' || r.status === 'late').length;
    const attPct = workingDays > 0 ? Math.round((attendedDays / workingDays) * 100) : null;
    const attendanceSummary = {
      total_working_days: workingDays,
      attended_days: attendedDays,
      percentage: attPct,
    };

    res.set('Cache-Control', 'no-store');
    res.json(results.map((r) => {
      const json = r.toJSON();
      json.attendance = attendanceSummary;
      return json;
    }));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/results/class
router.get('/class', protect, authorize('admin', 'admin2', 'teacher'), async (req, res) => {
  try {
    const { class: cls, section, exam_name, workflow_status } = req.query;
    const where = {};
    if (cls) where.class = cls;
    if (section) where.section = section;
    if (exam_name) where.exam_name = exam_name;
    if (workflow_status) where.workflow_status = workflow_status;

    if (req.user.role === 'teacher') {
      const allowedClasses = await getTeacherAllowedClasses(req.user.linked_teacher_id);
      if (cls) {
        if (!allowedClasses.includes(cls)) {
          return res.status(403).json({ message: 'Access denied. You are not assigned to this class.' });
        }
      } else {
        where.class = { [Op.in]: allowedClasses };
      }
    }

    const results = await Result.findAll({
      where,
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'student_id', 'first_name', 'last_name', 'roll_number', 'class', 'section', 'date_of_birth', 'parent_name', 'mother_name', 'category', 'aadhar_number', 'pen_number', 'family_id'],
        },
        { model: ResultSubject, as: 'subjects' },
        { model: User, as: 'enteredByUser', attributes: ['id', 'name', 'role'] },
      ],
      order: [['percentage', 'DESC']],
    });
    res.set('Cache-Control', 'no-store');
    res.json(results.map(r => r.toJSON()));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/results/class-incharge
router.get('/class-incharge', protect, hasPermission('INCHARGE_REVIEW'), async (req, res) => {
  try {
    const teacherId = req.user.linked_teacher_id;
    if (!teacherId) {
      return res.status(403).json({ message: 'Only class incharge teachers can access this view.' });
    }

    const incharges = await ClassIncharge.findAll({
      where: {
        teacher_id: teacherId,
        is_active: true,
      },
      order: [['updated_at', 'DESC']],
    });

    if (incharges.length === 0) {
      return res.status(403).json({ message: 'You are not assigned as class incharge.' });
    }

    const { exam_name, class: reqClass, section: reqSection } = req.query;
    
    let activeIncharges = incharges;
    if (reqClass && reqSection) {
      activeIncharges = incharges.filter(ic => ic.class === reqClass && ic.section === reqSection);
      if (activeIncharges.length === 0) activeIncharges = incharges;
    }

    const where = {
      [Op.or]: activeIncharges.map(ic => ({ class: ic.class, section: ic.section }))
    };
    if (exam_name) where.exam_name = exam_name;

    const results = await Result.findAll({
      where,
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'student_id', 'first_name', 'last_name', 'roll_number', 'class', 'section'],
        },
        { model: ResultSubject, as: 'subjects' },
        { model: User, as: 'enteredByUser', attributes: ['id', 'name', 'role'] },
      ],
      order: [
        ['class', 'ASC'],
        ['section', 'ASC'],
        [{ model: Student, as: 'student' }, 'roll_number', 'ASC'],
        ['exam_name', 'ASC'],
        ['created_at', 'DESC'],
      ],
    });

    const exams = [...new Set(results.map((item) => item.exam_name).filter(Boolean))];

    res.json({
      incharges: incharges.map(ic => ({ class: ic.class, section: ic.section })),
      active_incharge: activeIncharges.length === 1 ? { class: activeIncharges[0].class, section: activeIncharges[0].section } : null,
      exams,
      results,
    });
  } catch (err) {
    console.error('[results][GET /class-incharge]', err);
    res.status(500).json({ message: 'Failed to load incharge results.' });
  }
});

// GET /api/results/pending-approval
router.get('/pending-approval', protect, authorize('admin', 'admin2'), async (req, res) => {
  try {
    const where =
      req.user.role === 'admin2'
        ? { workflow_status: 'incharge_approved' }
        : { workflow_status: 'admin2_approved' };

    const results = await Result.findAll({
      where,
      include: [
        { model: Student, as: 'student', attributes: ['id', 'first_name', 'last_name', 'class', 'section'] },
        { model: ResultSubject, as: 'subjects' },
        { model: User, as: 'enteredByUser', attributes: ['id', 'name'] },
      ],
      order: [['updated_at', 'DESC']],
    });
    res.set('Cache-Control', 'no-store');
    res.json(results.map(r => r.toJSON()));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/results
router.post('/', protect, authorize('admin', 'admin2', 'teacher'), validateResultCreate, async (req, res) => {
  try {
    const {
      student_id,
      exam_name,
      exam_type,
      class: cls,
      section,
      session_id,
      subjects,
      is_class_test = false,
    } = req.body;

    if (req.user.role === 'teacher') {
      let teacherId = req.user.linked_teacher_id;
      let teacherRecord = teacherId ? await Teacher.findByPk(teacherId) : null;
      if (!teacherRecord && (req.user.email || req.user.name)) {
        if (req.user.email) teacherRecord = await Teacher.findOne({ where: { email: req.user.email } });
        if (!teacherRecord && req.user.name) teacherRecord = await Teacher.findOne({ where: { name: req.user.name } });
        if (teacherRecord) {
          teacherId = teacherRecord.id;
          try { await req.user.update({ linked_teacher_id: teacherId }); } catch (e) {}
        }
      }

      const isIncharge = teacherId ? await ClassIncharge.findOne({
        where: {
          teacher_id: teacherId,
          class: cls,
          section: section,
          is_active: true
        }
      }) : null;

      if (!isIncharge) {
        const subject = subjects?.[0]?.subject;
        const allowed = await teacherCanEnter(teacherRecord, cls, section, subject);
        if (!allowed) {
          return res.status(403).json({ message: 'You are not assigned to this class or subject, and you are not the class incharge.' });
        }
      }
    }

    const total_marks = subjects.reduce((a, s) => a + s.max_marks, 0);
    const total_obtained = subjects.reduce((a, s) => a + s.obtained_marks, 0);
    const percentage = parseFloat(((total_obtained / total_marks) * 100).toFixed(2));
    const grade = calcGrade(percentage);

    const subjectsWithGrade = subjects.map((s) => ({
      ...s,
      grade: calcGrade((s.obtained_marks / s.max_marks) * 100),
    }));

    let effSessionId = session_id;
    if (!effSessionId) {
      const activeSession = await Session.findOne({ where: { is_active: true }, order: [['id', 'DESC']] });
      effSessionId = activeSession?.id || null;
    }

    const result = await Result.create(
      {
        student_id,
        exam_name,
        exam_type,
        class: cls,
        section,
        session_id: effSessionId,
        total_marks,
        total_obtained,
        percentage,
        grade,
        entered_by: req.user.id,
        workflow_status: is_class_test ? 'published' : 'draft',
        is_class_test,
        is_published: is_class_test,
        sent_to_parents: false,
        subjects: subjectsWithGrade,
      },
      { include: [{ model: ResultSubject, as: 'subjects' }] }
    );

    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/results/:id
router.put('/:id', protect, authorize('admin', 'admin2', 'teacher'), async (req, res) => {
  try {
    const { subjects } = req.body;
    const resultId = req.params.id;
    
    const result = await Result.findByPk(resultId, {
      include: [{ model: ResultSubject, as: 'subjects' }]
    });

    if (!result) return res.status(404).json({ message: 'Result not found.' });

    if (subjects && subjects.length > 0) {
      let newTotalObtained = 0;
      let newTotalMax = 0;

      for (const sub of subjects) {
        const rs = result.subjects.find(s => s.id === sub.id || s.subject === sub.subject);
        if (rs) {
          rs.obtained_marks = parseInt(sub.obtained_marks, 10);
          rs.grade = calcGrade((rs.obtained_marks / rs.max_marks) * 100);
          await rs.save();
        }
      }

      for (const rs of result.subjects) {
        newTotalObtained += rs.obtained_marks;
        newTotalMax += rs.max_marks;
      }

      const percentage = parseFloat(((newTotalObtained / newTotalMax) * 100).toFixed(2));
      const grade = calcGrade(percentage);

      await result.update({
        total_obtained: newTotalObtained,
        total_marks: newTotalMax,
        percentage,
        grade
      });
    }

    res.json({ message: 'Result updated successfully.', result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/results/:id/submit
// (H7 fix) — teachers can only submit their own results
router.put('/:id/submit', protect, authorize('teacher', 'admin', 'admin2'), async (req, res) => {
  try {
    const result = await Result.findByPk(req.params.id);
    if (!result) return res.status(404).json({ message: 'Result not found.' });
    if (!['draft', 'rejected'].includes(result.workflow_status)) {
      return res.status(400).json({ message: 'Result is not in draft/rejected state.' });
    }

    // (H7 fix) — verify teacher ownership
    if (req.user.role === 'teacher' && result.entered_by !== req.user.id) {
      return res.status(403).json({ message: 'You can only submit results you entered.' });
    }

    await result.update({ workflow_status: 'submitted', rejection_reason: null });
    
    // Notify class incharge
    await notifyClassIncharge(result.class, result.section, result.exam_name, req.user.id);
    
    res.json({ message: 'Submitted for class incharge review.', result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/results/bulk-submit
router.put('/bulk-submit', protect, authorize('teacher', 'admin', 'admin2'), async (req, res) => {
  try {
    const { class: cls, section, exam_name } = req.body;
    
    if (!cls || !section || !exam_name) {
      return res.status(400).json({ message: 'Class, section, and exam name are required.' });
    }

    const where = {
      class: cls,
      section: section,
      exam_name: exam_name,
      workflow_status: { [Op.in]: ['draft', 'rejected'] }
    };

    if (req.user.role === 'teacher') {
      where.entered_by = req.user.id;
    }

    const [updatedCount] = await Result.update({ 
      workflow_status: 'submitted', 
      rejection_reason: null 
    }, { where });

    // Notify class incharge
    if (updatedCount > 0) {
      await notifyClassIncharge(cls, section, exam_name, req.user.id);
    }

    res.json({ message: `Successfully submitted ${updatedCount} results for review.`, updatedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/results/:id/incharge-review
// (H7 fix) — verifies teacher is the incharge for the result's class
router.put('/:id/incharge-review', protect, authorize('teacher', 'admin', 'admin2'), validateResultInchargeReview, async (req, res) => {
  try {
    const { action, notes } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Action must be approve or reject.' });
    }

    const result = await Result.findByPk(req.params.id);
    if (!result) return res.status(404).json({ message: 'Result not found.' });

    if (req.user.role === 'teacher') {
      const incharge = await ClassIncharge.findOne({
        where: { class: result.class, section: result.section, is_active: true },
      });
      if (!incharge || incharge.teacher_id !== req.user.linked_teacher_id) {
        return res.status(403).json({ message: 'You are not the class incharge for this class/section.' });
      }
    }

    const update =
      action === 'approve'
        ? {
            workflow_status: 'incharge_approved',
            incharge_reviewed_by: req.user.id,
            incharge_reviewed_at: new Date(),
            workflow_notes: notes,
          }
        : { workflow_status: 'rejected', rejection_reason: notes };

    await result.update(update);

    // Notify admins if approved
    if (action === 'approve') {
      await notifyAdmins(result.class, result.section, result.exam_name, req.user.id);
    }

    res.json({ message: `Result ${action === 'approve' ? 'approved' : 'rejected'} by class incharge.`, result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/results/:id/admin2-review
router.put('/:id/admin2-review', protect, authorize('admin2', 'admin'), async (req, res) => {
  try {
    const { action, notes } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Action must be approve or reject.' });
    }

    const result = await Result.findByPk(req.params.id);
    if (!result) return res.status(404).json({ message: 'Result not found.' });

    const update =
      action === 'approve'
        ? {
            workflow_status: 'admin2_approved',
            admin2_approved_by: req.user.id,
            admin2_approved_at: new Date(),
            workflow_notes: notes,
          }
        : { workflow_status: 'rejected', rejection_reason: notes };

    await result.update(update);
    res.json({ message: `Result ${action === 'approve' ? 'forwarded to admin' : 'rejected'}.`, result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/results/:id/publish
router.put('/:id/publish', protect, authorize('admin'), async (req, res) => {
  try {
    const result = await Result.findByPk(req.params.id);
    if (!result) return res.status(404).json({ message: 'Result not found.' });

    await result.update({
      workflow_status: 'published',
      is_published: true,
      admin_approved_by: req.user.id,
      admin_approved_at: new Date(),
    });
    res.json({ message: 'Result published.', result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/results/bulk-publish
router.put('/bulk-publish', protect, authorize('admin'), async (req, res) => {
  try {
    const { class: cls, section, exam_name, result_ids } = req.body;
    
    const where = {};
    if (result_ids && result_ids.length > 0) {
      where.id = { [Op.in]: result_ids };
    } else {
      if (cls) where.class = cls;
      if (section) where.section = section;
      if (exam_name) where.exam_name = exam_name;
      // Only publish those that are not already published
      where.is_published = false;
    }

    const [updatedCount] = await Result.update({
      workflow_status: 'published',
      is_published: true,
      admin_approved_by: req.user.id,
      admin_approved_at: new Date(),
    }, { where });

    res.json({ message: `Successfully published ${updatedCount} results.`, updatedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/results/:id/send-to-parents
router.put('/:id/send-to-parents', protect, authorize('teacher', 'admin', 'admin2'), async (req, res) => {
  try {
    const result = await Result.findByPk(req.params.id, {
      include: [{ model: Student, as: 'student' }],
    });
    if (!result) return res.status(404).json({ message: 'Result not found.' });
    if (!result.is_class_test) {
      return res.status(400).json({ message: 'Only class test results can be sent directly.' });
    }

    await result.update({ sent_to_parents: true });

    const parentUser = await User.findOne({
      where: {
        linked_student_id: result.student_id,
        role: 'parent',
        is_active: true,
      },
    });

    if (parentUser) {
      await Notification.create({
        title: `Class Test Result - ${result.exam_name}`,
        message: `Result for ${result.student?.first_name} in ${result.exam_name}: ${result.total_obtained}/${result.total_marks} (${result.percentage}%) - Grade: ${result.grade}`,
        type: 'result',
        recipient_type: 'individual',
        recipient_user_id: parentUser.id,
        sent_by: req.user.id,
      });
    }

    res.json({ message: 'Result sent to parents.', result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// PUT /api/results/bulk-incharge-review
router.put('/bulk-incharge-review', protect, authorize('teacher', 'admin', 'admin2'), async (req, res) => {
  try {
    const { action, notes, class: cls, section, exam_name } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Action must be approve or reject.' });
    }
    if (!cls || !section || !exam_name) {
      return res.status(400).json({ message: 'Class, section, and exam name are required.' });
    }

    if (req.user.role === 'teacher') {
      const incharge = await ClassIncharge.findOne({
        where: { class: cls, section: section, is_active: true },
      });
      if (!incharge || incharge.teacher_id !== req.user.linked_teacher_id) {
        return res.status(403).json({ message: 'You are not the class incharge for this class/section.' });
      }
    }

    const where = {
      class: cls,
      section: section,
      exam_name: exam_name,
      workflow_status: 'submitted',
    };

    const update =
      action === 'approve'
        ? {
            workflow_status: 'incharge_approved',
            incharge_reviewed_by: req.user.id,
            incharge_reviewed_at: new Date(),
            workflow_notes: notes,
          }
        : { workflow_status: 'rejected', rejection_reason: notes };

    const [updatedCount] = await Result.update(update, { where });

    // Notify admins if approved
    if (action === 'approve' && updatedCount > 0) {
      await notifyAdmins(cls, section, exam_name, req.user.id);
    }

    res.json({ message: `Successfully ${action === 'approve' ? 'approved' : 'rejected'} ${updatedCount} results.`, updatedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/results/bulk-admin2-review
router.put('/bulk-admin2-review', protect, authorize('admin2', 'admin'), async (req, res) => {
  try {
    const { action, notes, class: cls, section, exam_name } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Action must be approve or reject.' });
    }
    if (!cls || !section || !exam_name) {
      return res.status(400).json({ message: 'Class, section, and exam name are required.' });
    }

    const where = {
      class: cls,
      section: section,
      exam_name: exam_name,
      workflow_status: 'incharge_approved',
    };

    const update =
      action === 'approve'
        ? {
            workflow_status: 'admin2_approved',
            admin2_approved_by: req.user.id,
            admin2_approved_at: new Date(),
            workflow_notes: notes,
          }
        : { workflow_status: 'rejected', rejection_reason: notes };

    const [updatedCount] = await Result.update(update, { where });
    res.json({ message: `Successfully ${action === 'approve' ? 'forwarded' : 'rejected'} ${updatedCount} results.`, updatedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/results/bulk-publish-class
router.put('/bulk-publish-class', protect, authorize('admin'), async (req, res) => {
  try {
    const { action, notes, class: cls, section, exam_name } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Action must be approve or reject.' });
    }
    if (!cls || !section || !exam_name) {
      return res.status(400).json({ message: 'Class, section, and exam name are required.' });
    }

    const where = {
      class: cls,
      section: section,
      exam_name: exam_name,
      workflow_status: 'admin2_approved',
    };

    const update =
      action === 'approve'
        ? {
            workflow_status: 'published',
            is_published: true,
            admin_approved_by: req.user.id,
            admin_approved_at: new Date(),
          }
        : { workflow_status: 'rejected', rejection_reason: notes };

    const [updatedCount] = await Result.update(update, { where });
    res.json({ message: `Successfully ${action === 'approve' ? 'published' : 'rejected'} ${updatedCount} results.`, updatedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

