import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import TopBar  from '../../components/common/TopBar';

const titles = {
  '/admin2':            'Admin2 Dashboard',
  '/admin2/results':    'Result Approvals',
  '/admin2/datesheets': 'Exam Datesheets',
  '/admin2/incharge':   'Class Incharge',
  '/admin2/admissions': 'Admission Requests',
  '/admin2/teachers':   'Teacher Attendance',
  '/admin2/credentials': 'Credential Management',
  '/admin2/profile':     'My Profile',
  '/admin2/bulk-upload': 'Bulk Student Admission',
  '/admin2/timetable':   'Timetable',
  '/admin2/events':      'Upcoming Events',
  '/admin2/notifications': 'Notifications',
};

export default function Admin2Layout() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar isOpen={open} onClose={() => setOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar title={titles[pathname] || 'Admin2'} onMenuClick={() => setOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}