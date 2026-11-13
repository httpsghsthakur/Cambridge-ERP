import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import TopBar  from '../../components/common/TopBar';

const titles = {
  '/parent':               'Overview',
  '/parent/profile':       'My Profile',
  '/parent/timetable':     'Timetable',
  '/parent/attendance':    'My Attendance',
  '/parent/exams':         'Exam Datesheet',
  '/parent/report-card':   'Report Card',
  '/parent/achievements':  'Achievements & Recognition',
  '/parent/events':        'Upcoming Events',
  '/parent/fees':          'Fee Status',
  '/parent/notifications': 'Notifications',
  '/parent/my-documents':  'My Documents',
};

export default function ParentLayout() {
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
          title={titles[pathname] || 'Portal'}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-2.5 sm:p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}