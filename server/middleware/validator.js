const { body, query, param, validationResult } = require('express-validator');

/**
 * Standard validation result processor.
 * If errors are found, aborts request with 400 Bad Request and structured error JSON.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed.',
      errors: errors.array(),
    });
  }
  next();
};

// ── AUTH VALIDATION RULES ────────────────────────────────────────────────────

const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email or User ID is required.'),
  body('password')
    .notEmpty().withMessage('Password is required.'),
  validate,
];

const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters.'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please enter a valid email address.')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.'),
  body('role')
    .optional()
    .isIn(['admin2', 'teacher', 'student', 'parent', 'fee_collector'])
    .withMessage('Invalid role selected.'),
  body('linked_student_id')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('linked_student_id must be a positive integer.'),
  body('linked_teacher_id')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('linked_teacher_id must be a positive integer.'),
  validate,
];

const validateChangePassword = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required.'),
  body('newPassword')
    .notEmpty().withMessage('New password is required.')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters.'),
  validate,
];

// ── STUDENT VALIDATION RULES ──────────────────────────────────────────────────

const validateStudentCreate = [
  body('first_name')
    .trim()
    .notEmpty().withMessage('First name is required.')
    .isLength({ max: 60 }).withMessage('First name cannot exceed 60 characters.'),
  body('last_name')
    .trim()
    .notEmpty().withMessage('Last name is required.')
    .isLength({ max: 60 }).withMessage('Last name cannot exceed 60 characters.'),
  body('date_of_birth')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('Date of birth must be a valid ISO8601 date.'),
  body('gender')
    .optional({ checkFalsy: true })
    .isIn(['Male', 'Female', 'Other']).withMessage('Gender must be Male, Female, or Other.'),
  body('class')
    .trim()
    .notEmpty().withMessage('Class is required.')
    .isLength({ max: 20 }).withMessage('Class name cannot exceed 20 characters.'),
  body('section')
    .trim()
    .notEmpty().withMessage('Section is required.')
    .isLength({ max: 5 }).withMessage('Section cannot exceed 5 characters.'),
  body('roll_number')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('Roll number must be a positive integer.'),
  body('session_id')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('session_id must be a positive integer.'),
  body('parent_name')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 }).withMessage('Parent name cannot exceed 100 characters.'),
  body('parent_phone')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 10, max: 15 }).withMessage('Parent phone must be between 10 and 15 digits.'),
  body('parent_email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail().withMessage('Please enter a valid email address.')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('parent_address')
    .optional({ checkFalsy: true })
    .trim(),
  body('parent_occupation')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 }).withMessage('Occupation cannot exceed 100 characters.'),
  body('previous_school')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 150 }).withMessage('Previous school name cannot exceed 150 characters.'),
  body('admission_date')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('Admission date must be a valid ISO8601 date.'),
  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail().withMessage('Please enter a valid student login email (User ID).')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('password')
    .optional({ checkFalsy: true })
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  validate,
];

const validateStudentUpdate = [
  param('id')
    .isInt({ min: 1 }).withMessage('Invalid student ID.'),
  body('first_name')
    .optional()
    .trim()
    .notEmpty().withMessage('First name cannot be empty.')
    .isLength({ max: 60 }).withMessage('First name cannot exceed 60 characters.'),
  body('last_name')
    .optional()
    .trim()
    .notEmpty().withMessage('Last name cannot be empty.')
    .isLength({ max: 60 }).withMessage('Last name cannot exceed 60 characters.'),
  body('date_of_birth')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('Date of birth must be a valid ISO8601 date.'),
  body('gender')
    .optional({ checkFalsy: true })
    .isIn(['Male', 'Female', 'Other']).withMessage('Gender must be Male, Female, or Other.'),
  body('class')
    .optional()
    .trim()
    .notEmpty().withMessage('Class cannot be empty.')
    .isLength({ max: 20 }).withMessage('Class name cannot exceed 20 characters.'),
  body('section')
    .optional()
    .trim()
    .notEmpty().withMessage('Section cannot be empty.')
    .isLength({ max: 5 }).withMessage('Section cannot exceed 5 characters.'),
  body('roll_number')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('Roll number must be a positive integer.'),
  body('session_id')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('session_id must be a positive integer.'),
  body('parent_name')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 }).withMessage('Parent name cannot exceed 100 characters.'),
  body('parent_phone')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 10, max: 15 }).withMessage('Parent phone must be between 10 and 15 digits.'),
  body('parent_email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail().withMessage('Please enter a valid email address.')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('student_status')
    .optional()
    .isIn(['active', 'inactive', 'alumni', 'transferred', 'suspended'])
    .withMessage('Invalid student status.'),
  validate,
];

const validateStudentApproval = [
  param('id')
    .isInt({ min: 1 }).withMessage('Invalid student ID.'),
  body('status')
    .notEmpty().withMessage('Approval status is required.')
    .isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected.'),
  body('rejection_reason')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Rejection reason cannot exceed 500 characters.'),
  validate,
];

// ── TEACHER VALIDATION RULES ─────────────────────────────────────────────────

const validateTeacherCreate = [
  body('name')
    .trim()
    .notEmpty().withMessage('Teacher name is required.')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters.'),
  body('subject')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 255 }).withMessage('Subject cannot exceed 255 characters.'),
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 10, max: 15 }).withMessage('Phone number must be between 10 and 15 digits.'),
  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail().withMessage('Please enter a valid email address.')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('qualification')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 }).withMessage('Qualification cannot exceed 100 characters.'),
  body('status')
    .optional()
    .isIn(['active', 'leave', 'inactive']).withMessage('Invalid status selected.'),
  body('document_type')
    .optional({ checkFalsy: true })
    .isIn(['Aadhaar Card', 'PAN Card', 'Driving License', 'Passport', 'Voter ID', 'Employee ID', 'Other']).withMessage('Invalid document type selected.'),
  body('document_number')
    .optional({ checkFalsy: true })
    .trim()
    .custom((value, { req }) => {
      const type = req.body.document_type;
      if (type === 'Aadhaar Card' && !/^\d{12}$/.test(value)) {
        throw new Error('Aadhaar must be exactly 12 digits.');
      }
      if (type === 'PAN Card' && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(value)) {
        throw new Error('Invalid PAN format (e.g. ABCDE1234F).');
      }
      return true;
    }),
  body('staff_type')
    .optional({ checkFalsy: true })
    .isIn(['Teacher', 'Principal', 'Vice Principal', 'Accountant', 'Fee Collector', 'Receptionist', 'Clerk', 'Librarian', 'Lab Assistant', 'Sports Teacher', 'Driver', 'Helper', 'Security Guard', 'Office Staff', 'Other']).withMessage('Invalid staff type selected.'),
  body('password')
    .optional({ checkFalsy: true })
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  validate,
];

const validateTeacherUpdate = [
  param('id')
    .isInt({ min: 1 }).withMessage('Invalid teacher ID.'),
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Teacher name cannot be empty.')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters.'),
  body('subject')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 255 }).withMessage('Subject cannot exceed 255 characters.'),
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 10, max: 15 }).withMessage('Phone number must be between 10 and 15 digits.'),
  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail().withMessage('Please enter a valid email address.')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('qualification')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 }).withMessage('Qualification cannot exceed 100 characters.'),
  body('status')
    .optional()
    .isIn(['active', 'leave', 'inactive']).withMessage('Invalid status selected.'),
  body('document_type')
    .optional({ checkFalsy: true })
    .isIn(['Aadhaar Card', 'PAN Card', 'Driving License', 'Passport', 'Voter ID', 'Employee ID', 'Other']).withMessage('Invalid document type selected.'),
  body('document_number')
    .optional({ checkFalsy: true })
    .trim()
    .custom((value, { req }) => {
      const type = req.body.document_type;
      if (type === 'Aadhaar Card' && !/^\d{12}$/.test(value)) {
        throw new Error('Aadhaar must be exactly 12 digits.');
      }
      if (type === 'PAN Card' && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(value)) {
        throw new Error('Invalid PAN format (e.g. ABCDE1234F).');
      }
      return true;
    }),
  body('staff_type')
    .optional({ checkFalsy: true })
    .isIn(['Teacher', 'Principal', 'Vice Principal', 'Accountant', 'Fee Collector', 'Receptionist', 'Clerk', 'Librarian', 'Lab Assistant', 'Sports Teacher', 'Driver', 'Helper', 'Security Guard', 'Office Staff', 'Other']).withMessage('Invalid staff type selected.'),
  validate,
];

// ── FEE VALIDATION RULES ─────────────────────────────────────────────────────

const validateFeeStructureCreate = [
  body('class')
    .trim()
    .notEmpty().withMessage('Class is required.')
    .isLength({ max: 20 }).withMessage('Class name cannot exceed 20 characters.'),
  body('monthly_fee')
    .optional()
    .isFloat({ min: 0 }).withMessage('monthly_fee must be a positive number.'),
  body('admission_fee')
    .optional()
    .isFloat({ min: 0 }).withMessage('admission_fee must be a positive number.'),
  body('annual_fee')
    .optional()
    .isFloat({ min: 0 }).withMessage('annual_fee must be a positive number.'),
  body('promotion_fee')
    .optional()
    .isFloat({ min: 0 }).withMessage('promotion_fee must be a positive number.'),
  body('exam_fee')
    .optional()
    .isFloat({ min: 0 }).withMessage('exam_fee must be a positive number.'),
  validate,
];

const validateFeeStructureUpdate = [
  param('id')
    .isInt({ min: 1 }).withMessage('Invalid fee structure ID.'),
  body('monthly_fee')
    .optional()
    .isFloat({ min: 0 }).withMessage('monthly_fee must be a positive number.'),
  body('admission_fee')
    .optional()
    .isFloat({ min: 0 }).withMessage('admission_fee must be a positive number.'),
  body('annual_fee')
    .optional()
    .isFloat({ min: 0 }).withMessage('annual_fee must be a positive number.'),
  body('promotion_fee')
    .optional()
    .isFloat({ min: 0 }).withMessage('promotion_fee must be a positive number.'),
  body('exam_fee')
    .optional()
    .isFloat({ min: 0 }).withMessage('exam_fee must be a positive number.'),
  validate,
];

const validateFeeCollect = [
  body('amount')
    .notEmpty().withMessage('Amount is required.')
    .isFloat({ gt: 0 }).withMessage('Amount must be a positive number greater than 0.'),
  body('payment_mode')
    .notEmpty().withMessage('Payment mode is required.')
    .isIn(['cash', 'online', 'cheque', 'dd', 'upi']).withMessage('Invalid payment mode.'),
  body('remarks')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 250 }).withMessage('Remarks cannot exceed 250 characters.'),
  body('fee_id')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('fee_id must be a positive integer.'),
  body('student_id')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('student_id must be a positive integer.'),
  body('month')
    .optional({ checkFalsy: true })
    .trim()
    .isIn([
      'January','February','March','April','May','June',
      'July','August','September','October','November','December'
    ]).withMessage('Invalid month specified.'),
  body('year')
    .optional({ nullable: true })
    .isInt({ min: 2000, max: 2100 }).withMessage('Year must be between 2000 and 2100.'),
  validate,
];

// ── ATTENDANCE VALIDATION RULES ──────────────────────────────────────────────

const validateAttendanceBulk = [
  body('class')
    .notEmpty().withMessage('Class is required.')
    .trim(),
  body('section')
    .notEmpty().withMessage('Section is required.')
    .trim(),
  body('date')
    .notEmpty().withMessage('Date is required.')
    .isISO8601().withMessage('Invalid date format (must be YYYY-MM-DD).'),
  body('session_id')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('Session ID must be a positive integer.'),
  body('records')
    .isArray().withMessage('Records must be an array.')
    .notEmpty().withMessage('Records array cannot be empty.'),
  body('records.*.student_id')
    .isInt({ min: 1 }).withMessage('Each record must have a valid student_id.'),
  body('records.*.status')
    .isIn(['present', 'absent', 'late', 'holiday']).withMessage('Invalid attendance status.'),
  validate,
];

// ── RESULT VALIDATION RULES ──────────────────────────────────────────────────

const validateResultCreate = [
  body('student_id')
    .notEmpty().withMessage('student_id is required.')
    .isInt({ min: 1 }).withMessage('student_id must be a positive integer.'),
  body('exam_name')
    .trim()
    .notEmpty().withMessage('exam_name is required.')
    .isLength({ max: 80 }).withMessage('Exam name cannot exceed 80 characters.'),
  body('exam_type')
    .notEmpty().withMessage('exam_type is required.')
    .isIn(['unit_test', 'half_yearly', 'annual', 'assessment', 'class_test']).withMessage('Invalid exam type.'),
  body('class')
    .trim()
    .notEmpty().withMessage('Class is required.')
    .isLength({ max: 20 }).withMessage('Class name cannot exceed 20 characters.'),
  body('section')
    .trim()
    .notEmpty().withMessage('Section is required.')
    .isLength({ max: 5 }).withMessage('Section cannot exceed 5 characters.'),
  body('session_id')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('session_id must be a positive integer.'),
  body('is_class_test')
    .optional()
    .isBoolean().withMessage('is_class_test must be a boolean.'),
  body('subjects')
    .isArray({ min: 1 }).withMessage('Subjects array must contain at least 1 subject.'),
  body('subjects.*.subject')
    .trim()
    .notEmpty().withMessage('Each subject must have a name.')
    .isLength({ max: 80 }).withMessage('Subject name cannot exceed 80 characters.'),
  body('subjects.*.max_marks')
    .isInt({ min: 1 }).withMessage('max_marks must be a positive integer greater than 0.'),
  body('subjects.*.obtained_marks')
    .isInt({ min: 0 }).withMessage('obtained_marks must be a positive integer or 0.')
    .custom((value, { req, path }) => {
      // Custom validator to ensure obtained_marks <= max_marks
      const index = path.match(/\d+/)[0];
      const maxMarks = req.body.subjects[index]?.max_marks;
      if (maxMarks !== undefined && value > maxMarks) {
        throw new Error(`Obtained marks (${value}) cannot exceed maximum marks (${maxMarks}).`);
      }
      return true;
    }),
  validate,
];

const validateResultInchargeReview = [
  param('id')
    .isInt({ min: 1 }).withMessage('Invalid result ID.'),
  body('action')
    .notEmpty().withMessage('Action is required.')
    .isIn(['approve', 'reject']).withMessage('Action must be either approve or reject.'),
  body('notes')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters.'),
  validate,
];

module.exports = {
  validateLogin,
  validateRegister,
  validateChangePassword,
  validateStudentCreate,
  validateStudentUpdate,
  validateStudentApproval,
  validateTeacherCreate,
  validateTeacherUpdate,
  validateFeeStructureCreate,
  validateFeeStructureUpdate,
  validateFeeCollect,
  validateResultCreate,
  validateResultInchargeReview,
  validateAttendanceBulk,
};
