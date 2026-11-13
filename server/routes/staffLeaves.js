const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { StaffLeave, Teacher, Notification, User } = require('../models');
const { protect, hasPermission } = require('../middleware/auth');

// Multer Setup for Leave Attachments
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'public', 'uploads', 'leaves');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'), false);
    }
  }
});

// GET /api/staff-leaves (Admin)
router.get('/', protect, hasPermission('MANAGE_TEACHER_ATTENDANCE'), async (req, res) => {
  try {
    const { status, staff_type, name, start_date, end_date } = req.query;
    
    let where = {};
    if (status) where.status = status;
    if (start_date && end_date) {
      where.start_date = { [Op.gte]: start_date };
      where.end_date = { [Op.lte]: end_date };
    }

    let teacherWhere = {};
    if (staff_type) teacherWhere.staff_type = staff_type;
    if (name) teacherWhere.name = { [Op.like]: `%${name}%` };

    const leaves = await StaffLeave.findAll({
      where,
      include: [{ 
        model: Teacher, 
        as: 'teacher', 
        attributes: ['id', 'name', 'teacher_id', 'staff_type'],
        where: Object.keys(teacherWhere).length > 0 ? teacherWhere : undefined
      }],
      order: [['created_at', 'DESC']]
    });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/staff-leaves/pending (Admin - Legacy compatibility if needed)
router.get('/pending', protect, hasPermission('MANAGE_TEACHER_ATTENDANCE'), async (req, res) => {
  try {
    const leaves = await StaffLeave.findAll({
      where: { status: 'pending' },
      include: [{ model: Teacher, as: 'teacher', attributes: ['id', 'name', 'teacher_id', 'staff_type'] }],
      order: [['created_at', 'DESC']]
    });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/staff-leaves/my-leaves (Staff/Teacher)
router.get('/my-leaves', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user.linked_teacher_id) {
      return res.status(403).json({ message: 'No staff profile linked to this user.' });
    }

    const leaves = await StaffLeave.findAll({
      where: { teacher_id: user.linked_teacher_id },
      order: [['created_at', 'DESC']]
    });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/staff-leaves/teacher/:id
router.get('/teacher/:id', protect, hasPermission('MANAGE_TEACHER_ATTENDANCE'), async (req, res) => {
  try {
    const teacherId = req.params.id;
    const leaves = await StaffLeave.findAll({
      where: { teacher_id: teacherId },
      order: [['created_at', 'DESC']]
    });

    const teacher = await Teacher.findByPk(teacherId, { attributes: ['id', 'name', 'teacher_id', 'staff_type'] });
    if (!teacher) return res.status(404).json({ message: 'Staff not found' });

    const leavesAllowed = 20; 
    let leavesTaken = 0;
    leaves.forEach(l => {
      if (l.status === 'approved') leavesTaken += parseFloat(l.total_days || 0);
    });

    res.json({
      teacher, leaves,
      summary: { total_available: leavesAllowed, taken: leavesTaken, balance: Math.max(leavesAllowed - leavesTaken, 0) }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/staff-leaves/:id/status
router.put('/:id/status', protect, hasPermission('MANAGE_TEACHER_ATTENDANCE'), async (req, res) => {
  try {
    const { status, admin_remarks } = req.body;
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status.' });

    const leave = await StaffLeave.findByPk(req.params.id, {
      include: [{ model: Teacher, as: 'teacher' }]
    });
    if (!leave) return res.status(404).json({ message: 'Leave request not found.' });

    await leave.update({ 
      status, 
      admin_remarks,
      approved_by: req.user.id,
      action_date: new Date()
    });

    // Notify the staff member
    if (leave.teacher) {
      const staffUser = await User.findOne({ where: { linked_teacher_id: leave.teacher.id } });
      if (staffUser) {
        await Notification.create({
          title: `Leave Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
          message: `Your leave application for ${leave.start_date} has been ${status}.${admin_remarks ? ' Reason: ' + admin_remarks : ''}`,
          type: 'general',
          recipient_type: 'individual',
          recipient_user_id: staffUser.id,
          sent_by: req.user.id
        });
      }
    }

    res.json({ message: `Leave request ${status}`, leave });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/staff-leaves
router.post('/', protect, upload.single('attachment'), async (req, res) => {
  try {
    const { leave_type, start_date, end_date, reason } = req.body;
    let total_days = parseFloat(req.body.total_days);
    
    let teacherId = req.body.teacher_id;
    
    // If a staff is submitting their own
    if (!teacherId) {
       const user = await User.findByPk(req.user.id);
       if (!user.linked_teacher_id) return res.status(403).json({ message: 'No staff profile linked.' });
       teacherId = user.linked_teacher_id;
    }

    // Check for past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sDate = new Date(start_date);
    if (sDate < today) {
       // Only allow past dates if admin
       if (!['admin', 'admin2'].includes(req.user.role)) {
         return res.status(400).json({ message: 'You cannot apply for a leave in the past.' });
       }
    }

    // Check for overlaps
    const overlaps = await StaffLeave.count({
      where: {
        teacher_id: teacherId,
        status: { [Op.ne]: 'rejected' },
        [Op.or]: [
          { start_date: { [Op.between]: [start_date, end_date] } },
          { end_date: { [Op.between]: [start_date, end_date] } },
          {
             start_date: { [Op.lte]: start_date },
             end_date: { [Op.gte]: end_date }
          }
        ]
      }
    });

    if (overlaps > 0) return res.status(400).json({ message: 'Overlapping leave dates found.' });

    let attachment_url = null;
    if (req.file) {
      attachment_url = `/uploads/leaves/${req.file.filename}`;
    }

    const leave = await StaffLeave.create({
      teacher_id: teacherId,
      leave_type,
      start_date,
      end_date,
      total_days,
      reason,
      attachment_url,
      status: 'pending'
    });
    
    // Notify Admin
    await Notification.create({
      title: 'New Leave Request',
      message: `A new leave request was submitted for ${start_date}.`,
      type: 'general',
      recipient_type: 'role',
      recipient_role: 'admin' // Notifying admins
    });

    res.status(201).json(leave);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
