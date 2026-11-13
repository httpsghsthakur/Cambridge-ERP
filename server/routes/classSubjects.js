const express = require('express');
const router = express.Router();
const { ClassSubject, Teacher, ClassIncharge } = require('../models');
const { protect, authorize, hasPermission } = require('../middleware/auth');

// GET /api/class-subjects
router.get('/', protect, async (req, res) => {
  try {
    const { class: cls, section, teacher_id } = req.query;
    const where = {};
    if (cls) where.class = cls;
    if (section) where.section = section;
    if (teacher_id) where.teacher_id = teacher_id;

    const subjects = await ClassSubject.findAll({
      where,
      include: [{ model: Teacher, as: 'teacher', attributes: ['id', 'name', 'subject'] }],
      order: [['id', 'DESC']]
    });
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/class-subjects/my-assignments (For teachers)
router.get('/my-assignments', protect, async (req, res) => {
  try {
    if (req.user.role !== 'teacher' || !req.user.linked_teacher_id) {
      return res.status(403).json({ message: 'Only teachers can fetch their assignments.' });
    }

    const assignments = await ClassSubject.findAll({
      where: { teacher_id: req.user.linked_teacher_id },
      include: [{ model: Teacher, as: 'teacher', attributes: ['id', 'name', 'subject'] }]
    });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/class-subjects
router.post('/', protect, async (req, res) => {
  try {
    const { class: cls, section, subject, teacher_id } = req.body;
    if (!cls || !section) return res.status(400).json({ message: 'Class and section required.' });

    if (req.user.role === 'teacher') {
      if (!req.user.linked_teacher_id) {
        return res.status(403).json({ message: 'Access denied. No teacher profile linked.' });
      }
      const incharge = await ClassIncharge.findOne({
        where: { teacher_id: req.user.linked_teacher_id, class: cls, section, is_active: true }
      });
      if (!incharge) {
        return res.status(403).json({ message: 'Access denied. Only the assigned Class Incharge or Admin can assign subjects for this class.' });
      }
    } else if (req.user.role !== 'admin' && req.user.role !== 'admin2') {
      return res.status(403).json({ message: 'Access denied.' });
    }
    
    // Check if assignment already exists
    const existing = await ClassSubject.findOne({
      where: { class: cls, section, subject, teacher_id }
    });
    
    if (existing) {
      return res.status(400).json({ message: 'Teacher is already assigned to this subject for this class.' });
    }

    const newAssignment = await ClassSubject.create({ class: cls, section, subject, teacher_id });
    const assignmentWithTeacher = await ClassSubject.findByPk(newAssignment.id, {
      include: [{ model: Teacher, as: 'teacher', attributes: ['id', 'name', 'subject'] }]
    });
    
    res.status(201).json(assignmentWithTeacher);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/class-subjects/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const assignment = await ClassSubject.findByPk(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found.' });

    if (req.user.role === 'teacher') {
      if (!req.user.linked_teacher_id) {
        return res.status(403).json({ message: 'Access denied. No teacher profile linked.' });
      }
      const incharge = await ClassIncharge.findOne({
        where: { teacher_id: req.user.linked_teacher_id, class: assignment.class, section: assignment.section, is_active: true }
      });
      if (!incharge) {
        return res.status(403).json({ message: 'Access denied. Only the assigned Class Incharge or Admin can remove subjects for this class.' });
      }
    } else if (req.user.role !== 'admin' && req.user.role !== 'admin2') {
      return res.status(403).json({ message: 'Access denied.' });
    }
    
    await assignment.destroy();
    res.json({ message: 'Assignment removed.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
