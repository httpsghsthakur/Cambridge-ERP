const express = require('express');
const router  = express.Router();
const { Op }  = require('sequelize');
const { TeacherAttendance, Teacher } = require('../models');
const { protect, hasPermission } = require('../middleware/auth');

const formatDateRange = (year, month) => {
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  const start = `${y}-${String(m).padStart(2, '0')}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const end = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
};

// GET /api/teacher-attendance
// ✅ Both admin and admin2 can view all teacher attendance
router.get('/', protect, hasPermission('MANAGE_TEACHER_ATTENDANCE'), async (req, res) => {
  try {
    const { date, teacher_id, month, year } = req.query;
    const where = {};

    if (date)       where.date       = date;
    if (teacher_id) where.teacher_id = teacher_id;

    if (month && year) {
      const { start, end } = formatDateRange(year, month);
      where.date  = { [Op.between]: [start, end] };
    }

    const records = await TeacherAttendance.findAll({
      where,
      include: [{
        model: Teacher,
        as: 'teacher',
        attributes: ['id', 'teacher_id', 'name', 'subject'],
      }],
      order: [['date', 'DESC'], ['created_at', 'ASC']],
    });

    res.json(records);
  } catch (err) {
    console.error('[teacher-attendance][GET /]', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/teacher-attendance/my
// ✅ Teacher views their own attendance
router.get('/my', protect, hasPermission('VIEW_TEACHER_ATTENDANCE'), async (req, res) => {
  try {
    // Only teachers use this endpoint — admins use the general one above
    if (!['teacher'].includes(req.user.role)) {
      return res.status(403).json({ message: 'This endpoint is for teachers only. Use /api/teacher-attendance instead.' });
    }

    const teacher = await Teacher.findOne({
      where: { id: req.user.linked_teacher_id },
    });

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not linked to your account.' });
    }

    const { month, year } = req.query;
    const where = { teacher_id: teacher.id };

    if (month && year) {
      const { start, end } = formatDateRange(year, month);
      where.date  = { [Op.between]: [start, end] };
    }

    const records = await TeacherAttendance.findAll({
      where,
      order: [['date', 'ASC']],
    });

    const present = records.filter(r => r.status === 'present' || r.status === 'half_day').length;
    const total   = records.filter(r => r.status !== 'holiday').length;

    res.json({
      records,
      stats: {
        present,
        absent:     total - present,
        total,
        percentage: total ? Math.round((present / total) * 100) : 0,
      },
    });
  } catch (err) {
    console.error('[teacher-attendance][GET /my]', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/teacher-attendance/bulk
// ✅ Both admin and admin2 can mark teacher attendance
router.post('/bulk', protect, hasPermission('MANAGE_TEACHER_ATTENDANCE'), async (req, res) => {
  try {
    const { date, records } = req.body;

    if (!date || !records || !Array.isArray(records)) {
      return res.status(400).json({ message: 'Date and records array are required.' });
    }

    const teacherIds = records.map((r) => r.teacher_id).filter(Boolean);
    const existingTeachers = await Teacher.findAll({
      where: { id: teacherIds },
      attributes: ['id'],
    });
    const existingTeacherIds = new Set(existingTeachers.map((teacher) => teacher.id));
    const missingTeacherId = teacherIds.find((teacherId) => !existingTeacherIds.has(teacherId));

    if (missingTeacherId) {
      return res.status(400).json({ message: `Teacher ${missingTeacherId} not found.` });
    }

    const ops = records.map(r =>
      TeacherAttendance.upsert({
        teacher_id: r.teacher_id,
        date,
        status:     r.status,
        marked_by:  req.user.id,
        remarks:    r.remarks || null,
      })
    );

    await Promise.all(ops);

    res.json({
      message:  `Attendance marked for ${records.length} teacher(s).`,
      marked_by: req.user.name,
      date,
    });
  } catch (err) {
    console.error('[teacher-attendance][POST /bulk]', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/teacher-attendance/summary/:teacherId
// ✅ Admin and admin2 can view any teacher's summary
router.get('/summary/:teacherId', protect, hasPermission('MANAGE_TEACHER_ATTENDANCE'), async (req, res) => {
  try {
    const { month, year } = req.query;
    const where = { teacher_id: req.params.teacherId };

    if (month && year) {
      const { start, end } = formatDateRange(year, month);
      where.date = { [Op.between]: [start, end] };
    }

    const records    = await TeacherAttendance.findAll({ where, order: [['date', 'ASC']] });
    const present    = records.filter(r => ['present', 'half_day'].includes(r.status)).length;
    const total      = records.filter(r => r.status !== 'holiday').length;

    res.json({
      records,
      stats: {
        present,
        absent:     total - present,
        total,
        percentage: total ? Math.round((present / total) * 100) : 0,
      },
    });
  } catch (err) {
    console.error('[teacher-attendance][GET /summary/:teacherId]', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
