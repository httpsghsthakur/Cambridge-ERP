export const ROLES = {
  ADMIN:         'admin',
  TEACHER:       'teacher',
  PARENT:        'parent',
  FEE_COLLECTOR: 'fee_collector',
};

export const ROLE_LABELS = {
  admin:         'Admin',
  teacher:       'Teacher',
  parent:        'Parent',
  fee_collector: 'Fee Collector',
};

export const CLASSES = [
  'Playgroup', 'Nursery', 'LKG', 'UKG', 'day care',
  '1st', '2nd', '3rd', '4th', '5th',
  '6th', '7th', '8th', '9th', '10th',
];

export const SECTIONS = ['A', 'B', 'C', 'D'];

export const SUBJECTS = [
  'Mathematics', 'Science', 'English', 'Hindi',
  'Social Studies', 'Computer', 'Physical Education', 'Art',
];

export const FEE_STRUCTURE = {
  'Playgroup': 1200, 'Nursery': 1200, 'LKG': 1400, 'UKG': 1400, 'day care': 1500,
  '1st':  1500, '2nd':  1500, '3rd':  1800, '4th':  1800, '5th':  1800,
  '6th':  2000, '7th':  2200, '8th':  2500, '9th':  2800, '10th': 3000,
};

export const EXAM_TYPES = [
  { value: 'unit_test',   label: 'Unit Test' },
  { value: 'half_yearly', label: 'Half Yearly' },
  { value: 'annual',      label: 'Annual Exam' },
  { value: 'assessment',  label: 'Assessment' },
];