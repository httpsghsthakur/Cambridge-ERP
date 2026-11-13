const express = require('express');
const router  = express.Router();
const { Op }  = require('sequelize');
const { Student, Session, User, Teacher, ClassIncharge } = require('../models');

const { getTeacherAllowedClasses } = require('../utils/teacherAllowedClasses');
const { protect, hasPermission, isSuperAdmin, authorize } = require('../middleware/auth');
const { createAdmissionFee } = require('../services/feeService');
const { makeStudentId, makeStudentEmail, makeTemporaryPassword } = require('../utils/credentialGenerator');
const { validateStudentCreate, validateStudentUpdate, validateStudentApproval } = require('../middleware/validator');
const { profileUpdateLimiter } = require('../middleware/rateLimiters');

// ── Allowed fields whitelists (C3/C4 fix) ─────────────────────────────────────
const STUDENT_CREATE_FIELDS = [
  'first_name', 'last_name', 'date_of_birth', 'gender',
  'class', 'section', 'roll_number', 'session_id',
  'parent_name', 'parent_phone', 'parent_email', 'parent_address',
  'address', 'blood_group', 'religion', 'category', 'aadhar_number',
  'previous_school', 'admission_date',
  'email', 'password',
];

const STUDENT_UPDATE_FIELDS = [
  'first_name', 'last_name', 'date_of_birth', 'gender',
  'class', 'section', 'roll_number', 'session_id',
  'parent_name', 'parent_phone', 'parent_email', 'parent_address',
  'address', 'blood_group', 'religion', 'category', 'aadhar_number',
  'student_status',
];

/** Pick only allowed keys from an object */
const pick = (obj, keys) => {
  const result = {};
  for (const key of keys) {
    if (obj[key] !== undefined) result[key] = obj[key];
  }
  return result;
};

// GET /api/students — with category filters
router.get('/', protect, hasPermission('VIEW_STUDENTS'), async (req, res) => {
  try {
    const {
      class: cls, section, search, session_id,
      student_status, source, fee_status,
      page = 1, limit = 50,
    } = req.query;

    const where = { is_active: true, approval_status: 'approved' };
    if (cls)            where.class          = cls;
    if (section)        where.section        = section;
    if (session_id)     where.session_id     = session_id;
    if (student_status) where.student_status = student_status;
    if (source)         where.source         = source;

    if (req.user.role === 'teacher') {
      const allowedClasses = await getTeacherAllowedClasses(req.user.linked_teacher_id);
      if (cls) {
        if (!allowedClasses.includes(cls)) {
          return res.status(403).json({ message: 'Access denied. You are not assigned to this class.' });
        }
      } else {
        where.class = { [Op.in]: allowedClasses };
      }
    }

    if (search) {
      where[Op.or] = [
        { first_name:   { [Op.like]: `%${search}%` } },
        { last_name:    { [Op.like]: `%${search}%` } },
        { student_id:   { [Op.like]: `%${search}%` } },
        { parent_name:  { [Op.like]: `%${search}%` } },
        { parent_phone: { [Op.like]: `%${search}%` } },
      ];
      // If search is a valid number, also search roll_number
      if (!isNaN(search) && search.trim() !== '') {
        where[Op.or].push({ roll_number: parseInt(search, 10) });
      }
    }

    const queryOptions = {
      where,
      include: [{ model: Session, as: 'session', attributes: ['id', 'name'] }],
      order:   [['class','ASC'],['section','ASC'],['roll_number','ASC']],
    };

    // If filtering by fee_status, we MUST fetch all to compute and filter in-memory before paginating.
    // Otherwise, we paginate at the DB level for performance.
    if (!fee_status || fee_status === 'all') {
      queryOptions.limit = parseInt(limit);
      queryOptions.offset = (parseInt(page) - 1) * parseInt(limit);
    }

    const { count, rows } = await Student.findAndCountAll(queryOptions);

    // Compute overall true fee status
    const { Fee } = require('../models');
    const studentIds = rows.map(s => s.id);
    let students = rows;
    
    if (studentIds.length > 0) {
      const fees = await Fee.findAll({
        where: { student_id: studentIds },
        attributes: ['student_id', 'status']
      });

      const studentFees = {};
      fees.forEach(f => {
        if (!studentFees[f.student_id]) studentFees[f.student_id] = { total: 0, paid: 0, partial: 0, unpaid: 0 };
        studentFees[f.student_id].total++;
        if (f.status === 'paid') studentFees[f.student_id].paid++;
        if (f.status === 'partial') studentFees[f.student_id].partial++;
        if (f.status === 'unpaid') studentFees[f.student_id].unpaid++;
      });

      students = rows.map(s => {
        const sData = s.toJSON();
        const sFees = studentFees[s.id];
        if (!sFees || sFees.total === 0) {
          sData.fee_status = 'not_generated';
        } else if (sFees.unpaid > 0) {
          sData.fee_status = 'unpaid';
        } else if (sFees.partial > 0) {
          sData.fee_status = 'partial';
        } else {
          sData.fee_status = 'paid';
        }
        return sData;
      });
    }

    if (fee_status && fee_status !== 'all') {
      students = students.filter(s => s.fee_status === fee_status);
      
      // Perform manual pagination on the filtered array
      const totalFiltered = students.length;
      const startIndex = (parseInt(page) - 1) * parseInt(limit);
      const endIndex = startIndex + parseInt(limit);
      
      res.json({ 
        total: totalFiltered, 
        page: parseInt(page), 
        students: students.slice(startIndex, endIndex) 
      });
    } else {
      res.json({ total: count, page: parseInt(page), students });
    }
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/students/alumni — alumni/passed out students
router.get('/alumni', protect, hasPermission('VIEW_STUDENTS'), async (req, res) => {
  try {
    const students = await Student.findAll({
      where: { student_status: 'alumni', is_active: false },
      include: [{ model: Session, as: 'session', attributes: ['id', 'name'] }],
      order: [['updated_at', 'DESC']],
    });
    res.json(students);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/students/approvals - pending/rejected student records
router.get('/approvals', protect, authorize('admin'), async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const students = await Student.findAll({
      where: { approval_status: status },
      include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'role'] }],
      order: [['created_at', 'DESC']],
    });
    res.json(students);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/students/:id/approval - approve or reject pending student
router.put('/:id/approval', protect, authorize('admin'), validateStudentApproval, async (req, res) => {
  const txn = await require('../models').sequelize.transaction();
  try {
    const { status, rejection_reason } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      await txn.rollback();
      return res.status(400).json({ message: 'Status must be approved or rejected.' });
    }

    const student = await Student.findByPk(req.params.id, { transaction: txn });
    if (!student) {
      await txn.rollback();
      return res.status(404).json({ message: 'Student not found.' });
    }

    await student.update({
      approval_status: status,
      is_active: status === 'approved',
      student_status: status === 'approved' ? 'active' : 'inactive',
      approved_by: req.user.id,
      approved_at: status === 'approved' ? new Date() : null,
      rejection_reason: status === 'rejected' ? rejection_reason || 'Rejected by admin.' : null,
    }, { transaction: txn });

    await User.update(
      { is_active: status === 'approved' },
      { where: { linked_student_id: student.id, role: 'student' }, transaction: txn }
    );

    if (status === 'approved') {
      const { getOrCreateFeeRecord, assignPublishedFeeStructure, MONTHS } = require('../services/feeService');
      const now = new Date();
      await getOrCreateFeeRecord(student, MONTHS[now.getMonth()], now.getFullYear(), 'monthly', txn);
      await assignPublishedFeeStructure(student, txn);
    }

    await txn.commit();
    res.json({ message: `Student ${status}.`, student });
  } catch (err) {
    await txn.rollback();
    res.status(500).json({ message: err.message });
  }
});

// GET /api/students/:id
router.get('/:id', protect, hasPermission('VIEW_STUDENTS'), async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id, {
      include: [{ model: Session, as: 'session' }]
    });
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    if (req.user.role === 'teacher') {
      const allowedClasses = await getTeacherAllowedClasses(req.user.linked_teacher_id);
      if (!allowedClasses.includes(student.class)) {
        return res.status(403).json({ message: 'Access denied. Student is not in your assigned classes.' });
      }
    }

    res.json(student);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/students - admin/admin2 creates directly, fee collector creates pending approval
// (C4 fix) — only whitelisted fields are accepted from req.body
router.post('/', protect, authorize('admin', 'admin2', 'fee_collector'), validateStudentCreate, async (req, res) => {
  const txn = await require('../models').sequelize.transaction();
  try {
    // Always create as pending for new admissions (per user request)
    const isApproved = false;
    const safeData = pick(req.body, STUDENT_CREATE_FIELDS);

    // If custom email (User ID) is provided, verify it is not already taken
    if (safeData.email) {
      const existingUser = await User.findOne({ where: { email: safeData.email }, transaction: txn });
      if (existingUser) {
        await txn.rollback();
        return res.status(400).json({ message: 'Email address (User ID) is already registered.' });
      }
    }

    const student = await Student.create({
      ...safeData,
      student_id:     'PENDING',
      is_active:      isApproved,
      student_status: isApproved ? 'active' : 'inactive',
      source:         isApproved ? 'admin_created' : 'admission_approved',
      created_by:     req.user.id,
      approval_status: isApproved ? 'approved' : 'pending',
      approved_by:    isApproved ? req.user.id : null,
      approved_at:    isApproved ? new Date() : null,
    }, { transaction: txn });

    const studentId = makeStudentId(student.id);
    await student.update({ student_id: studentId }, { transaction: txn });

    // Use custom email/password if provided, fallback to auto-generators
    const userEmail = safeData.email || makeStudentEmail(studentId);
    const userPassword = safeData.password || makeTemporaryPassword();

    await User.create({
      name: `${student.first_name} ${student.last_name}`,
      email: userEmail,
      password: userPassword,
      role: 'student',
      linked_student_id: student.id,
      is_active: isApproved,
      phone: student.parent_phone,
    }, { transaction: txn });

    // Always generate admission fee for new students (even if pending)
    const { getOrCreateFeeRecord, assignPublishedFeeStructure, MONTHS } = require('../services/feeService');
    const now   = new Date();
    const month = MONTHS[now.getMonth()];
    const year  = now.getFullYear();
    await getOrCreateFeeRecord(student, month, year, 'admission', txn);

    if (isApproved) {
      // Auto-generate current month fee record and assign published fee structure
      await getOrCreateFeeRecord(student, month, year, 'monthly', txn);
      await assignPublishedFeeStructure(student, txn);
    }

    await txn.commit();

    res.status(201).json({
      student,
      credentials: {
        email: userEmail,
        password: safeData.password ? '[MANUALLY_SET]' : userPassword,
        active: isApproved,
      },
      message: 'Student created pending admin approval or admission fee payment. Login will activate after approval.',
    });
  } catch (err) {
    console.error('[students][POST /]', err);
    await txn.rollback();
    res.status(400).json({ message: err.message });
  }
});

// POST /api/students/bulk-upload - Bulk student upload via Excel/CSV
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'), false);
    }
  }
}).single('file');

router.post('/bulk-upload', protect, authorize('admin', 'admin2', 'fee_collector'), (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'File upload failed.' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const txn = await require('../models').sequelize.transaction();
    try {
      const XLSX = require('xlsx');
      
      // Read the excel/csv file from buffer
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(sheet);

      if (!rawData || rawData.length === 0) {
        await txn.rollback();
        return res.status(400).json({ message: 'The uploaded file is empty.' });
      }

      // Check active session
      const activeSession = await Session.findOne({ where: { is_active: true }, transaction: txn });
      if (!activeSession) {
        await txn.rollback();
        return res.status(400).json({ message: 'No active academic session found. Please create/activate one first.' });
      }

      const isApproved = ['admin', 'admin2'].includes(req.user.role);
      const results = [];
      const errors = [];
      const credentials = [];

      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        const rowNum = i + 2; // Row number in Excel sheet (including header)

        // Standardize column names (case-insensitive and non-alphanumeric stripped)
        const getField = (keys) => {
          for (const key of Object.keys(row)) {
            const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (keys.includes(normalizedKey)) {
              return typeof row[key] === 'string' ? row[key].trim() : row[key];
            }
          }
          return undefined;
        };

        const firstName = getField(['firstname', 'name', 'studentname']);
        let lastName = getField(['lastname']) || '';
        const applyingClass = getField(['class', 'applyingclass', 'grade', 'standard']);
        const section = getField(['section', 'sec']) || 'A';
        const rollNumber = getField(['roll', 'rollno', 'rollnumber']);
        const gender = getField(['gender', 'sex']);
        const dob = getField(['dob', 'dateofbirth', 'birthdate']);
        const parentName = getField(['parentname', 'fathername', 'guardianname', 'mothername', 'fathersname', 'mothersname']);
        const parentPhone = getField(['parentphone', 'phone', 'mobileno', 'mobilenumber', 'mobile', 'parentsphone', 'fatherphone', 'fathersphone']);
        const parentEmail = getField(['parentemail', 'emailid', 'parentsemail']);
        const parentAddress = getField(['parentaddress', 'address', 'parentsaddress', 'location']);
        
        const customEmail = getField(['email', 'loginemail', 'username', 'login']);
        const customPassword = getField(['password', 'loginpassword', 'pass']);

        // Validations
        if (!firstName) {
          errors.push({ row: rowNum, message: 'Missing first name/name.' });
          continue;
        }
        if (!applyingClass) {
          errors.push({ row: rowNum, message: `Missing class for student "${firstName}".` });
          continue;
        }
        if (!parentName) {
          errors.push({ row: rowNum, message: `Missing parent/guardian name for student "${firstName}".` });
          continue;
        }
        if (!parentPhone) {
          errors.push({ row: rowNum, message: `Missing parent/guardian phone for student "${firstName}".` });
          continue;
        }

        // Split name if first_name / name contains spaces and lastName is empty
        let finalFirstName = String(firstName).trim();
        let finalLastName = String(lastName).trim();
        if (!finalLastName && finalFirstName.includes(' ')) {
          const parts = finalFirstName.split(' ');
          finalFirstName = parts[0];
          finalLastName = parts.slice(1).join(' ');
        }

        // Validate phone regex
        const phoneStr = String(parentPhone).trim();
        const validPhone = /^[6-9]\d{9}$/.test(phoneStr);
        if (!validPhone) {
          errors.push({ row: rowNum, message: `Invalid parent phone "${phoneStr}" (Must be a 10-digit number starting with 6-9).` });
          continue;
        }

        // Validate unique email if custom email is provided
        if (customEmail) {
          const emailStr = String(customEmail).trim();
          const existingUser = await User.findOne({ where: { email: emailStr }, transaction: txn });
          if (existingUser) {
            errors.push({ row: rowNum, message: `Email "${emailStr}" is already registered.` });
            continue;
          }
        }

        try {
          // Parse DOB if present
          let parsedDob = null;
          if (dob) {
            // Check if Excel parsed date as serial number (Excel dates are sometimes numbers)
            if (typeof dob === 'number') {
              const excelEpoch = new Date(1899, 11, 30);
              const dateMs = excelEpoch.getTime() + dob * 24 * 60 * 60 * 1000;
              parsedDob = new Date(dateMs).toISOString().split('T')[0];
            } else {
              const dateObj = new Date(dob);
              if (!isNaN(dateObj.getTime())) {
                parsedDob = dateObj.toISOString().split('T')[0];
              }
            }
          }

          // Format gender
          let formattedGender = null;
          if (gender) {
            const g = String(gender).trim().toLowerCase();
            if (g === 'male' || g === 'm') formattedGender = 'Male';
            else if (g === 'female' || g === 'f') formattedGender = 'Female';
            else formattedGender = 'Other';
          }

          // Create Student
          const student = await Student.create({
            first_name:     finalFirstName,
            last_name:      finalLastName,
            class:          String(applyingClass).trim(),
            section:        String(section).trim(),
            roll_number:    rollNumber ? parseInt(rollNumber, 10) : null,
            gender:         formattedGender,
            date_of_birth:  parsedDob,
            session_id:     activeSession.id,
            parent_name:    String(parentName).trim(),
            parent_phone:   phoneStr,
            parent_email:   parentEmail ? String(parentEmail).trim() : null,
            parent_address: parentAddress ? String(parentAddress).trim() : null,
            student_id:     'PENDING',
            is_active:      isApproved,
            student_status: isApproved ? 'active' : 'inactive',
            source:         isApproved ? 'admin_created' : 'admission_approved',
            created_by:     req.user.id,
            approval_status: isApproved ? 'approved' : 'pending',
            approved_by:    isApproved ? req.user.id : null,
            approved_at:    isApproved ? new Date() : null,
          }, { transaction: txn });

          const studentId = makeStudentId(student.id);
          await student.update({ student_id: studentId }, { transaction: txn });

          // Credentials
          const userEmail = customEmail ? String(customEmail).trim() : makeStudentEmail(studentId);
          const rawPassword = customPassword ? String(customPassword).trim() : makeTemporaryPassword();

          await User.create({
            name: `${student.first_name} ${student.last_name}`,
            email: userEmail,
            password: rawPassword,
            role: 'student',
            linked_student_id: student.id,
            is_active: isApproved,
            phone: student.parent_phone,
          }, { transaction: txn });

          // Fees if approved
          if (isApproved) {
            const { getOrCreateFeeRecord, assignPublishedFeeStructure, MONTHS } = require('../services/feeService');
            const now = new Date();
            const month = MONTHS[now.getMonth()];
            const year = now.getFullYear();
            await getOrCreateFeeRecord(student, month, year, 'monthly', txn);
            await assignPublishedFeeStructure(student, txn);
          }

          results.push({
            id: student.id,
            student_id: studentId,
            name: `${student.first_name} ${student.last_name}`,
            class: student.class,
            section: student.section,
          });

          credentials.push({
            student_id: studentId,
            name: `${student.first_name} ${student.last_name}`,
            email: userEmail,
            password: customPassword ? '[MANUALLY_SET]' : rawPassword,
            status: isApproved ? 'Active' : 'Pending Approval',
          });

        } catch (rowErr) {
          console.error(`[bulk-upload] Error at row ${rowNum}:`, rowErr);
          errors.push({ row: rowNum, message: rowErr.message || 'Database creation failed.' });
        }
      }

      if (results.length === 0) {
        await txn.rollback();
        return res.status(400).json({
          message: 'No students were uploaded due to validation errors.',
          errors,
        });
      }

      await txn.commit();
      res.status(201).json({
        message: `Successfully processed ${results.length} students.`,
        successCount: results.length,
        failedCount: errors.length,
        errors,
        credentials,
      });

    } catch (err) {
      console.error('[students][POST /bulk-upload]', err);
      await txn.rollback();
      res.status(500).json({ message: 'Internal server error during processing.' });
    }
  });
});

// PUT /api/students/:id — (C3 fix) only whitelisted fields
router.put('/:id', profileUpdateLimiter, protect, hasPermission('MANAGE_STUDENTS'), validateStudentUpdate, async (req, res) => {
  try {
    const safeData = pick(req.body, STUDENT_UPDATE_FIELDS);
    const [updated] = await Student.update(safeData, { where: { id: req.params.id } });
    if (!updated) return res.status(404).json({ message: 'Student not found.' });
    const student = await Student.findByPk(req.params.id);
    res.json(student);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// DELETE /api/students/:id
router.delete('/:id', protect, isSuperAdmin, async (req, res) => {
  try {
    await Student.update({ is_active: false, student_status: 'inactive' }, { where: { id: req.params.id } });
    res.json({ message: 'Student deactivated.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
