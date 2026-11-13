export const ROUTES = {
  LOGIN: '/login',

  // Admin
  ADMIN: {
    ROOT:          '/admin',
    STUDENTS:      '/admin/students',
    TEACHERS:      '/admin/teachers',
    ATTENDANCE:    '/admin/attendance',
    FEES:          '/admin/fees',
    MARKS:         '/admin/marks',
    TIMETABLE:     '/admin/timetable',
    PROMOTION:     '/admin/promotion',
    NOTIFICATIONS: '/admin/notifications',
  },

  // Teacher
  TEACHER: {
    ROOT:       '/teacher',
    ATTENDANCE: '/teacher/attendance',
    MARKS:      '/teacher/marks',
  },

  // Parent / Fee Collector
  PARENT: {
    ROOT:          '/parent',
    ATTENDANCE:    '/parent/attendance',
    REPORT_CARD:   '/parent/report-card',
    FEES:          '/parent/fees',
    NOTIFICATIONS: '/parent/notifications',
  },

  FEE_COLLECTOR: {
    ROOT:       '/fc',
    COLLECT:    '/fc/collect',
    SEARCH:     '/fc/search',
    ADMISSION:  '/fc/admission',
    ADMISSIONS: '/fc/admissions',
  },
};

export const ROLE_HOME = {
  admin:         ROUTES.ADMIN.ROOT,
  teacher:       ROUTES.TEACHER.ROOT,
  parent:        ROUTES.PARENT.ROOT,
  student:       ROUTES.PARENT.ROOT,
  fee_collector: ROUTES.FEE_COLLECTOR.ROOT,
};
