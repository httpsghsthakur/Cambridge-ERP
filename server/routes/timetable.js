const express = require('express');
const router = express.Router();
const { Timetable, Teacher, ClassIncharge } = require('../models');
const { protect, authorize, hasPermission } = require('../middleware/auth');
const { cacheMiddleware } = require('../utils/cache');

// (C3 fix) — whitelisted fields for timetable
const TIMETABLE_FIELDS = ['class', 'section', 'day', 'period_number', 'subject', 'teacher_id', 'start_time', 'end_time'];

const pick = (obj, keys) => {
  const result = {};
  for (const key of keys) {
    if (obj[key] !== undefined) result[key] = obj[key];
  }
  return result;
};

// Check if user is Admin or the active Class Incharge for the targeted class & section
const canManageClassTimetable = async (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'admin2') {
    return next();
  }

  if (req.user.role === 'teacher') {
    let cls = req.body?.class || req.query?.class;
    let section = req.body?.section || req.query?.section;

    // If id is provided in params (for PUT /:id or DELETE /:id)
    if ((!cls || !section) && req.params?.id) {
      const slot = await Timetable.findByPk(req.params.id);
      if (!slot) return res.status(404).json({ message: 'Timetable slot not found.' });
      cls = slot.class;
      section = slot.section;
    }

    if (!cls || !section) {
      return res.status(400).json({ message: 'Class and section are required to verify timetable permissions.' });
    }

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

    if (incharge) {
      return next();
    }

    return res.status(403).json({
      message: `Access denied. Only the assigned Class Incharge or Admin can edit the timetable for ${cls} - ${section}.`
    });
  }

  return res.status(403).json({ message: 'Access denied.' });
};

// GET /api/timetable/teacher-schedules
// Returns a lightweight map of { teacher_id: { day: [period_numbers] } }
router.get('/teacher-schedules', protect, hasPermission('VIEW_TIMETABLE'), async (req, res) => {
  try {
    const schedules = await Timetable.findAll({
      attributes: ['teacher_id', 'day', 'period_number'],
      raw: true
    });
    
    // Group by teacher
    const teacherMap = {};
    schedules.forEach(slot => {
      if (!slot.teacher_id) return;
      if (!teacherMap[slot.teacher_id]) teacherMap[slot.teacher_id] = {};
      if (!teacherMap[slot.teacher_id][slot.day]) teacherMap[slot.teacher_id][slot.day] = [];
      teacherMap[slot.teacher_id][slot.day].push(slot.period_number);
    });
    
    res.json(teacherMap);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/timetable/config?class=...&section=...
router.get('/config', protect, hasPermission('VIEW_TIMETABLE'), async (req, res) => {
  try {
    let { class: cls, section } = req.query;
    if ((req.user.role === 'parent' || req.user.role === 'student') && req.user.linkedStudent) {
      cls = cls || req.user.linkedStudent.class;
      section = section || req.user.linkedStudent.section;
    }
    const { Setting } = require('../models');
    let setting = null;
    if (cls && section) {
      setting = await Setting.findOne({ where: { key: `timetable_config_${cls}_${section}` } });
    }
    if (!setting) {
      setting = await Setting.findOne({ where: { key: 'timetable_config_default' } });
    }
    res.set('Cache-Control', 'no-store');
    res.json(setting ? JSON.parse(setting.value) : null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/timetable/config
router.put('/config', protect, canManageClassTimetable, async (req, res) => {
  try {
    const { class: cls, section, config } = req.body;
    const { Setting } = require('../models');
    const key = (cls && section) ? `timetable_config_${cls}_${section}` : 'timetable_config_default';
    await Setting.upsert({
      key,
      value: JSON.stringify(config)
    });
    res.json({ message: 'Timetable configuration saved successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/timetable?class=Class 8&section=A
// (H8 fix) — now uses VIEW_TIMETABLE permission instead of just protect
router.get('/', protect, hasPermission('VIEW_TIMETABLE'), async (req, res) => {
  try {
    let { class: cls, section, teacher_id } = req.query;
    if ((req.user.role === 'parent' || req.user.role === 'student') && req.user.linkedStudent) {
      cls = cls || req.user.linkedStudent.class;
      section = section || req.user.linkedStudent.section;
    }
    const where = {};
    if (cls)        where.class      = cls;
    if (section)    where.section    = section;
    if (teacher_id) where.teacher_id = teacher_id;

    // Filter out drafts for parents and students
    if (req.user.role === 'parent' || req.user.role === 'student') {
      where.status = 'published';
    }

    const timetable = await Timetable.findAll({
      where,
      include: [{ model: Teacher, as: 'teacher', attributes: ['id', 'name', 'subject'] }],
      order: [
        ['day', 'ASC'],
        ['period_number', 'ASC']
      ]
    });

    res.set('Cache-Control', 'no-store');
    res.json(timetable.map(slot => slot.toJSON()));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/timetable — (C3 fix) whitelisted fields
router.post('/', protect, canManageClassTimetable, async (req, res) => {
  try {
    const safeData = pick(req.body, TIMETABLE_FIELDS);
    const slot = await Timetable.create(safeData);
    res.status(201).json(slot);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/timetable/bulk-save
router.put('/bulk-save', protect, canManageClassTimetable, async (req, res) => {
  try {
    const { class: cls, section, slots, status, config } = req.body;
    if (!cls || !section) return res.status(400).json({ message: 'Class and section required.' });
    
    // Wipe existing slots for this class and section
    await Timetable.destroy({ where: { class: cls, section } });
    
    // Insert new slots
    const newSlots = (slots || []).map(s => ({
      class: cls,
      section: section,
      day: s.day,
      period_number: s.period_number,
      subject: s.subject,
      teacher_id: s.teacher_id,
      start_time: s.start_time || null,
      end_time: s.end_time || null,
      status: status || 'draft'
    }));
    
    if (newSlots.length > 0) {
      await Timetable.bulkCreate(newSlots);
    }
    
    // Persist schedule configuration if provided
    if (config) {
      const { Setting } = require('../models');
      await Setting.upsert({
        key: `timetable_config_${cls}_${section}`,
        value: JSON.stringify(config)
      });
    }

    res.json({ message: `Timetable saved as ${status || 'draft'} successfully.` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/timetable/bulk-publish
router.put('/bulk-publish', protect, canManageClassTimetable, async (req, res) => {
  try {
    const { class: cls, section } = req.body;
    if (!cls || !section) return res.status(400).json({ message: 'Class and section required.' });
    
    await Timetable.update({ status: 'published' }, { where: { class: cls, section } });
    res.json({ message: 'Timetable published successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/timetable/:id — (C3 fix) whitelisted fields
router.put('/:id', protect, canManageClassTimetable, async (req, res) => {
  try {
    const safeData = pick(req.body, TIMETABLE_FIELDS);
    await Timetable.update(safeData, { where: { id: req.params.id } });
    const slot = await Timetable.findByPk(req.params.id, {
      include: [{ model: Teacher, as: 'teacher' }]
    });
    res.json(slot);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/timetable/:id
router.delete('/:id', protect, canManageClassTimetable, async (req, res) => {
  try {
    await Timetable.destroy({ where: { id: req.params.id } });
    res.json({ message: 'Timetable slot deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;