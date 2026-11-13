const express = require('express');
const router  = express.Router();
const { Op }  = require('sequelize');
const { Teacher, User } = require('../models');
const { protect, authorize, hasPermission, isSuperAdmin } = require('../middleware/auth');
const { makeTeacherId, makeTemporaryPassword } = require('../utils/credentialGenerator');
const { validateTeacherCreate, validateTeacherUpdate } = require('../middleware/validator');
const { sendEmail } = require('../utils/emailService');

// (C3 fix) — whitelisted fields for teacher operations
const TEACHER_CREATE_FIELDS = ['name', 'subject', 'phone', 'status', 'assigned_classes', 'qualification', 'experience', 'date_of_joining', 'email', 'password', 'document_type', 'document_number', 'staff_type'];
const TEACHER_UPDATE_FIELDS = ['name', 'subject', 'phone', 'status', 'assigned_classes', 'qualification', 'experience', 'email', 'document_type', 'document_number', 'staff_type'];

const pick = (obj, keys) => {
  const result = {};
  for (const key of keys) {
    if (obj[key] !== undefined) result[key] = obj[key];
  }
  return result;
};

// GET /api/teachers
// ✅ Both admin and admin2 can view teachers
router.get('/', protect, hasPermission('VIEW_TEACHERS'), async (req, res) => {
  try {
    const { search, status } = req.query;
    const where = {};

    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { name:    { [Op.like]: `%${search}%` } },
        { subject: { [Op.like]: `%${search}%` } },
        { teacher_id: { [Op.like]: `%${search}%` } },
      ];
    }

    const teachers = await Teacher.findAll({
      where,
      include: [
        {
          model: User,
          as: 'teacherUser',
          attributes: ['profile_photo']
        }
      ],
      order: [['name', 'ASC']],
    });

    res.json(teachers);
  } catch (err) {
    console.error('[teachers][GET /] Error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/teachers/:id
// ✅ admin, admin2, and the teacher themselves can view
router.get('/:id', protect, hasPermission('VIEW_TEACHERS'), async (req, res) => {
  try {
    const teacher = await Teacher.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'teacherUser',
          attributes: ['profile_photo']
        }
      ]
    });
    if (!teacher) return res.status(404).json({ message: 'Teacher not found.' });
    res.json(teacher);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/teachers
// ✅ Both admin and admin2 can CREATE teachers — (C3 fix) whitelisted fields
router.post('/', protect, authorize('admin', 'admin2'), validateTeacherCreate, async (req, res) => {
  const txn = await require('../models').sequelize.transaction();
  try {
    const safeData = pick(req.body, TEACHER_CREATE_FIELDS);

    // If custom email (User ID) is provided, verify it is not already taken
    if (safeData.email) {
      const existingUser = await User.findOne({ where: { email: safeData.email }, transaction: txn });
      if (existingUser) {
        await txn.rollback();
        return res.status(400).json({ message: 'Email address (User ID) is already registered.' });
      }
    }

    const teacher = await Teacher.create({ ...safeData, teacher_id: 'PENDING' }, { transaction: txn });
    const teacherId = makeTeacherId(teacher.id);
    await teacher.update({ teacher_id: teacherId }, { transaction: txn });

    // Use custom email/password if provided, fallback to auto-generators
    const userEmail = safeData.email || `${teacherId.toLowerCase()}@school.local`;
    const userPassword = safeData.password || makeTemporaryPassword();

    // Check if the generated fallback email is somehow already taken (safeguard)
    if (!safeData.email) {
      const existingUser = await User.findOne({ where: { email: userEmail }, transaction: txn });
      if (existingUser) {
        await txn.rollback();
        return res.status(400).json({ message: `Auto-generated email ${userEmail} is already registered.` });
      }
    }

    // Determine role based on staff type
    let userRole = 'teacher';
    if (safeData.staff_type === 'Fee Collector') {
      userRole = 'fee_collector';
    } else if (safeData.staff_type === 'Principal' || safeData.staff_type === 'Vice Principal') {
      userRole = 'admin2';
    }

    // Automatically create a corresponding User login record
    await User.create({
      name: teacher.name,
      email: userEmail,
      password: userPassword,
      role: userRole,
      linked_teacher_id: teacher.id,
      is_active: true,
      phone: teacher.phone,
    }, { transaction: txn });

    await txn.commit();

    res.status(201).json({
      teacher,
      credentials: {
        email: userEmail,
        password: safeData.password ? '[MANUALLY_SET]' : userPassword,
      },
      message: 'Teacher created and login credentials generated.',
    });

    // Send email asynchronously
    const emailBody = `Hello ${teacher.name},\n\nYour staff account has been successfully created.\n\nUsername: ${userEmail}\nPassword: ${userPassword}\n\nPlease log in and change your password as soon as possible.\n\nBest Regards,\nSchool Admin`;
    sendEmail(userEmail, 'Welcome to School ERP - Login Credentials', emailBody);

  } catch (err) {
    console.error('[teachers][POST /]', err);
    await txn.rollback();
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/teachers/:id
// ✅ Both admin and admin2 can EDIT teachers — (C3 fix) whitelisted fields
router.put('/:id', protect, authorize('admin', 'admin2'), validateTeacherUpdate, async (req, res) => {
  const txn = await require('../models').sequelize.transaction();
  try {
    const safeData = pick(req.body, TEACHER_UPDATE_FIELDS);
    const teacher = await Teacher.findByPk(req.params.id, { transaction: txn });
    if (!teacher) {
      await txn.rollback();
      return res.status(404).json({ message: 'Teacher not found.' });
    }

    if (safeData.email && safeData.email !== teacher.email) {
      const existingUser = await User.findOne({ where: { email: safeData.email }, transaction: txn });
      if (existingUser && existingUser.linked_teacher_id !== teacher.id) {
        await txn.rollback();
        return res.status(400).json({ message: 'Email address (User ID) is already registered.' });
      }
    }

    await teacher.update(safeData, { transaction: txn });

    // Update corresponding User record if it exists
    const userToUpdate = await User.findOne({ where: { linked_teacher_id: teacher.id }, transaction: txn });
    if (userToUpdate) {
      const userUpdates = {};
      if (safeData.name !== undefined) userUpdates.name = safeData.name;
      if (safeData.phone !== undefined) userUpdates.phone = safeData.phone;
      if (safeData.email !== undefined) userUpdates.email = safeData.email;
      if (safeData.status === 'inactive') userUpdates.is_active = false;
      if (safeData.status === 'active' || safeData.status === 'leave') userUpdates.is_active = true;
      
      // Update role if staff type changed
      if (safeData.staff_type) {
        if (safeData.staff_type === 'Fee Collector') {
          userUpdates.role = 'fee_collector';
        } else if (safeData.staff_type === 'Principal' || safeData.staff_type === 'Vice Principal') {
          userUpdates.role = 'admin2';
        } else {
          userUpdates.role = 'teacher';
        }
      }

      await userToUpdate.update(userUpdates, { transaction: txn });
    }

    await txn.commit();
    
    const updatedTeacher = await Teacher.findByPk(req.params.id, {
      include: [{ model: User, as: 'teacherUser', attributes: ['profile_photo'] }]
    });
    res.json(updatedTeacher);
  } catch (err) {
    await txn.rollback();
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/teachers/:id
// ✅ Both admin and admin2 can delete/deactivate
router.delete('/:id', protect, authorize('admin', 'admin2'), async (req, res) => {
  try {
    await Teacher.update({ status: 'inactive' }, { where: { id: req.params.id } });
    res.json({ message: 'Teacher deactivated.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
