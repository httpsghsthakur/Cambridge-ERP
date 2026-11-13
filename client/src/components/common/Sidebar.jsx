import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

// Dynamic navigation item configuration with custom icons
const navConfig = {
  admin: [
    {
      section: 'MAIN MENU',
      items: [
        { icon: 'dashboard', label: 'Dashboard', to: '/admin' },
        { icon: 'student', label: 'Students', to: '/admin/students' },
        { icon: 'performance', label: 'Student Performance', to: '/admin/student-performance' },
        { icon: 'bulk-upload', label: 'Bulk Admission', to: '/admin/bulk-upload' },
        { icon: 'new-admission', label: 'Admissions & Approvals', to: '/admin/admissions' },
        { icon: 'teacher', label: 'Staff', to: '/admin/teachers' },
        { icon: 'classroom', label: 'Class Incharge', to: '/admin/incharge' },
        { icon: 'credentials', label: 'Credentials', to: '/admin/credentials' },
        { icon: 'attendance', label: 'Attendance', to: '/admin/attendance' },
        { icon: 'teacher-attendance', label: 'Staff Attendance', to: '/admin/teacher-attendance' },
        { icon: 'notices', label: 'Leave Management', to: '/admin/leaves' },
      ],
    },
    {
      section: 'FINANCIALS',
      items: [
        { icon: 'fees', label: 'Fee Management', to: '/admin/fees' },
        { icon: 'class-fees', label: 'Fee Structure', to: '/admin/fee-structure' },
      ],
    },
    {
      section: 'ACADEMICS',
      items: [
        { icon: 'results', label: 'Examinations / Marks', to: '/admin/marks' },
        { icon: 'results', label: 'Result Declarations', to: '/admin/results' },
        { icon: 'exams', label: 'Exam Datesheets', to: '/admin/datesheets' },
        { icon: 'timetable', label: 'Timetable', to: '/admin/timetable' },
        { icon: 'promotion', label: 'Promotion & Session', to: '/admin/promotion' },
      ],
    },
    {
      section: 'COMMUNICATION',
      items: [
        { icon: 'notices', label: 'Notifications', to: '/admin/notifications' },
        { icon: 'timetable', label: 'Upcoming Events', to: '/admin/events' },
      ],
    },
    {
      section: 'SYSTEM & SETTINGS',
      items: [
        { icon: 'settings', label: 'Platform Settings', to: '/admin/settings' },
        { icon: 'central', label: 'Central Integration', to: '/admin/central-integration' },
        { icon: 'billing', label: 'Business Billing & Subscriptions', to: '/admin/central-billing' },
        { icon: 'credentials', label: 'Credential Setup', to: '/admin/credentials' },
        { icon: 'documents', label: 'Activity Logs', to: '/admin/logs' },
        { icon: 'settings', label: 'Security Logs', to: '/admin/security-logs' },
      ],
    },
    {
      section: 'ACCOUNT',
      items: [
        { icon: 'profile', label: 'My Profile', to: '/admin/profile' },
      ],
    },
  ],
  admin2: [
    {
      section: 'ADMIN2 PANEL',
      items: [
        { icon: 'dashboard', label: 'Dashboard', to: '/admin2' },
        { icon: 'performance', label: 'Student Performance', to: '/admin2/student-performance' },
        { icon: 'results', label: 'Result Approvals', to: '/admin2/results' },
        { icon: 'exams', label: 'Exam Datesheets', to: '/admin2/datesheets' },
        { icon: 'classroom', label: 'Class Incharge', to: '/admin2/incharge' },
        { icon: 'credentials', label: 'Credentials', to: '/admin2/credentials' },
        { icon: 'student', label: 'Admissions & Approvals', to: '/admin2/admissions' },
        { icon: 'bulk-upload', label: 'Bulk Admission', to: '/admin2/bulk-upload' },
        { icon: 'teacher-attendance', label: 'Staff Attendance', to: '/admin2/teachers' },
        { icon: 'timetable', label: 'Timetable', to: '/admin2/timetable' },
        { icon: 'profile', label: 'My Profile', to: '/admin2/profile' },
        { icon: 'events', label: 'Upcoming Events', to: '/admin2/events' },
      ],
    },
  ],
  teacher: [
    {
      section: 'TEACHER PANEL',
      items: [
        { icon: 'dashboard', label: 'Dashboard', to: '/teacher' },
        { icon: 'performance', label: 'Student Performance', to: '/teacher/student-performance' },
        { icon: 'attendance', label: 'Mark Attendance', to: '/teacher/attendance' },
        { icon: 'results', label: 'Enter Marks', to: '/teacher/marks' },
        { icon: 'results', label: 'Incharge Results', to: '/teacher/incharge-results' },
        { icon: 'exams', label: 'Exam Datesheet', to: '/teacher/datesheet' },
        { icon: 'achievements', label: 'Achievements', to: '/teacher/achievements' },
        { icon: 'teacher-attendance', label: 'My Attendance', to: '/teacher/my-attendance' },
        { icon: 'notices', label: 'Leave Management', to: '/teacher/leaves' },
        { icon: 'timetable', label: 'Timetable', to: '/teacher/timetable' },
        { icon: 'profile', label: 'My Profile', to: '/teacher/profile' },
      ],
    },
  ],
  parent: [
    {
      section: 'STUDENT PORTAL',
      items: [
        { icon: 'dashboard', label: 'Dashboard', to: '/parent' },
        { icon: 'profile', label: 'My Profile', to: '/parent/profile' },
        { icon: 'timetable', label: 'Timetable', to: '/parent/timetable' },
        { icon: 'attendance', label: 'Attendance', to: '/parent/attendance' },
        { icon: 'exams', label: 'Exam Datesheet', to: '/parent/exams' },
        { icon: 'results', label: 'Results', to: '/parent/report-card' },
        { icon: 'achievements', label: 'Achievements', to: '/parent/achievements' },
        { icon: 'events', label: 'Upcoming Events', to: '/parent/events' },
        { icon: 'notices', label: 'Notices', to: '/parent/notifications' },
        { icon: 'fees', label: 'Fees', to: '/parent/fees' },
      ]
    }
  ],
  student: [
    {
      section: 'STUDENT PORTAL',
      items: [
        { icon: 'dashboard', label: 'Dashboard', to: '/parent' },
        { icon: 'profile', label: 'My Profile', to: '/parent/profile' },
        { icon: 'timetable', label: 'Timetable', to: '/parent/timetable' },
        { icon: 'attendance', label: 'Attendance', to: '/parent/attendance' },
        { icon: 'exams', label: 'Exam Datesheet', to: '/parent/exams' },
        { icon: 'results', label: 'Results', to: '/parent/report-card' },
        { icon: 'achievements', label: 'Achievements', to: '/parent/achievements' },
        { icon: 'events', label: 'Upcoming Events', to: '/parent/events' },
        { icon: 'notices', label: 'Notices', to: '/parent/notifications' },
        { icon: 'fees', label: 'Fees', to: '/parent/fees' },
      ]
    }
  ],
  fee_collector: [
    {
      section: 'FEE COLLECTOR',
      items: [
        { icon: 'dashboard', label: 'Dashboard', to: '/fc' },
        { icon: 'search-collect', label: 'Search & Collect', to: '/fc/collect' },
        { icon: 'new-admission', label: 'New Admission', to: '/fc/admission' },
        { icon: 'credentials', label: 'Credentials', to: '/fc/credentials' },
        { icon: 'student', label: 'Admissions & Approvals', to: '/fc/admissions' },
        { icon: 'bulk-upload', label: 'Bulk Admission', to: '/fc/bulk-upload' },
        { icon: 'profile', label: 'My Profile', to: '/fc/profile' },
      ],
    },
  ],
};

// Render custom SVG icons dynamically
const renderIcon = (iconName) => {
  const baseClass = "w-5 h-5 flex-shrink-0 transition-colors";
  switch (iconName) {
    case 'performance':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );

    case 'bulk-upload':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      );
    case 'documents':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case 'dashboard':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      );
    case 'billing':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'central':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'settings':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case 'profile':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case 'student':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
        </svg>
      );
    case 'teacher':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 4a2 2 0 00-2-2h-3a2 2 0 00-2 2v3a2 2 0 002 2h3a2 2 0 002-2V9z" />
        </svg>
      );
    case 'approval':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'credentials':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m-2 4a2 2 0 012 2m-8-3a3 3 0 11-6 0 3 3 0 016 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      );
    case 'attendance':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'teacher-attendance':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      );
    case 'fees':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    case 'class-fees':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      );
    case 'results':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case 'timetable':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'promotion':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    case 'notices':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      );
    case 'search-collect':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      );
    case 'new-admission':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      );
    case 'classroom':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
        </svg>
      );
    case 'messages':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      );
    case 'exams':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      );
    case 'achievements':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      );
    case 'events':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    default:
      return (
        <span className="w-5 text-center text-xs font-semibold uppercase">{iconName.slice(0, 2)}</span>
      );
  }
};


export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const nav = navConfig[user?.role] || [];
  const { settings } = useSettings() || {};

  // Determine school branding name and logo
  const isStudentPortal = ['parent', 'student'].includes(user?.role);
  
  // Use settings if available, else fallback
  const schoolName = settings?.school_name || "International Cambridge School Kishtwar";
  const schoolSub = settings?.school_subtitle || "Kishtwar, Jammu & Kashmir";

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden" onClick={onClose} />}
      
      <aside className={`fixed top-0 left-0 z-40 flex h-full w-64 flex-col bg-[#081024] text-slate-300 border-r border-white/5 transition-transform duration-300 ease-in-out lg:static lg:z-auto lg:flex-shrink-0 lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        {/* Brand Header */}
        <div className="flex flex-shrink-0 items-center justify-between px-5 py-5 border-b border-white/5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-yellow-400 to-amber-500 text-blue-950 shadow-md shadow-yellow-500/20 overflow-hidden font-extrabold text-base">
              {settings?.school_logo_url ? (
                <img src={settings.school_logo_url} alt="School Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="font-extrabold text-blue-950 text-sm tracking-wider">ICS</span>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-extrabold text-white tracking-wide truncate" title={schoolName}>{schoolName}</div>
              <div className="text-[10px] font-semibold text-yellow-400 mt-0.5 tracking-wider truncate">{schoolSub}</div>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Dynamic Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {nav.map((section) => (
            <div key={section.section} className="space-y-1.5">
              <p className="px-3 pb-1 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                {section.section === 'TEACHER PANEL' && user?.linkedTeacher?.staff_type
                  ? `${user.linkedTeacher.staff_type.toUpperCase()} PANEL`
                  : section.section}
              </p>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to.split('/').length === 2}
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose?.();
                  }}
                  className={({ isActive }) =>
                    `cursor-pointer px-3.5 py-3 text-[13px] font-medium rounded-xl transition-all flex items-center gap-3 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-700 to-blue-600 text-white shadow-lg shadow-blue-900/30 border-l-4 border-yellow-400'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    }`
                  }
                >
                  {renderIcon(item.icon)}
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Bottom Banner Illustration */}
        <div className="px-4 py-4 mb-2 flex-shrink-0">
          {isStudentPortal ? (
            <div className="bg-gradient-to-br from-[#0e1d45] to-[#071129] border border-yellow-500/20 rounded-2xl p-4 text-center shadow-lg relative overflow-hidden group">
              <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-yellow-400/10 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500" />
              <div className="flex justify-center mb-2.5">
                <svg className="w-9 h-9 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <p className="text-white text-xs font-bold tracking-wide">Keep learning,</p>
              <p className="text-yellow-400 text-xs font-bold">keep growing!</p>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-[#0e1d45] to-[#071129] border border-blue-400/20 rounded-2xl p-4 text-center shadow-lg relative overflow-hidden group">
              <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-yellow-400/10 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500" />
              <div className="flex justify-center mb-2.5">
                <svg className="w-9 h-9 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="text-white text-xs font-bold tracking-wide">Empowering Education,</p>
              <p className="text-yellow-400 text-[10px] mt-0.5 font-bold uppercase tracking-wider">Inspiring Futures</p>
            </div>
          )}
        </div>

        {/* User Account Info Footer */}
        <div className="flex-shrink-0 border-t border-white/5 p-4 bg-[#070b1d]/40">
          <div className="mb-4 flex items-center gap-3 px-1 cursor-pointer" onClick={() => {
            const base = user?.role === 'parent' || user?.role === 'student' ? '/parent' : user?.role === 'fee_collector' ? '/fc' : `/${user?.role}`;
            navigate(`${base}/profile`);
            if (window.innerWidth < 1024) onClose?.();
          }}>
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl overflow-hidden shadow-inner border border-blue-500/10">
              {user?.profile_photo ? (
                <img src={`${process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : ''}${user.profile_photo}`} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-blue-600/30 to-indigo-500/30 text-blue-300 text-sm font-extrabold flex items-center justify-center">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="truncate text-xs font-bold text-slate-100">{user?.name}</div>
              <div className="text-[9px] font-semibold tracking-wider uppercase text-slate-500 mt-0.5">{user?.linkedTeacher?.staff_type || user?.role?.replace('_', ' ')}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold bg-white/5 text-slate-400 border border-white/5 transition-all hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/15"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
