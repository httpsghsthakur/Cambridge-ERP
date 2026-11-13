import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import TopBar  from '../../components/common/TopBar';

const titles = {
  '/fc':             'Fee Collector Dashboard',
  '/fc/collect':     'Collect Fees',
  '/fc/search':      'Search Students',
  '/fc/admission':   'New Admission',
  '/fc/admissions':  'Admission Requests',
  '/fc/credentials': 'Credential Management',
  '/fc/profile':     'My Profile',
  '/fc/bulk-upload':  'Bulk Student Admission',
  '/fc/notifications': 'Notifications',
};

export default function FCLayout() {
  const { pathname }   = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar isOpen={open} onClose={() => setOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar title={titles[pathname] || 'Fee Collector'} onMenuClick={() => setOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}