import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';
import StatCard from '../../components/common/StatCard';

export default function TeacherDashboard() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const teacher    = user?.linkedTeacher;
  const staffType  = teacher?.staff_type || 'Teacher';
  const isTeacher  = staffType === 'Teacher';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    stats: {
      assigned_classes: 0,
      total_students: 0,
      attendance_present: 0,
      attendance_marked: 0,
      attendance_percentage: 0,
      pending_approvals: 0
    },
    timetable: [],
    announcements: [],
    events: []
  });

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const res = await API.get('/dashboard/teacher');
        setData(res.data);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to fetch dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-xs text-gray-400 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-800">
          Welcome, {teacher?.name || user?.name}
        </h2>
        <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
          {staffType} {isTeacher ? `· ${teacher?.assigned_classes || 'No classes assigned'}` : ''}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {isTeacher && (
          <>
            <StatCard 
              label="My Classes" 
              value={data.stats.assigned_classes} 
              sub="Sections" 
              icon={<svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>} 
            />
            <StatCard 
              label="Students" 
              value={data.stats.total_students} 
              sub="Total Enrolled" 
              icon={<svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>} 
            />
            <StatCard 
              label="Avg Attendance" 
              value={`${data.stats.attendance_percentage}%`} 
              sub="Class Cumulative" 
              icon={<svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>} 
              color="text-emerald-600" 
            />
          </>
        )}
        
        {/* Clickable Pending Approvals card */}
        {isTeacher && (
          <div 
            onClick={() => navigate('/teacher/incharge-results')}
            className={`cursor-pointer rounded-xl border p-4 transition-all duration-300 ${
              data.stats.pending_approvals > 0 
                ? 'border-amber-250 bg-amber-50/50 hover:bg-amber-50 hover:shadow-md hover:scale-[1.02]' 
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium text-gray-500 leading-tight">Pending Approvals</p>
              <span className="text-xl opacity-70 flex-shrink-0">
                <svg className={`w-5 h-5 ${data.stats.pending_approvals > 0 ? 'text-amber-500 animate-pulse' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </span>
            </div>
            <p className={`text-xl sm:text-2xl font-bold mt-2 leading-tight ${data.stats.pending_approvals > 0 ? 'text-amber-600' : 'text-gray-800'}`}>
              {data.stats.pending_approvals}
            </p>
            <p className="text-xs text-gray-400 mt-1 leading-tight">
              {data.stats.pending_approvals > 0 ? 'Click to review results' : 'All caught up'}
            </p>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {isTeacher && (
          <>
            <button
              onClick={() => navigate('/teacher/attendance')}
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 active:from-blue-700 active:to-blue-600 text-white rounded-xl shadow-sm hover:shadow transition-all text-left"
            >
              <span className="flex-shrink-0 text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              </span>
              <div>
                <p className="font-semibold text-sm">Mark Attendance</p>
                <p className="text-xs text-blue-100 mt-0.5">Record today's attendance</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/teacher/marks')}
              className="flex items-center gap-3 p-4 bg-white border border-gray-200 hover:bg-gray-50 active:bg-gray-100 rounded-xl shadow-sm transition-all text-left"
            >
              <span className="flex-shrink-0 text-gray-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
              </span>
              <div>
                <p className="font-semibold text-sm text-gray-800">Enter Marks</p>
                <p className="text-xs text-gray-400 mt-0.5">Submit exam results</p>
              </div>
            </button>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Today's schedule */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col justify-between">
          <div>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-sm font-bold text-gray-700">Today's Schedule</h3>
              </div>
              <span className="text-xs font-semibold text-gray-500 bg-gray-150 px-2.5 py-1 rounded-full border border-gray-200">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {data.timetable.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="flex justify-center mb-3">
                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-gray-500">No classes scheduled for today.</p>
                  <p className="text-xs text-gray-400 mt-0.5">Enjoy your free time or prepare for lessons!</p>
                </div>
              ) : (
                data.timetable.map((cls, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 text-xs font-extrabold flex items-center justify-center flex-shrink-0 border border-indigo-100/50">
                        P{cls.period_number}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{cls.class} - {cls.section} · {cls.subject}</p>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                          <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{cls.start_time?.slice(0, 5)} - {cls.end_time?.slice(0, 5)}</span>
                        </div>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1 rounded-lg self-start sm:self-auto">
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      {cls.student_count} Students
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Notices & Events */}
        <div className="space-y-5">
          {/* Announcements card */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <h3 className="text-sm font-bold text-gray-700">Recent Notices</h3>
            </div>
            <div className="divide-y divide-gray-100 p-4 space-y-3.5">
              {data.announcements.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No recent notices found.</p>
              ) : (
                data.announcements.map((notif, index) => (
                  <div key={index} className="space-y-1.5 py-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-gray-800 line-clamp-1">{notif.title}</h4>
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase bg-indigo-50 text-indigo-700 tracking-wider">
                        {notif.type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-normal line-clamp-2">{notif.message}</p>
                    <p className="text-[9px] text-gray-400 font-medium">
                      {new Date(notif.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Events card */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
              <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-sm font-bold text-gray-700">Upcoming Events</h3>
            </div>
            <div className="divide-y divide-gray-100 p-4 space-y-3.5">
              {data.events.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No upcoming events found.</p>
              ) : (
                data.events.map((event, index) => (
                  <div key={index} className="flex gap-3 py-1">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex flex-col items-center justify-center font-bold">
                      <span className="text-[9px] uppercase font-bold leading-none tracking-wider">
                        {new Date(event.event_date).toLocaleString('default', { month: 'short' })}
                      </span>
                      <span className="text-sm leading-none mt-0.5 font-extrabold">
                        {new Date(event.event_date).getDate()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-gray-800 truncate">{event.title}</h4>
                      {event.description && (
                        <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{event.description}</p>
                      )}
                      {event.location && (
                        <p className="text-[9px] text-gray-400 flex items-center gap-1 mt-0.5 font-medium">
                          <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{event.location}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}