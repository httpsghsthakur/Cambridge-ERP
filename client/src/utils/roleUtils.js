/**
 * Frontend role utilities — mirrors server/config/roles.js
 * Single source of truth for role checks in the UI.
 */

export const ROLES = {
  ADMIN:         'admin',
  ADMIN2:        'admin2',
  TEACHER:       'teacher',
  PARENT:        'parent',
  FEE_COLLECTOR: 'fee_collector',
};

// Named permission groups matching backend
export const PERMISSIONS = {
  SUPER_ADMIN:                ['admin'],
  ADMIN_ANY:                  ['admin', 'admin2'],
  VIEW_STUDENTS:              ['admin', 'admin2', 'teacher', 'fee_collector'],
  MANAGE_STUDENTS:            ['admin', 'admin2'],
  VIEW_TEACHERS:              ['admin', 'admin2'],
  MANAGE_TEACHERS:            ['admin'],
  MANAGE_STUDENT_ATTENDANCE:  ['admin', 'admin2', 'teacher'],
  MANAGE_TEACHER_ATTENDANCE:  ['admin', 'admin2'],
  ASSIGN_INCHARGE:            ['admin', 'admin2'],
  MANAGE_FEES:                ['admin', 'admin2', 'fee_collector'],
  COLLECT_FEES:               ['admin', 'admin2', 'fee_collector'],
  ENTER_MARKS:                ['admin', 'admin2', 'teacher'],
  INCHARGE_REVIEW:            ['admin', 'admin2', 'teacher'],
  ADMIN2_REVIEW_RESULTS:      ['admin', 'admin2'],
  PUBLISH_RESULTS:            ['admin'],
  SEND_NOTIFICATIONS:         ['admin', 'admin2'],
  MANAGE_SESSIONS:            ['admin'],
  SUBMIT_ADMISSION:           ['admin', 'admin2', 'fee_collector'],
  REVIEW_ADMISSION:           ['admin', 'admin2'],
};

/**
 * Check if a user has a specific named permission.
 * @param {object} user - user object with .role property
 * @param {string} permissionKey - key from PERMISSIONS
 */
export const can = (user, permissionKey) => {
  if (!user?.role) return false;
  const allowed = PERMISSIONS[permissionKey];
  if (!allowed) {
    console.warn(`[RBAC] Unknown permission key: "${permissionKey}"`);
    return false;
  }
  return allowed.includes(user.role);
};

/**
 * Check if user has any of the given roles.
 * Replaces: user.role === 'admin'
 * With:     hasRole(user, 'admin', 'admin2')
 */
export const hasRole = (user, ...roles) => {
  if (!user?.role) return false;
  return roles.includes(user.role);
};

/**
 * Convenience shorthands
 */
export const isAdmin      = (user) => hasRole(user, 'admin', 'admin2');
export const isSuperAdmin = (user) => hasRole(user, 'admin');
export const isTeacher    = (user) => hasRole(user, 'teacher');
export const isParent     = (user) => hasRole(user, 'parent');
export const isFinance    = (user) => hasRole(user, 'admin', 'admin2', 'fee_collector');
export const isStaff      = (user) => hasRole(user, 'admin', 'admin2', 'teacher');
