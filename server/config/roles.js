/**
 * ROLE HIERARCHY & PERMISSION SYSTEM
 *
 * Instead of hardcoding role checks everywhere, define permissions centrally.
 * This makes it trivial to add new roles or change permissions in one place.
 */

// All valid roles in the system
const ROLES = {
  ADMIN:         'admin',
  ADMIN2:        'admin2',
  TEACHER:       'teacher',
  STUDENT:       'student',
  PARENT:        'parent',
  FEE_COLLECTOR: 'fee_collector',
};

/**
 * Role hierarchy levels.
 * Higher number = more permissions.
 * Used by hasMinimumRole() to allow "at least this level" checks.
 */
const ROLE_LEVELS = {
  parent:        1,
  student:       1,
  fee_collector: 2,
  teacher:       3,
  admin2:        4,
  admin:         5,
};

/**
 * Permission groups — named sets of roles that share access to a feature.
 * Use these in middleware instead of hardcoding role arrays everywhere.
 */
const PERMISSIONS = {
  // Full admin access — only super admin
  SUPER_ADMIN: ['admin'],

  // Admin-level access (both admin types)
  ADMIN_ANY: ['admin', 'admin2'],

  // Can view students and their data
  VIEW_STUDENTS: ['admin', 'admin2', 'teacher', 'fee_collector'],

  // Can manage students (CRUD)
  MANAGE_STUDENTS: ['admin', 'admin2'],

  // Can view teachers
  VIEW_TEACHERS: ['admin', 'admin2', 'teacher'],

  // Can manage teachers (CRUD)
  MANAGE_TEACHERS: ['admin'],

  // Can mark / view student attendance
  MANAGE_STUDENT_ATTENDANCE: ['admin', 'admin2', 'teacher'],

  // Can mark / view teacher attendance
  MANAGE_TEACHER_ATTENDANCE: ['admin', 'admin2'],

  // Can view teacher attendance (teacher sees own only — handled in controller)
  VIEW_TEACHER_ATTENDANCE: ['admin', 'admin2', 'teacher'],

  // Can assign class incharge
  ASSIGN_INCHARGE: ['admin', 'admin2'],

  // Can manage fees
  MANAGE_FEES: ['admin', 'admin2', 'fee_collector'],

  // Can collect fees
  COLLECT_FEES: ['admin', 'admin2', 'fee_collector'],

  // Can enter marks (teacher restricted to own class+subject in controller)
  ENTER_MARKS: ['admin', 'admin2', 'teacher'],

  // Can view results
  VIEW_RESULTS: ['admin', 'admin2', 'teacher', 'parent', 'student'],

  // Result workflow
  SUBMIT_RESULTS:          ['admin', 'admin2', 'teacher'],
  INCHARGE_REVIEW:         ['admin', 'admin2', 'teacher'],  // teacher only if incharge
  ADMIN2_REVIEW_RESULTS:   ['admin', 'admin2'],
  PUBLISH_RESULTS:         ['admin'],

  // Notifications
  SEND_NOTIFICATIONS: ['admin', 'admin2'],

  // Session & promotion
  MANAGE_SESSIONS: ['admin'],

  // Admission requests
  SUBMIT_ADMISSION:  ['admin', 'admin2', 'fee_collector'],
  REVIEW_ADMISSION:  ['admin', 'admin2'],

  // Timetable
  MANAGE_TIMETABLE: ['admin', 'admin2'],
  VIEW_TIMETABLE:   ['admin', 'admin2', 'teacher', 'parent', 'student'],
};

const CLASSES = [
  'Playgroup', 'Nursery', 'LKG', 'UKG', 'day care',
  '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'
];

module.exports = { ROLES, ROLE_LEVELS, PERMISSIONS, CLASSES };
