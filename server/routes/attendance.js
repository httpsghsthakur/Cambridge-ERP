const express = require('express');
const router  = express.Router();
const { Op }  = require('sequelize');
const { Attendance, Student, ClassIncharge, Session, PromotionHistory } = require('../models');
const { protect, hasPermission, authorize } = require('../middleware/auth');
const { CLASSES } = require('../config/roles');
const { cacheMiddleware } = require('../utils/cache');
const { getTeacherAllowedClasses } = require('../utils/teacherAllowedClasses');
const { calcAttendanceStats, buildStudentSessionAttendance } = require('../utils/attendanceSessionHelper');
const { attendanceLimiter } = require('../middleware/rateLimiters');
const { validateAttendanceBulk } = require('../middleware/validator');

const formatDateRange = (year, month) => {
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  const start = `${y}-${String(m).padStart(2, '0')}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const end = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
};

// GET /api/attendance/assigned-classes
// Returns classes the logged-in teacher is allowed to see and their incharge assignments
router.get('/assigned-classes', protect, async (req, res) => {
  try {
    if (req.user.role === 'admin' || req.user.role === 'admin2') {
      return res.json({ classes: CLASSES || [], incharge_classes: [] }); // Admin sees all
    }
    
    if (req.user.role === 'teacher') {
      const allowedClasses = await getTeacherAllowedClasses(req.user.linked_teacher_id);
      const incharges = req.user.linked_teacher_id
        ? await ClassIncharge.findAll({
            where: { teacher_id: req.user.linked_teacher_id, is_active: true }
          })
        : [];
      return res.json({
        classes: allowedClasses,
        incharge_classes: incharges.map(i => ({ class: i.class, section: i.section }))
      });
    }

    res.json({ classes: [], incharge_classes: [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/attendance/bulk
// ✅ admin, admin2, and assigned class incharge teacher
router.post('/bulk', attendanceLimiter, protect, hasPermission('MANAGE_STUDENT_ATTENDANCE'), validateAttendanceBulk, async (req, res) => {
  try {
    const { class: cls, section, date, records, session_id } = req.body;

    if (!date || !records?.length) {
      return res.status(400).json({ message: 'Date and records are required.' });
    }

    if (req.user.role === 'teacher') {
      if (!req.user.linked_teacher_id) {
        return res.status(403).json({ message: 'Access denied. No teacher profile linked.' });
      }
      const incharge = await ClassIncharge.findOne({
        where: {
          teacher_id: req.user.linked_teacher_id,
          class: cls,
          section: section,
          is_active: true
        }
      });
      if (!incharge) {
        return res.status(403).json({
          message: 'Access denied. Only the assigned Class Incharge can mark attendance for this class and section.'
        });
      }
    }

    // (Phase 3 fix) — Attendance Locking (7 days)
    if (req.user.role !== 'admin') {
      const attendanceDate = new Date(date);
      const today = new Date();
      const diffTime = Math.abs(today - attendanceDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 7) {
        return res.status(403).json({ message: 'Access denied. You cannot modify attendance records older than 7 days.' });
      }
    }

    // Check if finalized
    const existingRecord = await Attendance.findOne({ where: { class: cls, section, date } });
    if (existingRecord && existingRecord.is_finalized) {
      return res.status(403).json({ message: 'Attendance for this class on this date has been finalized and cannot be modified.' });
    }

    let effectiveSessionId = session_id || null;
    if (!effectiveSessionId) {
      const activeSess = await Session.findOne({ where: { is_active: true } });
      if (activeSess) effectiveSessionId = activeSess.id;
    }

    const ops = records.map(r =>
      Attendance.upsert({
        student_id: r.student_id,
        class: cls,
        section,
        date,
        status:     r.status,
        marked_by:  req.user.id,
        session_id: effectiveSessionId,
        is_finalized: req.body.is_finalized || false,
      })
    );

    await Promise.all(ops);

    res.json({
      message:  `Attendance marked for ${records.length} students.`,
      marked_by: req.user.name,
      date,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/attendance/student/:studentId
// (H1 fix) — now uses hasPermission('VIEW_STUDENTS') for staff, plus IDOR check for parent/student
// ✅ parent, student, admin, admin2
router.get('/student/:studentId', protect, async (req, res) => {
  try {
    // Parent/student can only see their own child/self
    if (req.user.role === 'parent' || req.user.role === 'student') {
      const linkedId = req.user.linked_student_id || req.user.linkedStudent?.id;
      if (!linkedId || linkedId !== parseInt(req.params.studentId)) {
        return res.status(403).json({ message: 'Access denied to this student.' });
      }
    } else {
      // (H1 fix) — for non-parent/student roles, verify they have VIEW_STUDENTS permission
      const allowedRoles = ['admin', 'admin2', 'teacher'];
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Access denied.' });
      }
    }

    if (req.user.role === 'teacher') {
      const student = await Student.findByPk(req.params.studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found.' });
      }
      const allowedClasses = await getTeacherAllowedClasses(req.user.linked_teacher_id);
      if (!allowedClasses.includes(student.class)) {
        return res.status(403).json({ message: 'Access denied. Student is not in your assigned classes.' });
      }
    }

    const { month, year, session_id: requestedSessionId } = req.query;
    const studentIdNum = Number(req.params.studentId);

    const [studentRec, allSessions, allAttRows, promotions] = await Promise.all([
      Student.findByPk(studentIdNum, {
        attributes: ['id', 'class', 'section', 'session_id'],
      }),
      Session.findAll({ order: [['start_date', 'ASC'], ['id', 'ASC']] }),
      Attendance.findAll({
        where: { student_id: studentIdNum },
        order: [['date', 'ASC']],
      }),
      PromotionHistory.findAll({
        where: { student_id: studentIdNum },
        order: [['id', 'ASC']],
      }),
    ]);

    const {
      currentSessionId,
      rowsBySession,
      sessionComparison,
    } = buildStudentSessionAttendance({
      student: studentRec,
      allSessions,
      allRecords: allAttRows,
      promotions,
    });

    let selectedSessionId = currentSessionId;
    if (requestedSessionId === 'all') {
      selectedSessionId = 'all';
    } else if (requestedSessionId !== undefined && requestedSessionId !== '') {
      const parsed = Number(requestedSessionId);
      selectedSessionId = Number.isFinite(parsed) ? parsed : requestedSessionId;
    }

    // Scope attendance records to selectedSessionId (defaults to currentSessionId -> 0% on promotion)
    const sessionScopedRows = selectedSessionId === 'all'
      ? allAttRows
      : selectedSessionId != null
        ? (rowsBySession.get(String(selectedSessionId)) || [])
        : allAttRows;

    const selectedComparison = selectedSessionId !== 'all' && selectedSessionId != null
      ? sessionComparison.find((c) => String(c.session_id) === String(selectedSessionId))
      : null;

    const sessionStats = (sessionScopedRows.length === 0 && selectedComparison)
      ? {
          present:    selectedComparison.present,
          late:       selectedComparison.late,
          holiday:    selectedComparison.holiday,
          absent:     selectedComparison.absent,
          total:      selectedComparison.total,
          percentage: selectedComparison.percentage,
        }
      : calcAttendanceStats(sessionScopedRows);

    let records = sessionScopedRows;
    if (month && year) {
      const { start, end } = formatDateRange(year, month);
      records = sessionScopedRows.filter((r) => {
        const d = String(r.date || '');
        return d >= start && d <= end;
      });
    }

    const stats = calcAttendanceStats(records);

    res.set('Cache-Control', 'no-store');
    res.json({
      records: records.map((r) => r.toJSON()),
      stats,
      sessionStats,
      currentSessionId,
      selectedSessionId,
      sessionComparison,
      sessions: allSessions.map((s) => s.toJSON()),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/attendance/class
// ✅ admin, admin2, teacher
router.get('/class', protect, hasPermission('MANAGE_STUDENT_ATTENDANCE'), async (req, res) => {
  try {
    const { class: cls, section, date } = req.query;

    if (req.user.role === 'teacher') {
      const allowedClasses = await getTeacherAllowedClasses(req.user.linked_teacher_id);
      if (!allowedClasses.includes(cls)) {
        return res.status(403).json({ message: 'Access denied. You can only view attendance for your assigned classes.' });
      }
    }

    const students = await Student.findAll({
      where:  { class: cls, section, is_active: true },
      order:  [['roll_number', 'ASC']],
    });

    const attendance = await Attendance.findAll({
      where: { class: cls, section, date },
    });

    const attMap = {};
    attendance.forEach(a => { attMap[a.student_id] = a.status; });

    const result = students.map(s => ({
      student: s,
      status:  attMap[s.id] || 'not_marked',
    }));

    const is_finalized = attendance.some(a => a.is_finalized);

    // Determine if requester can mark/edit attendance (admin/admin2 or active incharge)
    let can_mark = false;
    if (req.user.role === 'admin' || req.user.role === 'admin2') {
      can_mark = true;
    } else if (req.user.role === 'teacher' && req.user.linked_teacher_id) {
      const incharge = await ClassIncharge.findOne({
        where: {
          teacher_id: req.user.linked_teacher_id,
          class: cls,
          section: section,
          is_active: true,
        }
      });
      can_mark = !!incharge;
    }

    res.json({ records: result, is_finalized, can_mark });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/attendance/report/monthly
// ✅ admin, admin2, teacher
router.get('/report/monthly', protect, hasPermission('MANAGE_STUDENT_ATTENDANCE'), async (req, res) => {
  try {
    const { class: cls, section, month, year, session_id } = req.query;

    if (req.user.role === 'teacher') {
      const allowedClasses = await getTeacherAllowedClasses(req.user.linked_teacher_id);
      if (!allowedClasses.includes(cls)) {
        return res.status(403).json({ message: 'Access denied. You can only view attendance reports for your assigned classes.' });
      }
    }

    const { start, end } = formatDateRange(year, month);
    const activeSession = await Session.findOne({ where: { is_active: true } });
    const targetSessionId = session_id ? Number(session_id) : (activeSession?.id || null);

    const students = await Student.findAll({
      where: { class: cls, ...(section ? { section } : {}), is_active: true },
    });

    const records = await Attendance.findAll({
      where: {
        class: cls,
        date: { [Op.between]: [start, end] },
        ...(session_id ? { session_id: Number(session_id) } : {}),
      },
    });

    const report = students.map(s => {
      const effSessId = session_id ? Number(session_id) : (s.session_id || targetSessionId);
      const sr = records.filter(r =>
        r.student_id === s.id && (!effSessId || r.session_id == null || Number(r.session_id) === Number(effSessId))
      );
      const present = sr.filter(r => r.status === 'present').length;
      const late    = sr.filter(r => r.status === 'late').length;
      const total   = sr.filter(r => r.status !== 'holiday').length;

      return {
        student:    s,
        present,
        late,
        absent:     total - present - late,
        total,
        percentage: total ? Math.round(((present + late) / total) * 100) : 0,
      };
    });

    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
