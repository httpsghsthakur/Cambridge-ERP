import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { getTimeBasedGreeting } from '../../utils/helpers';

export default function Dashboard() {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState(getTimeBasedGreeting);

  useEffect(() => {
    const timer = setInterval(() => {
      setGreeting(getTimeBasedGreeting());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const [students, setStudents] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [stats, setStats] = useState({});
  const [sparklines, setSparklines] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [events, setEvents] = useState([]);
  const [chartPeriod, setChartPeriod] = useState('current_month');
  const [chartData, setChartData] = useState([]);
  const [chartHasData, setChartHasData] = useState(false);
  const [chartStats, setChartStats] = useState({ attendance: '0%', fees: '0%', teacherAttendance: '0%' });
  const navigate = useNavigate();

  const [lowAttendance, setLowAttendance] = useState([]);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentSearchResults, setStudentSearchResults] = useState([]);
  const [selectedStudentAttendance, setSelectedStudentAttendance] = useState(null);
  const [searchingStudent, setSearchingStudent] = useState(false);
  const [showStudentResults, setShowStudentResults] = useState(false);
  const searchTimer = useRef(null);

  useEffect(() => {
    Promise.all([
      API.get('/dashboard/admin').catch(err => { console.error('[Dashboard] admin API fail:', err); return { data: {} }; }),
      API.get('/events').catch(() => ({ data: [] })),
      API.get('/dashboard/low-attendance').catch(() => ({ data: { lowAttendance: [] } }))
    ])
      .then(([dashRes, eventsRes, lowAttRes]) => {
        const data = dashRes.data || {};
        setStudents(Array.isArray(data.recent_students) ? data.recent_students : []);
        setNotifs(Array.isArray(data.notifications) ? data.notifications : []);
        setStats(data.stats || {});
        setSparklines(data.sparklines || {});
        setEvents(Array.isArray(eventsRes.data) ? eventsRes.data : []);
        setLowAttendance(Array.isArray(lowAttRes.data.lowAttendance) ? lowAttRes.data.lowAttendance : []);
      })
      .catch((err) => {
        console.error('[Dashboard] Fatal load error:', err);
        setError('Failed to load dashboard data. Please reload the page.');
        toast.error('Failed to load dashboard metrics');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    API.get(`/dashboard/chart?period=${chartPeriod}`)
      .then(({ data }) => {
        const pts = Array.isArray(data.data) ? data.data : [];
        const hasReal = data.hasData !== undefined
          ? Boolean(data.hasData)
          : pts.some(d => d.attendance !== null || d.fees !== null || d.teacherAttendance !== null);
        setChartData(pts);
        setChartHasData(hasReal);
        setChartStats(data.averages || { attendance: '0%', fees: '0%', teacherAttendance: '0%' });
      })
      .catch(() => {});
  }, [chartPeriod]);

  const handleStudentSearch = (q) => {
    setStudentSearchQuery(q);
    if (!q.trim()) {
      setStudentSearchResults([]);
      setShowStudentResults(false);
      return;
    }
    setShowStudentResults(true);
    setSearchingStudent(true);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      API.get(`/students?search=${encodeURIComponent(q)}&limit=5`)
        .then(res => setStudentSearchResults(res.data.students || []))
        .catch(err => console.error(err))
        .finally(() => setSearchingStudent(false));
    }, 500);
  };

  const fetchStudentAttendance = (student) => {
    setShowStudentResults(false);
    setSelectedStudentAttendance({ loading: true, student });
    API.get(`/dashboard/student-attendance/${student.id}`)
      .then(res => {
        setSelectedStudentAttendance({ loading: false, data: res.data, student });
      })
      .catch(err => {
        toast.error('Failed to fetch attendance for student');
        setSelectedStudentAttendance(null);
      });
  };


  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md text-center">
          <h3 className="text-lg font-bold text-red-800 mb-2">Dashboard Error</h3>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl text-sm font-semibold">
            Reload Page
          </button>
        </div>
      </div>
    );
  }
  // Get current date details
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed
  const todayDate = currentDate.getDate();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthYearString = `${monthNames[currentMonth]} ${currentYear}`;

  // Calculate days for the calendar matrix
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const totalDaysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const dynamicCalendarDays = [];

  // 1. Fill previous month's padding days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    dynamicCalendarDays.push({
      day: totalDaysInPrevMonth - i,
      currentMonth: false,
      isToday: false
    });
  }

  // 2. Fill current month's days
  for (let i = 1; i <= totalDaysInMonth; i++) {
    dynamicCalendarDays.push({
      day: i,
      currentMonth: true,
      isToday: i === todayDate
    });
  }

  // 3. Fill next month's padding days to make it a perfect grid (42 cells)
  const remainingCells = 42 - dynamicCalendarDays.length;
  for (let i = 1; i <= remainingCells; i++) {
    dynamicCalendarDays.push({
      day: i,
      currentMonth: false,
      isToday: false
    });
  }

  // Dynamic Events list: map real events
  const mappedEvents = events.map(e => {
    const colors = [
      'text-blue-500 bg-blue-50 border-blue-100',
      'text-amber-500 bg-amber-50 border-amber-100',
      'text-emerald-500 bg-emerald-50 border-emerald-100',
      'text-purple-500 bg-purple-50 border-purple-100'
    ];
    const color = colors[e.id % colors.length] || colors[0];
    const eventDate = new Date(e.event_date);
    const dateStr = eventDate.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    return {
      id: e.id,
      title: e.title,
      date: dateStr,
      color: color
    };
  });

  const displayEvents = mappedEvents.slice(0, 4);

  // Dynamic values binding real API stats
  const studentCount = stats.total_students || 0;
  const teacherCount = stats.active_teachers || 0;
  const classCount   = stats.total_classes || 0;
  const feeTotal     = stats.fee_total || 0;
  const feeCollected = stats.fee_collected || 0;
  const feePending   = stats.pending_fee_amount || 0;
  const feeAmount    = `₹ ${Number(feeCollected).toLocaleString('en-IN')}`;

  const studentSpark = sparklines.students?.length >= 2 ? sparklines.students : [{ value: studentCount }, { value: studentCount }];
  const teacherSpark = sparklines.teachers?.length >= 2 ? sparklines.teachers : [{ value: teacherCount }, { value: teacherCount }];
  const classSpark   = sparklines.classes?.length >= 2  ? sparklines.classes  : [{ value: classCount },   { value: classCount }];
  const feeSpark     = sparklines.fees?.length >= 2     ? sparklines.fees     : [{ value: feeCollected }, { value: feeCollected }];

  const feePct     = feeTotal > 0 ? Math.min(100, Math.round((feeCollected / feeTotal) * 100)) : 0;
  const pendingPct = feeTotal > 0 ? Math.max(0, 100 - feePct) : 0;

  // Donut chart collections
  const feeDonutData = feeTotal > 0 ? [
    { name: 'Collected', value: feeCollected, color: '#22c55e' },
    { name: 'Pending', value: Math.max(feePending, 0), color: '#f59e0b' }
  ] : [
    { name: 'No Data', value: 1, color: '#e2e8f0' }
  ];

  const presentOnly      = stats.attendance_present || 0;
  const lateCount        = stats.attendance_late || 0;
  const presentCount     = presentOnly + lateCount;
  const markedCount      = stats.attendance_marked || 0;
  const absentCount      = stats.attendance_absent !== undefined ? stats.attendance_absent : Math.max(markedCount - presentCount, 0);
  const presentPct       = markedCount > 0 ? Math.min(100, Math.round((presentCount / markedCount) * 100)) : 0;
  const absentPct        = markedCount > 0 ? Math.max(0, 100 - presentPct) : 0;

  const attDonutData = markedCount > 0 ? [
    { name: 'Present', value: presentCount, color: '#22c55e' },
    { name: 'Absent', value: absentCount, color: '#f59e0b' }
  ] : [
    { name: 'No Data', value: 1, color: '#e2e8f0' }
  ];

  return (
    <div className="space-y-6">
      
      {/* 1. Header Greeting Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            {greeting}, {user?.name || 'Admin'}!
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 font-semibold uppercase tracking-wider">Welcome back to the School ERP</p>
        </div>
      </div>

      {/* 2. Key Stats sparkline cards (4 columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Stat 1: Total Students */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-card hover:shadow-premium transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg border border-blue-100/60">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Students</p>
                <h3 className="text-xl font-extrabold text-slate-800 tracking-tight mt-0.5">{studentCount}</h3>
              </div>
            </div>
            {/* Sparkline chart */}
            <div className="w-16 h-8">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={studentSpark}>
                  <defs>
                    <linearGradient id="glowBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={1.5} fillOpacity={1} fill="url(#glowBlue)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="mt-4 pt-3.5 border-t border-slate-50 flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-medium">6-month trend</span>
          </div>
        </div>

        {/* Stat 2: Total Teachers */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-card hover:shadow-premium transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg border border-emerald-100/60">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Teachers</p>
                <h3 className="text-xl font-extrabold text-slate-800 tracking-tight mt-0.5">{teacherCount}</h3>
              </div>
            </div>
            {/* Sparkline */}
            <div className="w-16 h-8">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={teacherSpark}>
                  <defs>
                    <linearGradient id="glowGreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={1.5} fillOpacity={1} fill="url(#glowGreen)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="mt-4 pt-3.5 border-t border-slate-50 flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-medium">6-month trend</span>
          </div>
        </div>

        {/* Stat 3: Total Classes */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-card hover:shadow-premium transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg border border-purple-100/60">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Classes</p>
                <h3 className="text-xl font-extrabold text-slate-800 tracking-tight mt-0.5">{classCount}</h3>
              </div>
            </div>
            {/* Sparkline */}
            <div className="w-16 h-8">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={classSpark}>
                  <defs>
                    <linearGradient id="glowPurple" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={1.5} fillOpacity={1} fill="url(#glowPurple)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="mt-4 pt-3.5 border-t border-slate-50 flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-medium">Active classes</span>
          </div>
        </div>

        {/* Stat 4: Fee Collection */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-card hover:shadow-premium transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg border border-amber-100/60">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fee Collection</p>
                <h3 className="text-xl font-extrabold text-slate-800 tracking-tight mt-0.5">{feeAmount}</h3>
              </div>
            </div>
            {/* Sparkline */}
            <div className="w-16 h-8">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={feeSpark}>
                  <defs>
                    <linearGradient id="glowAmber" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={1.5} fillOpacity={1} fill="url(#glowAmber)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="mt-4 pt-3.5 border-t border-slate-50 flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-medium">Real-time stat</span>
          </div>
        </div>

      </div>

      {/* 3. Main Chart & Calendar events row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Area Chart Card (8 cols) */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-card lg:col-span-8 flex flex-col justify-between">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">ERP Overview Charts</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Live academic, attendance and financial metrics</p>
            </div>
            
            {/* Dropdown switch */}
            <div className="relative">
              <select
                value={chartPeriod}
                onChange={(e) => setChartPeriod(e.target.value)}
                className="pl-3.5 pr-8 py-1.5 bg-slate-50 border border-slate-100 hover:border-slate-200 text-[10px] font-bold text-slate-600 rounded-xl outline-none appearance-none cursor-pointer transition-all"
              >
                <option value="current_month">Current Month</option>
                <option value="last_2_months">Last 2 Months</option>
                <option value="last_3_months">Last 3 Months</option>
                <option value="last_6_months">Last 6 Months</option>
                <option value="last_12_months">Last 12 Months (1 Year)</option>
              </select>
              <svg className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Indicators Legend */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-5 pl-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 block" /> Attendance ({chartStats.attendance})
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block" /> Fee Collection ({chartStats.fees})
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 block" /> Teacher Attendance ({chartStats.teacherAttendance})
            </div>
          </div>

          {/* Recharts Area Chart */}
          <div className="h-64 w-full">
            {chartData && chartData.length >= 2 && chartHasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="mainBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.12}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="mainGreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.12}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="mainPurple" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.12}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={(value, name) => [value !== null && value !== undefined ? `${value}%` : 'No records', name]} />
                  <Area type="monotone" connectNulls dataKey="attendance" name="Student Attendance" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#mainBlue)" dot={{ r: 3.5 }} />
                  <Area type="monotone" connectNulls dataKey="fees" name="Fee Collection" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#mainGreen)" dot={{ r: 3.5 }} />
                  <Area type="monotone" connectNulls dataKey="teacherAttendance" name="Teacher Attendance" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#mainPurple)" dot={{ r: 3.5 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 px-4 text-center">
                <svg className="w-8 h-8 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                <p className="text-xs font-bold text-slate-400">No recorded attendance or fee data for this time range yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Calendar Card Widget (4 cols) */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-card lg:col-span-4 flex flex-col justify-between">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between mb-4">
            <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Calendar</h3>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{monthYearString}</span>
          </div>

          {/* Mini Calendar grid */}
          <div className="grid grid-cols-7 gap-y-2.5 gap-x-1.5 text-center flex-1 justify-items-center">
            {/* Headers */}
            {['S','M','T','W','T','F','S'].map((h, i) => (
              <div key={i} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-1">{h}</div>
            ))}
            
            {/* Days matrix */}
            {dynamicCalendarDays.map((item, i) => {
              let cellClass = "w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ";
              if (!item.currentMonth) {
                cellClass += "text-slate-300 opacity-20 pointer-events-none select-none";
              } else if (item.isToday) {
                cellClass += "bg-blue-600 text-white shadow-md shadow-blue-500/10 ring-2 ring-blue-500/25 cursor-pointer";
              } else {
                cellClass += "text-slate-600 hover:bg-slate-50 cursor-pointer";
              }
              return (
                <div key={i} className={cellClass}>
                  {item.day}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 4. Donut summaries row (2 columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Donut 1: Fee Collection Summary */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-card flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex-1 w-full space-y-4">
            <div className="pb-3 border-b border-slate-50">
              <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Fee Collection Summary</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Total Expected: ₹ {Number(feeTotal).toLocaleString('en-IN')}</p>
            </div>
            
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl">
                <span className="flex items-center gap-1.5 font-bold text-slate-600"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block" /> Collected</span>
                <span className="font-extrabold text-slate-700">₹ {Number(feeCollected).toLocaleString('en-IN')} ({feePct}%)</span>
              </div>
              <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl">
                <span className="flex items-center gap-1.5 font-bold text-slate-600"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 block" /> Pending</span>
                <span className="font-extrabold text-amber-600">₹ {Number(feePending).toLocaleString('en-IN')} ({pendingPct}%)</span>
              </div>
            </div>

            <button 
              onClick={() => navigate('/admin/fees')}
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-extrabold hover:underline"
            >
              View Fee Details
              <span>➔</span>
            </button>
          </div>

          {/* Donut chart */}
          <div className="w-40 h-40 flex-shrink-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={feeDonutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {feeDonutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Collected</span>
              <span className="text-lg font-black text-slate-800 mt-1">{feePct}%</span>
            </div>
          </div>
        </div>

        {/* Donut 2: Attendance Summary */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-card flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex-1 w-full space-y-4">
            <div className="pb-3 border-b border-slate-50">
              <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Attendance Summary</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Total Marked: {markedCount} Students</p>
            </div>
            
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl">
                <span className="flex items-center gap-1.5 font-bold text-slate-600"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block" /> Present</span>
                <span className="font-extrabold text-slate-700">{presentCount} ({presentPct}%)</span>
              </div>
              <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl">
                <span className="flex items-center gap-1.5 font-bold text-slate-600"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 block" /> Absent</span>
                <span className="font-extrabold text-amber-600">{absentCount} ({absentPct}%)</span>
              </div>
            </div>

            <button 
              onClick={() => navigate('/admin/attendance')}
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-extrabold hover:underline"
            >
              View Attendance Report
              <span>➔</span>
            </button>
          </div>

          {/* Donut chart */}
          <div className="w-40 h-40 flex-shrink-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attDonutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {attDonutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Attendance</span>
              <span className="text-lg font-black text-slate-800 mt-1">{presentPct}%</span>
            </div>
          </div>
        </div>

      </div>

      {/* 5. Events & Announcements row (2 columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Upcoming Events Card */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-card flex flex-col justify-between">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between mb-4">
            <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Upcoming Events</h3>
            <button
              onClick={() => navigate('/admin/events')}
              className="text-[10px] font-bold text-blue-500 hover:underline uppercase tracking-wider"
            >
              View All
            </button>
          </div>

          <div className="space-y-3.5 flex-1">
            {displayEvents.length === 0 ? (
              <div className="text-center py-8 space-y-2.5">
                <p className="text-slate-400 text-xs font-medium">No upcoming events scheduled.</p>
                <button
                  onClick={() => navigate('/admin/events')}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  + Add Event
                </button>
              </div>
            ) : (
              displayEvents.map((item, i) => (
                <div
                  key={item.id || i}
                  onClick={() => navigate('/admin/events')}
                  className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-2xl cursor-pointer transition-colors"
                >
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800">{item.title}</h4>
                    <p className="text-[10px] font-semibold text-slate-400 mt-1 flex items-center gap-1">{item.date}</p>
                  </div>
                  <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full border uppercase tracking-wider ${item.color.split(' ')[0]} ${item.color.split(' ')[1]} ${item.color.split(' ')[2]}`}>
                    Upcoming
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Announcements Board */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-card flex flex-col justify-between">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between mb-4">
            <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Recent Announcements</h3>
            <button onClick={() => navigate('/admin/notifications')} className="text-[10px] font-bold text-blue-500 hover:underline uppercase tracking-wider">View All</button>
          </div>

          <div className="space-y-4 flex-1">
            {notifs.length === 0 ? (
              <p className="text-center text-gray-400 text-xs py-8">No recent announcements</p>
            ) : (
              notifs.map((item) => {
                const dateStr = new Date(item.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
                let icon = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>;
                let bg = 'bg-purple-50 text-purple-600';
                if (item.type === 'holiday') {
                  icon = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>;
                  bg = 'bg-emerald-50 text-emerald-600';
                } else if (item.type === 'fee_reminder') {
                  icon = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>;
                  bg = 'bg-amber-50 text-amber-600';
                } else if (item.type === 'attendance_alert') {
                  icon = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>;
                  bg = 'bg-red-50 text-red-600';
                } else if (item.type === 'result') {
                  icon = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>;
                  bg = 'bg-blue-50 text-blue-600';
                }
                return (
                  <div key={item.id} className="flex gap-3 px-1 py-1 hover:bg-slate-50/50 rounded-xl transition-colors">
                    <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center text-lg font-bold flex-shrink-0 mt-0.5`}>{icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-extrabold text-slate-800 truncate">{item.title}</h4>
                        <span className="text-[9px] font-bold text-slate-400 flex-shrink-0">{dateStr}</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-500 mt-1 leading-normal">{item.message}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* 7. Student Attendance Search & Low Attendance Alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Low Attendance Alerts */}
        <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-card flex flex-col h-96">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between mb-4">
            <h3 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Low Attendance Alerts (&lt; 80%)
            </h3>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{lowAttendance.length} Students</span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
            {lowAttendance.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <svg className="w-10 h-10 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs font-bold">All students have good attendance!</p>
              </div>
            ) : (
              lowAttendance.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 bg-red-50/50 border border-red-100 rounded-2xl">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800">{item.student.first_name} {item.student.last_name}</h4>
                    <p className="text-[11px] font-semibold text-slate-500 mt-1">
                      Roll No: <span className="text-slate-700">{item.student.roll_number}</span> &bull; Class: <span className="text-slate-700">{item.student.class} - {item.student.section}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-red-600">{item.percentage}%</div>
                    <div className="text-[9px] font-bold text-red-400 uppercase tracking-wider">{item.present}/{item.total} Days</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Student Attendance Search */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-card flex flex-col h-96 relative">
          <div className="pb-4 border-b border-slate-100 mb-4">
            <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Student Attendance Search</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Search by Name or Roll No</p>
          </div>

          <div className="relative mb-4">
            <input 
              type="text" 
              placeholder="E.g. John or 105..." 
              value={studentSearchQuery}
              onChange={(e) => handleStudentSearch(e.target.value)}
              onFocus={() => { if (studentSearchQuery.trim()) setShowStudentResults(true); }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block pl-10 pr-3 py-3 font-semibold placeholder:font-normal placeholder:text-slate-400"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchingStudent && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            )}

            {/* Dropdown Results */}
            {showStudentResults && studentSearchQuery.trim() !== '' && (
              <div className="absolute z-20 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden max-h-48 overflow-y-auto">
                {studentSearchResults.length > 0 ? (
                  studentSearchResults.map(s => (
                    <div 
                      key={s.id} 
                      onClick={() => fetchStudentAttendance(s)}
                      className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                    >
                      <div className="font-bold text-slate-800 text-xs">{s.first_name} {s.last_name}</div>
                      <div className="text-[10px] text-slate-500 font-semibold mt-0.5">Roll: {s.roll_number} | Class: {s.class}-{s.section}</div>
                    </div>
                  ))
                ) : (
                  !searchingStudent && <div className="p-4 text-center text-xs text-slate-400 font-semibold">No students found.</div>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col justify-center">
            {selectedStudentAttendance ? (
              selectedStudentAttendance.loading ? (
                <div className="flex justify-center"><LoadingSpinner /></div>
              ) : (
                <div className="space-y-4 animate-fadeIn">
                  <div className="text-center pb-3 border-b border-slate-100">
                    <h4 className="text-base font-black text-slate-800">{selectedStudentAttendance.student.first_name} {selectedStudentAttendance.student.last_name}</h4>
                    <p className="text-[11px] font-bold text-slate-500 mt-1">Roll No: {selectedStudentAttendance.student.roll_number}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Monthly</div>
                      <div className={`text-2xl font-black ${selectedStudentAttendance.data.monthly.percentage < 80 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {selectedStudentAttendance.data.monthly.percentage}%
                      </div>
                      <div className="text-[9px] font-bold text-slate-400 mt-1">{selectedStudentAttendance.data.monthly.present}/{selectedStudentAttendance.data.monthly.total} Days</div>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Academic Yr</div>
                      <div className={`text-2xl font-black ${selectedStudentAttendance.data.yearly.percentage < 80 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {selectedStudentAttendance.data.yearly.percentage}%
                      </div>
                      <div className="text-[9px] font-bold text-slate-400 mt-1">{selectedStudentAttendance.data.yearly.present}/{selectedStudentAttendance.data.yearly.total} Days</div>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="text-center text-slate-400 space-y-2">
                <svg className="w-12 h-12 mx-auto text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p className="text-xs font-bold">Search and select a student<br/>to view their attendance.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 8. Quick Links Section */}
      <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-card">
        <div className="pb-4 border-b border-slate-100 flex items-center gap-2.5 mb-5">
          <svg className="w-5 h-5 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Quick Links</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-4">
          <button onClick={() => navigate('/admin/students')} className="flex flex-col items-center justify-center p-4 border rounded-2xl bg-cyan-50 border-cyan-100 hover:bg-cyan-100/40 text-cyan-600 transition-all active:scale-95 text-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
            <span className="font-bold text-xs text-slate-700">Add Student</span>
          </button>
          
          <button onClick={() => navigate('/admin/teachers')} className="flex flex-col items-center justify-center p-4 border rounded-2xl bg-emerald-50 border-emerald-100 hover:bg-emerald-100/40 text-emerald-600 transition-all active:scale-95 text-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            <span className="font-bold text-xs text-slate-700">Add Teacher</span>
          </button>

          <button onClick={() => navigate('/admin/class-fees')} className="flex flex-col items-center justify-center p-4 border rounded-2xl bg-yellow-50 border-yellow-200 hover:bg-yellow-100/60 text-yellow-700 transition-all active:scale-95 text-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
            <span className="font-bold text-xs text-slate-700">Add Class</span>
          </button>

          <button onClick={() => navigate('/admin/attendance')} className="flex flex-col items-center justify-center p-4 border rounded-2xl bg-amber-50 border-amber-100 hover:bg-amber-100/40 text-amber-600 transition-all active:scale-95 text-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            <span className="font-bold text-xs text-slate-700">Take Attendance</span>
          </button>

          <button onClick={() => navigate('/admin/fees')} className="flex flex-col items-center justify-center p-4 border rounded-2xl bg-blue-50 border-blue-100 hover:bg-blue-100/40 text-blue-600 transition-all active:scale-95 text-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            <span className="font-bold text-xs text-slate-700">Fee Receipt</span>
          </button>

          <button onClick={() => navigate('/admin/marks')} className="flex flex-col items-center justify-center p-4 border rounded-2xl bg-rose-50 border-rose-100 hover:bg-rose-100/40 text-rose-600 transition-all active:scale-95 text-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
            <span className="font-bold text-xs text-slate-700">Exam Schedule</span>
          </button>

          <button onClick={() => navigate('/admin/promotion')} className="flex flex-col items-center justify-center p-4 border rounded-2xl bg-indigo-50 border-indigo-100 hover:bg-indigo-100/40 text-indigo-600 transition-all active:scale-95 text-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            <span className="font-bold text-xs text-slate-700">Generate Report</span>
          </button>
        </div>
      </div>

    </div>
  );
}
