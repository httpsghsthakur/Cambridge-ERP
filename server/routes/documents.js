const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const { DocumentRequest, DocumentSubmission, User, Student, Teacher } = require('../models');
const { protect, hasPermission } = require('../middleware/auth');

// ── Multer Setup ─────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'public', 'uploads', 'documents');
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
    // Strict MIME-type validation to prevent RCE
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'), false);
    }
  }
});

// ── GET Requests ─────────────────────────────────────────────────────────────
router.get('/requests', protect, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      // Admins see all
      const requests = await DocumentRequest.findAll({
        order: [['id', 'DESC']],
        include: [{ model: User, as: 'creator', attributes: ['name'] }]
      });
      return res.json({ requests });
    }

    // Standard user logic
    const { role, id } = req.user;
    
    // Build where clause
    const conditions = [
      { recipient_type: 'everyone' }
    ];
    
    if (role === 'student' || role === 'parent') {
      conditions.push({ recipient_type: 'all_students' });
    } else if (role === 'teacher') {
      conditions.push({ recipient_type: 'all_teachers' });
    }

    // For 'individual' recipient_type, we need to check if id is in the JSON array
    // Sequelize JSON querying can vary, but a simple way is using literal or LIKE on serialized string
    conditions.push({
      recipient_type: 'individual',
      recipients: {
        [Op.like]: `%${id}%` // Simple fallback since JSON array serialization usually includes the ID
      }
    });

    const requests = await DocumentRequest.findAll({
      where: {
        status: 'active',
        [Op.or]: conditions
      },
      order: [['id', 'DESC']],
      include: [
        { model: User, as: 'creator', attributes: ['name'] },
        // Also fetch user's own submission to check status
        { 
          model: DocumentSubmission, 
          as: 'submissions', 
          where: { user_id: id },
          required: false // LEFT JOIN
        }
      ]
    });

    res.json({ requests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch document requests' });
  }
});

// ── POST / PUT / DELETE Requests (Admin Only) ───────────────────────────────
router.post('/requests', protect, hasPermission('MANAGE_DOCUMENTS'), async (req, res) => {
  try {
    const { title, description, document_type, recipient_type, recipients, custom_fields, deadline } = req.body;
    
    const request = await DocumentRequest.create({
      title,
      description,
      document_type: document_type || 'any',
      recipient_type,
      recipients: recipients || [],
      custom_fields: custom_fields || [],
      deadline,
      created_by: req.user.id
    });

    res.status(201).json({ message: 'Request created', request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create request' });
  }
});

router.put('/requests/:id', protect, hasPermission('MANAGE_DOCUMENTS'), async (req, res) => {
  try {
    const request = await DocumentRequest.findByPk(req.params.id);
    if (!request) return res.status(404).json({ message: 'Not found' });

    await request.update(req.body);
    res.json({ message: 'Request updated', request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update request' });
  }
});

router.delete('/requests/:id', protect, hasPermission('MANAGE_DOCUMENTS'), async (req, res) => {
  try {
    const request = await DocumentRequest.findByPk(req.params.id);
    if (!request) return res.status(404).json({ message: 'Not found' });

    await request.destroy();
    res.json({ message: 'Request deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete request' });
  }
});

// ── POST Submit Document (User) ──────────────────────────────────────────────
router.post('/requests/:id/submit', protect, upload.single('file'), async (req, res) => {
  try {
    const { id: request_id } = req.params;
    const { custom_data } = req.body; // should be a JSON string from FormData
    
    const request = await DocumentRequest.findByPk(request_id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    
    if (request.status !== 'active') {
      return res.status(400).json({ message: 'This request is no longer active' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'File is required' });
    }

    // Save relative path for serving
    const file_url = `/uploads/documents/${req.file.filename}`;

    // Parse custom data if sent
    let parsedData = {};
    if (custom_data) {
      try {
        parsedData = JSON.parse(custom_data);
      } catch (e) {
        console.error('Failed to parse custom_data', e);
      }
    }

    // Upsert submission
    let submission = await DocumentSubmission.findOne({
      where: { request_id, user_id: req.user.id }
    });

    if (submission) {
      // Update existing
      await submission.update({
        file_url,
        custom_data: parsedData,
        status: 'pending',
        feedback: null
      });
    } else {
      submission = await DocumentSubmission.create({
        request_id,
        user_id: req.user.id,
        file_url,
        custom_data: parsedData
      });
    }

    res.json({ message: 'Document submitted successfully', submission });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to submit document' });
  }
});

// ── GET Submissions (Admin) ──────────────────────────────────────────────────
router.get('/requests/:id/submissions', protect, hasPermission('MANAGE_DOCUMENTS'), async (req, res) => {
  try {
    const submissions = await DocumentSubmission.findAll({
      where: { request_id: req.params.id },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'role'] }
      ],
      order: [['id', 'DESC']]
    });
    res.json({ submissions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: `Failed to fetch submissions: ${err.message}` });
  }
});

// ── PUT Submission Feedback/Status (Admin) ───────────────────────────────────
router.put('/submissions/:id', protect, hasPermission('MANAGE_DOCUMENTS'), async (req, res) => {
  try {
    const { status, feedback } = req.body;
    const submission = await DocumentSubmission.findByPk(req.params.id);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    await submission.update({ status, feedback });
    res.json({ message: 'Submission updated', submission });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update submission' });
  }
});

module.exports = router;
