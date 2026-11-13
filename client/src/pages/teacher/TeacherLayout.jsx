import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import TopBar  from '../../components/common/TopBar';
import { useAuth } from '../../context/AuthContext';

export default function TeacherLayout() {
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const staffType = user?.linkedTeacher?.staff_type || 'Teacher';

  const titles = {
    '/teacher':            `${staffType} Dashboard`,
    '/teacher/attendance': 'Mark Attendance',
    '/teacher/marks':      'Enter Marks',
    '/teacher/incharge-results': 'Incharge Results',
    '/teacher/datesheet':    'Exam Datesheet',
    '/teacher/achievements': 'Student Achievements',
    '/teacher/my-attendance': 'My Attendance',
    '/teacher/leaves':       'Leave Management',
    '/teacher/timetable':    'Timetable',
    '/teacher/my-documents': 'My Documents',
    '/teacher/profile':      'My Profile',
    '/teacher/notifications': 'Notifications',
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar
          title={titles[pathname] || staffType}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-2.5 sm:p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
