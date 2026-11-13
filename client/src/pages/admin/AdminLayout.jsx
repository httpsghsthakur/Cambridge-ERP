import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import TopBar  from '../../components/common/TopBar';
import ErrorBoundary from '../../components/common/ErrorBoundary';

const titles = {
  '/admin':               'Dashboard',
  '/admin/students':      'Student Management',
  '/admin/teachers':      'Teacher Management',
  '/admin/attendance':    'Attendance',
  '/admin/teacher-attendance': 'Teacher Attendance',
  '/admin/incharge':      'Class Incharge',
  '/admin/fees':          'Fees Management',
  '/admin/fee-structure': 'Fee Structure',
  '/admin/marks':         'Marks & Results',
  '/admin/results':       'Result Declarations',
  '/admin/datesheets':    'Exam Datesheets',
  '/admin/timetable':     'Timetable',
  '/admin/promotion':     'Session & Promotion',
  '/admin/notifications': 'Notifications',
  '/admin/events':        'Upcoming Events',
  '/admin/credentials':   'Credential Management',
  '/admin/profile':       'My Profile',
  '/admin/bulk-upload':   'Bulk Student Admission',
  '/admin/admissions':    'Admission Requests',
  '/admin/settings':      'Settings',
  '/admin/logs':          'Activity Logs',
  '/admin/security-logs': 'Security Logs',
  '/admin/documents':     'Document Requests',
  '/admin/my-documents':  'My Documents',
};

export default function AdminLayout() {
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar
          title={titles[pathname] || 'Admin'}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
