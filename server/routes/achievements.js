const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const {
  StudentAchievement,
  Student,
  Teacher,
  User,
  ClassIncharge,
  Attendance,
  Result,
  ResultSubject,
  Notification,
  Session,
} = require('../models');
const { protect, authorize } = require('../middleware/auth');
const { getTeacherAllowedClasses } = require('../utils/teacherAllowedClasses');

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatMonthKey = (ymKey) => {
  const [yr, mo] = String(ymKey).split('-');
  const idx = parseInt(mo, 10) - 1;
  return idx >= 0 && idx < 12 ? `${MONTH_LABELS[idx]} ${yr}` : ymKey;
};

const toOrdinal = (n) => {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  if (n % 10 === 1) return `${n}st`;
  if (n % 10 === 2) return `${n}nd`;
  if (n % 10 === 3) return `${n}rd`;
  return `${n}th`;
};

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

async function computeStudentMetrics(student) {
  // 1. Attendance Metrics (scoped to current/target session so promotion resets attendance cleanly)
  let targetSessionId = student.session_id || null;
  if (!targetSessionId) {
    const activeSession = await Session.findOne({ where: { is_active: true } });
    if (activeSession) targetSessionId = activeSession.id;
  }
  const attendanceWhere = { student_id: student.id };
  if (targetSessionId) {
    attendanceWhere.session_id = targetSessionId;
  }
  const attendanceRecords = await Attendance.findAll({
    where: attendanceWhere,
    order: [['date', 'ASC']],
  });

  const workingRecords = attendanceRecords.filter((r) => r.status !== 'holiday');
  const presentCount = workingRecords.filter((r) => r.status === 'present').length;
  const lateCount = workingRecords.filter((r) => r.status === 'late').length;
  const attendedCount = presentCount + lateCount;
  const totalWorking = workingRecords.length;
  const overallAttendancePct = totalWorking > 0 ? Math.round((attendedCount / totalWorking) * 100) : null;

  const monthlyBuckets = new Map();
  let currentStreak = 0;
  let longestStreak = 0;

  workingRecords.forEach((r) => {
    const dateStr = String(r.date || '');
    const ym = dateStr.slice(0, 7);
    if (!monthlyBuckets.has(ym)) {
      monthlyBuckets.set(ym, { working: 0, attended: 0 });
    }
    const bucket = monthlyBuckets.get(ym);
    bucket.working += 1;
    if (r.status === 'present' || r.status === 'late') {
      bucket.attended += 1;
      currentStreak += 1;
      if (currentStreak > longestStreak) longestStreak = currentStreak;
    } else {
      currentStreak = 0;
    }
  });

  const perfectMonths = [];
  let bestMonth = null;

  for (const [ym, b] of monthlyBuckets.entries()) {
    const pct = b.working > 0 ? Math.round((b.attended / b.working) * 100) : 0;
    if (b.working >= 5 && b.attended === b.working) {
      perfectMonths.push({ monthKey: ym, label: formatMonthKey(ym), workingDays: b.working, attendedDays: b.attended });
    }
    if (b.working >= 3) {
      if (!bestMonth || pct > bestMonth.percentage || (pct === bestMonth.percentage && b.working > bestMonth.workingDays)) {
        bestMonth = {
          monthKey: ym,
          label: formatMonthKey(ym),
          percentage: pct,
          workingDays: b.working,
          attendedDays: b.attended,
        };
      }
    }
  }

  perfectMonths.sort((a, b) => b.monthKey.localeCompare(a.monthKey));

  // 2. Academic Marks, Highest Subjects, & Class Rank
  const studentResults = await Result.findAll({
    where: { student_id: student.id, is_published: true },
    include: [{ model: ResultSubject, as: 'subjects' }],
    order: [['created_at', 'DESC']],
  });

  const examSummaries = [];
  const allSubjectEntries = [];

  if (studentResults.length > 0) {
    const examNames = [...new Set(studentResults.map((r) => r.exam_name).filter(Boolean))];
    const classResults = await Result.findAll({
      where: {
        class: student.class,
        section: student.section,
        is_published: true,
        exam_name: { [Op.in]: examNames },
      },
      include: [{ model: ResultSubject, as: 'subjects' }],
    });

    const resultsByExam = new Map();
    classResults.forEach((cr) => {
      if (!resultsByExam.has(cr.exam_name)) resultsByExam.set(cr.exam_name, []);
      resultsByExam.get(cr.exam_name).push(cr);
    });

    for (const sr of studentResults) {
      const peers = resultsByExam.get(sr.exam_name) || [sr];
      const sortedPeers = [...peers].sort((a, b) => {
        const pctDiff = Number(b.percentage || 0) - Number(a.percentage || 0);
        if (pctDiff !== 0) return pctDiff;
        return Number(b.total_obtained ?? b.obtained_marks ?? 0) - Number(a.total_obtained ?? a.obtained_marks ?? 0);
      });

      // Standard competition ranking (1, 1, 3) based on percentage/total_obtained
      let computedRank = 1;
      for (let i = 0; i < sortedPeers.length; i++) {
        if (i > 0) {
          const prev = sortedPeers[i - 1];
          const curr = sortedPeers[i];
          if (
            Number(curr.percentage || 0) !== Number(prev.percentage || 0) ||
            Number(curr.total_obtained ?? curr.obtained_marks ?? 0) !== Number(prev.total_obtained ?? prev.obtained_marks ?? 0)
          ) {
            computedRank = i + 1;
          }
        }
        if (sortedPeers[i].student_id === student.id) {
          break;
        }
      }

      // Compute subject-wise class highest for each subject in this exam
      const classMaxBySubject = new Map();
      peers.forEach((p) => {
        (p.subjects || []).forEach((sub) => {
          const subName = sub.subject ?? sub.subject_name ?? '';
          const nameKey = String(subName).trim().toLowerCase();
          const score = Number(sub.obtained_marks ?? sub.marks_obtained ?? 0);
          if (nameKey && (!classMaxBySubject.has(nameKey) || score > classMaxBySubject.get(nameKey))) {
            classMaxBySubject.set(nameKey, score);
          }
        });
      });

      const pctVal = Number(sr.percentage || 0);
      examSummaries.push({
        id: sr.id,
        exam_name: sr.exam_name,
        obtained_marks: Number(sr.total_obtained ?? sr.obtained_marks ?? 0),
        total_marks: Number(sr.total_marks || 0),
        percentage: pctVal,
        grade: sr.grade,
        rank: computedRank,
        rankLabel: `${toOrdinal(computedRank)}`,
        totalStudents: peers.length,
        class: sr.class,
        section: sr.section,
      });

      (sr.subjects || []).forEach((sub) => {
        const subName = sub.subject ?? sub.subject_name ?? '';
        const obtained = Number(sub.obtained_marks ?? sub.marks_obtained ?? 0);
        const max = Number(sub.max_marks || 0);
        if (max > 0 && subName) {
          const subPct = Math.round((obtained / max) * 100);
          const nameKey = String(subName).trim().toLowerCase();
          const classBest = classMaxBySubject.get(nameKey) ?? obtained;
          allSubjectEntries.push({
            subject: subName,
            marks_obtained: obtained,
            max_marks: max,
            percentage: subPct,
            exam_name: sr.exam_name,
            isClassHighest: peers.length > 1 && obtained >= classBest && obtained > 0,
          });
        }
      });
    }
  }

  allSubjectEntries.sort((a, b) => {
    if (b.percentage !== a.percentage) return b.percentage - a.percentage;
    return b.marks_obtained - a.marks_obtained;
  });

  // Deduplicate top subjects by highest percentage per subject
  const bestBySubjectMap = new Map();
  allSubjectEntries.forEach((entry) => {
    const key = String(entry.subject).trim().toLowerCase();
    if (!bestBySubjectMap.has(key)) {
      bestBySubjectMap.set(key, entry);
    }
  });
  const topSubjects = Array.from(bestBySubjectMap.values()).slice(0, 5);

  const bestRank = examSummaries.length > 0
    ? [...examSummaries].sort((a, b) => a.rank - b.rank || b.percentage - a.percentage)[0]
    : null;

  const highestOverallScore = examSummaries.length > 0
    ? [...examSummaries].sort((a, b) => b.percentage - a.percentage)[0]
    : null;

  return {
    attendance: {
      totalWorking,
      attendedCount,
      absentCount: Math.max(0, totalWorking - attendedCount),
      percentage: overallAttendancePct,
      perfectMonths,
      bestMonth,
      longestStreak,
    },
    exams: examSummaries,
    bestRank,
    highestOverallScore,
    topSubjects,
  };
}

// GET /api/achievements/student/:studentId — Real academic metrics + Class Incharge competitions
router.get('/student/:studentId', protect, async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const studentId = parseInt(req.params.studentId, 10);
    if (Number.isNaN(studentId)) {
      return res.status(400).json({ message: 'Invalid student ID.' });
    }

    if (req.user.role === 'parent' || req.user.role === 'student') {
      const linkedId = req.user.linked_student_id || req.user.linkedStudent?.id;
      if (!linkedId || linkedId !== studentId) {
        return res.status(403).json({ message: 'Access denied to this student.' });
      }
    } else if (req.user.role === 'teacher') {
      const targetStudent = await Student.findByPk(studentId);
      if (!targetStudent) return res.status(404).json({ message: 'Student not found.' });
      const allowedClasses = await getTeacherAllowedClasses(req.user.linked_teacher_id);
      if (!allowedClasses.includes(targetStudent.class)) {
        return res.status(403).json({ message: 'Access denied. Student is not in your assigned classes.' });
      }
    } else if (!['admin', 'admin2'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const student = await Student.findByPk(studentId, {
      attributes: ['id', 'student_id', 'roll_number', 'first_name', 'last_name', 'class', 'section', 'session_id'],
    });
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const [metrics, achievements] = await Promise.all([
      computeStudentMetrics(student),
      StudentAchievement.findAll({
        where: { student_id: studentId },
        include: [
          { model: Teacher, as: 'addedByTeacher', attributes: ['id', 'name'] },
          { model: User, as: 'addedByUser', attributes: ['id', 'name', 'role'] },
        ],
        order: [['event_date', 'DESC'], ['created_at', 'DESC']],
      }),
    ]);

    res.json({
      student: student.toJSON(),
      metrics,
      achievements: achievements.map((a) => a.toJSON()),
    });
  } catch (err) {
    console.error('[Achievements][GET /student/:studentId]', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/achievements/incharge — Class Incharge roster + competition achievements
router.get('/incharge', protect, authorize('teacher', 'admin', 'admin2'), async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const { class: clsFilter, section: secFilter } = req.query;
    let assignedClasses = [];
    let studentWhere = { is_active: true, approval_status: 'approved' };
    let achWhere = {};

    if (req.user.role === 'teacher') {
      const incharges = await ClassIncharge.findAll({
        where: { teacher_id: req.user.linked_teacher_id || -1, is_active: true },
        order: [['class', 'ASC'], ['section', 'ASC']],
      });
      assignedClasses = incharges.map((ic) => ({
        id: ic.id,
        class: ic.class,
        section: ic.section,
      }));
      if (assignedClasses.length === 0) {
        return res.json({ assignedClasses: [], students: [], achievements: [] });
      }
      const pairFilter = assignedClasses.map((ac) => ({ class: ac.class, section: ac.section }));
      studentWhere[Op.or] = pairFilter;
      achWhere[Op.or] = pairFilter;
    } else {
      const pairs = await Student.findAll({
        where: { is_active: true, approval_status: 'approved' },
        attributes: ['class', 'section'],
        group: ['class', 'section'],
        order: [['class', 'ASC'], ['section', 'ASC']],
      });
      assignedClasses = pairs.map((p) => ({ class: p.class, section: p.section }));
    }

    if (clsFilter && clsFilter !== 'all') {
      studentWhere.class = clsFilter;
      achWhere.class = clsFilter;
    }
    if (secFilter && secFilter !== 'all') {
      studentWhere.section = secFilter;
      achWhere.section = secFilter;
    }

    const [students, achievements] = await Promise.all([
      Student.findAll({
        where: studentWhere,
        attributes: ['id', 'student_id', 'roll_number', 'first_name', 'last_name', 'class', 'section'],
        order: [['class', 'ASC'], ['section', 'ASC'], ['roll_number', 'ASC'], ['first_name', 'ASC']],
      }),
      StudentAchievement.findAll({
        where: achWhere,
        include: [
          { model: Student, as: 'student', attributes: ['id', 'student_id', 'roll_number', 'first_name', 'last_name', 'class', 'section'] },
          { model: Teacher, as: 'addedByTeacher', attributes: ['id', 'name'] },
        ],
        order: [['event_date', 'DESC'], ['created_at', 'DESC']],
      }),
    ]);

    res.json({
      assignedClasses,
      students: students.map((s) => s.toJSON()),
      achievements: achievements.map((a) => a.toJSON()),
    });
  } catch (err) {
    console.error('[Achievements][GET /incharge]', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/achievements — Add competition / co-curricular achievement (Class Incharge or Admin)
router.post('/', protect, authorize('teacher', 'admin', 'admin2'), async (req, res) => {
  try {
    const {
      student_id,
      category,
      title,
      position,
      event_date = null,
      level = null,
      description = null,
    } = req.body;

    if (!student_id || !category?.trim() || !title?.trim() || !position?.trim()) {
      return res.status(400).json({
        message: 'Student, category, achievement/competition title, and position are required.',
      });
    }

    const student = await Student.findByPk(student_id);
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    if (req.user.role === 'teacher') {
      const ok = await verifyTeacherIncharge(req.user.linked_teacher_id, student.class, student.section);
      if (!ok) {
        return res.status(403).json({
          message: `Only the assigned Class Incharge for ${student.class} - Section ${student.section} can add achievements for this student.`,
        });
      }
    }

    const achievement = await StudentAchievement.create({
      student_id: student.id,
      class: student.class,
      section: student.section,
      session_id: student.session_id || null,
      category: category.trim(),
      title: title.trim(),
      position: position.trim(),
      event_date: event_date || null,
      level: level ? String(level).trim() : null,
      description: description ? String(description).trim() : null,
      added_by_teacher_id: req.user.linked_teacher_id || null,
      added_by_user_id: req.user.id,
    });

    // Notify linked student/parent account if present
    try {
      const linkedUser = await User.findOne({
        where: { linked_student_id: student.id, is_active: true },
        attributes: ['id'],
      });
      if (linkedUser) {
        await Notification.create({
          title: `New Achievement Recognized: ${position.trim()}`,
          message: `Congratulations ${student.first_name}! You received "${position.trim()}" in ${title.trim()} (${category.trim()}).`,
          type: 'achievement',
          recipient_type: 'individual',
          recipient_user_id: linkedUser.id,
          sent_by: req.user.id,
        });
      }
    } catch (notifErr) {
      console.error('[Achievements][POST /] Notification error:', notifErr.message);
    }

    const created = await StudentAchievement.findByPk(achievement.id, {
      include: [
        { model: Student, as: 'student', attributes: ['id', 'student_id', 'roll_number', 'first_name', 'last_name', 'class', 'section'] },
        { model: Teacher, as: 'addedByTeacher', attributes: ['id', 'name'] },
      ],
    });

    res.status(201).json(created.toJSON());
  } catch (err) {
    console.error('[Achievements][POST /]', err);
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/achievements/:id
router.put('/:id', protect, authorize('teacher', 'admin', 'admin2'), async (req, res) => {
  try {
    const achievement = await StudentAchievement.findByPk(req.params.id);
    if (!achievement) return res.status(404).json({ message: 'Achievement record not found.' });

    if (req.user.role === 'teacher') {
      const ok = await verifyTeacherIncharge(req.user.linked_teacher_id, achievement.class, achievement.section);
      if (!ok) return res.status(403).json({ message: 'Access denied.' });
    }

    const { category, title, position, event_date, level, description } = req.body;
    await achievement.update({
      category: category !== undefined ? String(category).trim() : achievement.category,
      title: title !== undefined ? String(title).trim() : achievement.title,
      position: position !== undefined ? String(position).trim() : achievement.position,
      event_date: event_date !== undefined ? (event_date || null) : achievement.event_date,
      level: level !== undefined ? (level ? String(level).trim() : null) : achievement.level,
      description: description !== undefined ? (description ? String(description).trim() : null) : achievement.description,
    });

    const updated = await StudentAchievement.findByPk(achievement.id, {
      include: [
        { model: Student, as: 'student', attributes: ['id', 'student_id', 'roll_number', 'first_name', 'last_name', 'class', 'section'] },
        { model: Teacher, as: 'addedByTeacher', attributes: ['id', 'name'] },
      ],
    });
    res.json(updated.toJSON());
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/achievements/:id
router.delete('/:id', protect, authorize('teacher', 'admin', 'admin2'), async (req, res) => {
  try {
    const achievement = await StudentAchievement.findByPk(req.params.id);
    if (!achievement) return res.status(404).json({ message: 'Achievement record not found.' });

    if (req.user.role === 'teacher') {
      const ok = await verifyTeacherIncharge(req.user.linked_teacher_id, achievement.class, achievement.section);
      if (!ok) return res.status(403).json({ message: 'Access denied.' });
    }

    await achievement.destroy();
    res.json({ message: 'Achievement removed successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
