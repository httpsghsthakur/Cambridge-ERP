// ── Grade calculator ──────────────────────────────────────────────────────────
export const getGrade = (obtained, max) => {
  const pct = max > 0 ? (obtained / max) * 100 : 0;
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 40) return 'D';
  return 'F';
};

export const getGradeColor = (grade) => {
  const map = {
    'A+': 'text-emerald-600', 'A': 'text-green-600',
    'B':  'text-blue-600',    'C': 'text-yellow-600',
    'D':  'text-orange-500',  'F': 'text-red-600',
  };
  return map[grade] || 'text-gray-600';
};

export const getGradeBg = (grade) => {
  const map = {
    'A+': 'bg-emerald-100 text-emerald-700',
    'A':  'bg-green-100 text-green-700',
    'B':  'bg-blue-100 text-blue-700',
    'C':  'bg-yellow-100 text-yellow-700',
    'D':  'bg-orange-100 text-orange-700',
    'F':  'bg-red-100 text-red-700',
  };
  return map[grade] || 'bg-gray-100 text-gray-600';
};

// ── Currency ──────────────────────────────────────────────────────────────────
export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2
  }).format(Number(amount || 0));

export const formatCurrencyShort = (amount) => {
  const n = Number(amount || 0);
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
};

// ── Dates ─────────────────────────────────────────────────────────────────────
export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
};

export const formatDateInput = (date) => {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
};

export const todayInput = () => new Date().toISOString().split('T')[0];

export const getMonthYear = (date = new Date()) =>
  date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

// ── Fee status helpers ────────────────────────────────────────────────────────
export const feeStatusColor = {
  paid:          'bg-green-100 text-green-700',
  unpaid:        'bg-red-100 text-red-700',
  partial:       'bg-yellow-100 text-yellow-700',
  overdue:       'bg-orange-100 text-orange-700',
  waived:        'bg-gray-100 text-gray-500',
  not_generated: 'bg-slate-100 text-slate-600',
};

export const feeStatusDot = {
  paid:          'bg-green-500',
  unpaid:        'bg-red-500',
  partial:       'bg-yellow-500',
  overdue:       'bg-orange-500',
  waived:        'bg-gray-400',
  not_generated: 'bg-slate-400',
};

// ── Attendance helpers ────────────────────────────────────────────────────────
export const attendanceBg = {
  present:    'bg-green-100 text-green-700',
  absent:     'bg-red-100 text-red-700',
  late:       'bg-yellow-100 text-yellow-700',
  holiday:    'bg-gray-100 text-gray-500',
  not_marked: 'bg-gray-50 text-gray-400',
};

export const getAttendancePercColor = (pct) => {
  if (pct >= 85) return 'text-green-600';
  if (pct >= 75) return 'text-yellow-600';
  return 'text-red-600';
};

export const getAttendanceBarColor = (pct) => {
  if (pct >= 85) return 'bg-green-500';
  if (pct >= 75) return 'bg-yellow-500';
  return 'bg-red-500';
};

// ── String helpers ────────────────────────────────────────────────────────────
export const initials = (name = '') =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

export const capitalize = (str = '') =>
  str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');

// ── Pagination ────────────────────────────────────────────────────────────────
export const paginate = (items, page, perPage) => {
  const start = (page - 1) * perPage;
  return items.slice(start, start + perPage);
};

export const totalPages = (count, perPage) => Math.ceil(count / perPage);

// ── Greeting helper ───────────────────────────────────────────────────────────
export const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};
