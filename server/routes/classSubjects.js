const express = require('express');
const router = express.Router();
const { ClassSubject, Teacher, ClassIncharge, Student, User } = require('../models');
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
    let teacherId = req.user.linked_teacher_id;
    let teacher = null;

    if (teacherId) {
      teacher = await Teacher.findByPk(teacherId);
    }

    // Self-healing: if linked_teacher_id is not set or teacher record wasn't found by id,
    // match teacher by email or name
    if (!teacher && (req.user.role === 'teacher' || req.user.role === 'admin' || req.user.role === 'admin2')) {
      if (req.user.email) {
        teacher = await Teacher.findOne({ where: { email: req.user.email } });
      }
      if (!teacher && req.user.name) {
        teacher = await Teacher.findOne({ where: { name: req.user.name } });
      }
      if (teacher) {
        teacherId = teacher.id;
        try { await req.user.update({ linked_teacher_id: teacher.id }); } catch (e) {}
      }
    }

    // 1. Fetch explicit assignments from ClassSubject
    let explicitAssignments = [];
    if (teacherId) {
      explicitAssignments = await ClassSubject.findAll({
        where: { teacher_id: teacherId },
        include: [{ model: Teacher, as: 'teacher', attributes: ['id', 'name', 'subject'] }],
      });
    }

    // 2. Fetch incharge records
    const inchargeRows = teacherId
      ? await ClassIncharge.findAll({
          where: { teacher_id: teacherId, is_active: true }
        })
      : [];

    // 3. Parse teacher's assigned_classes
    const assignedClassesRaw = teacher?.assigned_classes
      ? teacher.assigned_classes.split(',').map(c => c.trim()).filter(Boolean)
      : [];

    // 4. Parse teacher's subjects
    const teacherSubjects = teacher?.subject
      ? teacher.subject.split(',').map(s => s.trim()).filter(Boolean)
      : ['General'];

    // 5. Query active student classes & sections to map real sections
    const studentSections = await Student.findAll({
      attributes: ['class', 'section'],
      where: { is_active: true },
      group: ['class', 'section'],
    });

    const sectionMap = {};
    studentSections.forEach(s => {
      if (!sectionMap[s.class]) sectionMap[s.class] = new Set();
      if (s.section) sectionMap[s.class].add(s.section);
    });

    // 6. Build combined assignments
    const combinedMap = new Map();

    // Add explicit assignments first
    explicitAssignments.forEach(ea => {
      const key = `${ea.class}__${ea.section}__${ea.subject}`;
      combinedMap.set(key, {
        id: ea.id,
        class: ea.class,
        section: ea.section,
        subject: ea.subject,
        teacher: ea.teacher || { id: teacherId, name: teacher?.name || req.user.name, subject: teacher?.subject },
      });
    });

    // Add synthesized assignments from assigned_classes and incharges
    const classesToProcess = new Set([
      ...assignedClassesRaw,
      ...inchargeRows.map(i => i.class)
    ]);

    classesToProcess.forEach(cls => {
      const sections = sectionMap[cls] && sectionMap[cls].size > 0
        ? Array.from(sectionMap[cls])
        : ['A'];

      const inchargeForCls = inchargeRows.filter(i => i.class === cls);
      if (inchargeForCls.length > 0) {
        inchargeForCls.forEach(i => {
          if (!sections.includes(i.section)) sections.push(i.section);
        });
      }

      sections.forEach(sec => {
        teacherSubjects.forEach(sub => {
          const key = `${cls}__${sec}__${sub}`;
          if (!combinedMap.has(key)) {
            combinedMap.set(key, {
              id: `syn_${cls}_${sec}_${sub}`.replace(/\s+/g, '_'),
              class: cls,
              section: sec,
              subject: sub,
              teacher: {
                id: teacherId || 0,
                name: teacher?.name || req.user.name,
                subject: teacher?.subject || sub,
              },
            });
          }
        });
      });
    });

    // 7. If STILL empty: fall back to active student classes in the school so teacher is never blocked!
    if (combinedMap.size === 0) {
      const distinctClasses = Object.keys(sectionMap);
      const fallbackClasses = distinctClasses.length > 0
        ? distinctClasses
        : ['Nursery', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];

      fallbackClasses.forEach(cls => {
        const sections = sectionMap[cls] && sectionMap[cls].size > 0
          ? Array.from(sectionMap[cls])
          : ['A'];
        sections.forEach(sec => {
          teacherSubjects.forEach(sub => {
            const key = `${cls}__${sec}__${sub}`;
            if (!combinedMap.has(key)) {
              combinedMap.set(key, {
                id: `fallback_${cls}_${sec}_${sub}`.replace(/\s+/g, '_'),
                class: cls,
                section: sec,
                subject: sub,
                teacher: {
                  id: teacherId || 0,
                  name: teacher?.name || req.user.name,
                  subject: teacher?.subject || sub,
                },
              });
            }
          });
        });
      });
    }

    res.json(Array.from(combinedMap.values()));
  } catch (err) {
    console.error('[GET /api/class-subjects/my-assignments]', err);
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
