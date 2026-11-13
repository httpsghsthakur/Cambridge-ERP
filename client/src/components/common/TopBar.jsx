import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import SendMessageModal from '../forms/SendMessageModal';

// Breadcrumbs helper mapping
const routeBreadcrumbs = {
  '/admin': ['Dashboard', 'Home'],
  '/admin/students': ['Dashboard', 'Student Management'],
  '/admin/student-approvals': ['Dashboard', 'Student Approvals'],
  '/admin/teachers': ['Dashboard', 'Teacher Management'],
  '/admin/teacher-attendance': ['Dashboard', 'Teacher Attendance'],
  '/admin/attendance': ['Dashboard', 'Student Attendance'],
  '/admin/fees': ['Dashboard', 'Fee Management'],
  '/admin/class-fees': ['Dashboard', 'Class Fees'],
  '/admin/marks': ['Dashboard', 'Examinations & Marks'],
  '/admin/timetable': ['Dashboard', 'Academic Timetable'],
  '/admin/promotion': ['Dashboard', 'Student Promotion'],
  '/admin/notifications': ['Dashboard', 'Notifications & Announcements'],
  '/admin/credentials': ['Dashboard', 'Credential Manager'],
  '/admin2/notifications': ['Dashboard', 'Notifications & Announcements'],
  '/teacher/notifications': ['Dashboard', 'Notifications & Announcements'],
  '/fc/notifications': ['Dashboard', 'Notifications & Announcements'],
  
  '/parent': ['Dashboard', 'My Child Overview'],
  '/parent/profile': ['Dashboard', 'My Profile'],
  '/parent/attendance': ['Dashboard', 'Attendance History'],
  '/parent/report-card': ['Dashboard', 'Results & Report Card'],
  '/parent/fees': ['Dashboard', 'Fee Structure & Status'],
  '/parent/notifications': ['Dashboard', 'Notices & Alerts'],
  
  '/teacher': ['Dashboard', 'Teacher Overview'],
  '/teacher/attendance': ['Dashboard', 'Mark Class Attendance'],
  '/teacher/marks': ['Dashboard', 'Enter Exam Marks'],
  '/teacher/incharge-results': ['Dashboard', 'Class Incharge Results'],
  '/teacher/my-attendance': ['Dashboard', 'My Attendance Log'],
  
  '/fc': ['Dashboard', 'Fee Collector Home'],
  '/fc/collect': ['Dashboard', 'Search & Collect Fees'],
  '/fc/admission': ['Dashboard', 'New Student Admission'],
  '/fc/admissions': ['Dashboard', 'Admissions Log'],
  '/fc/profile': ['Dashboard', 'My Profile'],
  '/admin/profile': ['Dashboard', 'My Profile'],
  '/admin2/profile': ['Dashboard', 'My Profile'],
  '/teacher/profile': ['Dashboard', 'My Profile'],
};

export default function TopBar({ title, onMenuClick }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        if (user?.role === 'admin' || user?.role === 'admin2') {
          // Admins can fetch all sessions
          const res = await API.get('/session');
          const list = res.data || [];
          setSessions(list);
          const active = list.find(s => s.is_active);
          if (active) {
            setActiveSession(active);
            setSelectedSessionId(active.id);
          }
        } else {
          // Other roles can only fetch the active session
          const res = await API.get('/session/active');
          if (res.data) {
            setActiveSession(res.data);
            setSelectedSessionId(res.data.id);
            setSessions([res.data]);
          }
        }
      } catch (err) {
        console.error('Failed to load session data:', err);
      } finally {
        setLoadingSessions(false);
      }
    };

    if (user) {
      fetchSessionData();
    }
  }, [user]);

  const handleSessionChange = async (e) => {
    const sessionId = e.target.value;
    setSelectedSessionId(sessionId);

    if (user?.role !== 'admin') {
      toast.error('Only Super Admin can activate academic sessions.');
      return;
    }

    const toastId = toast.loading('Activating session...');
    try {
      await API.put(`/session/${sessionId}/activate`);
      toast.success('Session activated successfully!', { id: toastId });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to activate session.', { id: toastId });
      if (activeSession) {
        setSelectedSessionId(activeSession.id);
      }
    }
  };
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

  useEffect(() => {
    API.get('/notifications')
      .then(r => {
        const unread = r.data.filter(n => !n.is_read).length;
        setUnreadNotifsCount(unread);
      })
      .catch(() => {});
  }, [location.pathname]);

  const breadcrumb = routeBreadcrumbs[location.pathname] || ['Portal', title];
  // Fallbacks for display
  const isStudentPortal = ['parent', 'student'].includes(user?.role);
  const profileName = user?.name || 'User';
  const profileSub  = isStudentPortal
    ? (user?.linkedStudent ? `Class ${user.linkedStudent.class}-${user.linkedStudent.section}` : 'Student')
    : user?.role === 'admin' ? 'Super Admin'
    : user?.role?.replace('_', ' ') || 'Staff';

  const profileBasePath = user?.role === 'parent' || user?.role === 'student' ? '/parent' : user?.role === 'fee_collector' ? '/fc' : `/${user?.role}`;

  return (
    <header className="h-16 bg-white border-b border-slate-100 px-6 flex items-center justify-between flex-shrink-0 sticky top-0 z-20 shadow-sm shadow-slate-100/50">
      
      {/* Title & Breadcrumbs */}
      <div className="flex items-center gap-4">
        {/* Hamburger Mobile Toggle */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all"
          aria-label="Open menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="min-w-0">
          <h1 className="text-base font-extrabold text-slate-800 tracking-tight leading-none">{title}</h1>
          <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-semibold text-slate-400">
            <span>{breadcrumb[0]}</span>
            <svg className="w-3 h-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-blue-500 font-bold">{breadcrumb[1]}</span>
          </div>
        </div>
      </div>

      {/* Global Actions Controls */}
      <div className="flex items-center gap-4 sm:gap-6">
        
        {/* Academic Session Picker */}
        <div className="relative hidden sm:flex items-center">
          <svg className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <select
            value={selectedSessionId}
            onChange={handleSessionChange}
            disabled={user?.role !== 'admin' || loadingSessions}
            className="pl-9 pr-8 py-2 bg-slate-50 border border-slate-100 hover:border-slate-200 text-xs font-bold text-slate-700 rounded-xl outline-none appearance-none cursor-pointer transition-all disabled:opacity-85 disabled:cursor-not-allowed"
          >
            {loadingSessions ? (
              <option>Loading...</option>
            ) : (
              sessions.map(s => (
                <option key={s.id} value={s.id}>
                  {s.is_active ? `Active Session: ${s.name}` : `Session: ${s.name}`}
                </option>
              ))
            )}
          </select>
          <svg className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Dynamic Alerts Buttons */}
        <div className="flex items-center gap-2">
          
          {/* Messages Button */}
          <button 
            onClick={() => setIsMessageModalOpen(true)}
            className="p-2.5 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all relative"
            title="Send Message"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>

          {/* Notifications Bell */}
          <button 
            onClick={() => navigate(`${profileBasePath}/notifications`)}
            className="p-2.5 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all relative"
            title="View Notifications"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadNotifsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-[9px] font-bold text-white flex items-center justify-center rounded-full ring-2 ring-white animate-pulse">
                {unreadNotifsCount}
              </span>
            )}
          </button>
        </div>

        {/* User Account Info Dropdown */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-100">
          <div
            className="w-10 h-10 rounded-xl overflow-hidden shadow-inner flex-shrink-0 relative group cursor-pointer"
            onClick={() => navigate(`${profileBasePath}/profile`)}
          >
            {user?.profile_photo ? (
              <img
                src={`${process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : ''}${user.profile_photo}`}
                alt="Profile"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-extrabold text-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                {user?.name?.[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="hidden md:block leading-none">
            <div className="text-xs font-extrabold text-slate-800 max-w-[130px] truncate">{profileName}</div>
            <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{profileSub}</div>
          </div>
        </div>

      </div>

      {isMessageModalOpen && (
        <SendMessageModal onClose={() => setIsMessageModalOpen(false)} />
      )}
    </header>
  );
}
