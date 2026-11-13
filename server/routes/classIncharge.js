const express = require('express');
const router  = express.Router();
const { ClassIncharge, Teacher } = require('../models');
const { protect, hasPermission } = require('../middleware/auth');

// (C3 fix) — whitelisted update fields
const INCHARGE_UPDATE_FIELDS = ['teacher_id', 'class', 'section', 'session_id', 'is_active'];

const pick = (obj, keys) => {
  const result = {};
  for (const key of keys) {
    if (obj[key] !== undefined) result[key] = obj[key];
  }
  return result;
};

// GET /api/class-incharge/my-incharge
// ✅ Returns classes where current logged-in user is assigned as active class incharge
router.get('/my-incharge', protect, async (req, res) => {
  try {
    if (req.user.role === 'admin' || req.user.role === 'admin2') {
      return res.json({ isAdmin: true, incharges: [] });
    }
    if (!req.user.linked_teacher_id) {
      return res.json({ isAdmin: false, incharges: [] });
    }
    const incharges = await ClassIncharge.findAll({
      where: { teacher_id: req.user.linked_teacher_id, is_active: true },
      order: [['class', 'ASC'], ['section', 'ASC']]
    });
    return res.json({ isAdmin: false, incharges });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/class-incharge
// ✅ Admin, admin2, and teachers can view incharge assignments
router.get('/', protect, hasPermission('VIEW_TEACHERS'), async (req, res) => {
  try {
    const { session_id } = req.query;
    const where = { is_active: true };
    if (session_id) where.session_id = session_id;

    const incharges = await ClassIncharge.findAll({
      where,
      include: [{
        model: Teacher,
        as: 'teacher',
        attributes: ['id', 'name', 'subject', 'teacher_id'],
      }],
      order: [['class', 'ASC'], ['section', 'ASC']],
    });

    res.json(incharges);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/class-incharge
// ✅ Both admin and admin2 can assign class incharge
router.post('/', protect, hasPermission('ASSIGN_INCHARGE'), async (req, res) => {
  try {
    const { teacher_id, class: cls, section, session_id } = req.body;

    if (!teacher_id || !cls || !section) {
      return res.status(400).json({ message: 'teacher_id, class, and section are required.' });
    }

    // Verify teacher exists
    const teacher = await Teacher.findByPk(teacher_id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found.' });
    }

    // Deactivate existing incharge for this class+section+session
    await ClassIncharge.update(
      { is_active: false },
      { where: { class: cls, section, ...(session_id ? { session_id } : {}) } }
    );

    const incharge = await ClassIncharge.create({
      teacher_id,
      class: cls,
      section,
      session_id: session_id || null,
      assigned_by: req.user.id,
    });

    // Fetch with teacher details for response
    const withDetails = await ClassIncharge.findByPk(incharge.id, {
      include: [{ model: Teacher, as: 'teacher', attributes: ['id', 'name', 'subject', 'teacher_id'] }],
    });

    res.status(201).json({
      message:   `${teacher.name} assigned as incharge for ${cls} - ${section}.`,
      incharge:  withDetails,
      assigned_by: req.user.name,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/class-incharge/:id — (C3 fix) whitelisted fields
// ✅ Admin and admin2 can update
router.put('/:id', protect, hasPermission('ASSIGN_INCHARGE'), async (req, res) => {
  try {
    const safeData = pick(req.body, INCHARGE_UPDATE_FIELDS);
    const [updated] = await ClassIncharge.update(safeData, {
      where: { id: req.params.id },
    });
    if (!updated) return res.status(404).json({ message: 'Incharge record not found.' });

    const incharge = await ClassIncharge.findByPk(req.params.id, {
      include: [{ model: Teacher, as: 'teacher' }],
    });
    res.json(incharge);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/class-incharge/:id
// ✅ Admin and admin2 can remove
router.delete('/:id', protect, hasPermission('ASSIGN_INCHARGE'), async (req, res) => {
  try {
    await ClassIncharge.update({ is_active: false }, { where: { id: req.params.id } });
    res.json({ message: 'Incharge assignment removed.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;