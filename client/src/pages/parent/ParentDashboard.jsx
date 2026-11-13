import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  DAYS,
  DEFAULT_SCHEDULE_CONFIG,
  getScheduleForDay,
  calculateDayTimeline,
} from '../../utils/timetableHelper';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const formatTime12 = (time24) => {
  if (!time24) return '';
  const [hStr, mStr] = String(time24).split(':');
  const h = parseInt(hStr, 10);
  if (Number.isNaN(h)) return time24;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr || '00'} ${period}`;
};

const getGreeting = () => {
  const hr = new Date().getHours();
  if (hr < 12) return 'Good Morning';
  if (hr < 17) return 'Good Afternoon';
  return 'Good Evening';
};

export default function ParentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const student = user?.linkedStudent;
  const studentId = student?.id || user?.linked_student_id;

  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState({ records: [], stats: null });
  const [fees, setFees] = useState([]);
  const [results, setResults] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [events, setEvents] = useState([]);
  const [examData, setExamData] = useState({ datesheets: [], upcomingEntries: [] });
  const [timetableSlots, setTimetableSlots] = useState([]);
  const [scheduleConfig, setScheduleConfig] = useState(DEFAULT_SCHEDULE_CONFIG);
  const [achData, setAchData] = useState({ metrics: null, achievements: [] });

  useEffect(() => {
    let active = true;

    const loadAll = async () => {
      setLoading(true);
      const ttParams = {};
      if (student?.class) ttParams.class = student.class;
      if (student?.section) ttParams.section = student.section;

      const requests = [
        API.get('/events'),
        API.get('/datesheets/student'),
        API.get('/notifications'),
        API.get('/timetable', { params: ttParams }),
        API.get('/timetable/config', { params: ttParams }),
        studentId ? API.get(`/attendance/student/${studentId}`) : Promise.resolve({ data: { records: [], stats: null } }),
        studentId ? API.get(`/results/student/${studentId}`) : Promise.resolve({ data: [] }),
        studentId ? API.get(`/fees/student/${studentId}`) : Promise.resolve({ data: [] }),
        studentId ? API.get(`/achievements/student/${studentId}`) : Promise.resolve({ data: { metrics: null, achievements: [] } }),
      ];

      const settled = await Promise.allSettled(requests);
      if (!active) return;

      const val = (idx, fallback) => (settled[idx]?.status === 'fulfilled' ? settled[idx].value?.data ?? fallback : fallback);

      setEvents(Array.isArray(val(0, [])) ? val(0, []) : []);
      setExamData(val(1, { datesheets: [], upcomingEntries: [] }) || { datesheets: [], upcomingEntries: [] });
      setNotifications(Array.isArray(val(2, [])) ? val(2, []) : []);
      setTimetableSlots(Array.isArray(val(3, [])) ? val(3, []) : []);
      if (val(4, null)) {
        setScheduleConfig({ ...DEFAULT_SCHEDULE_CONFIG, ...val(4, {}) });
      }
      setAttendance(val(5, { records: [], stats: null }) || { records: [], stats: null });
      setResults(Array.isArray(val(6, [])) ? val(6, []) : []);
      setFees(Array.isArray(val(7, [])) ? val(7, []) : []);
      setAchData(val(8, { metrics: null, achievements: [] }) || { metrics: null, achievements: [] });

      setLoading(false);
    };

    loadAll();
    return () => { active = false; };
  }, [studentId, student?.class, student?.section]);

  // Derived Attendance (preferring backend stats which already exclude holidays & include late)
  const attendanceStats = useMemo(() => {
    if (attendance?.stats) return attendance.stats;
    const records = attendance?.records || [];
    const working = records.filter((r) => r.status !== 'holiday');
    const present = working.filter((r) => r.status === 'present').length;
    const late = working.filter((r) => r.status === 'late').length;
    const total = working.length;
    return {
      present,
      late,
      absent: Math.max(0, total - present - late),
      total,
      percentage: total > 0 ? Math.round(((present + late) / total) * 100) : 0,
    };
  }, [attendance]);

  // Current month calendar cells (accurate date matching)
  const calendarInfo = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const todayDate = now.getDate();
    const firstDayWeekday = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}-`;

    const statusByDate = {};
    (attendance?.records || []).forEach((rec) => {
      if (String(rec.date || '').startsWith(monthPrefix)) {
        statusByDate[rec.date] = rec.status;
      }
    });

    const cells = [];
    for (let i = 0; i < firstDayWeekday; i += 1) {
      cells.push({ empty: true, key: `empty-${i}` });
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateStr = `${monthPrefix}${String(day).padStart(2, '0')}`;
      const isSunday = new Date(year, month, day).getDay() === 0;
      const status = statusByDate[dateStr] || (isSunday ? 'sunday' : 'unmarked');
      cells.push({
        empty: false,
        day,
        dateStr,
        status,
        isToday: day === todayDate,
        key: dateStr,
      });
    }

    return {
      monthLabel: `${MONTH_NAMES[month]} ${year}`,
      cells,
    };
  }, [attendance]);

  // Today's Timetable Timeline
  const todayScheduleInfo = useMemo(() => {
    const idx = new Date().getDay(); // 0=Sun .. 6=Sat
    const dayName = idx >= 1 && idx <= 6 ? DAYS[idx - 1] : 'Monday';
    const isSunday = idx === 0;
    const dayCfg = getScheduleForDay(dayName, scheduleConfig);
    const { timeline } = calculateDayTimeline(dayCfg, scheduleConfig.schoolEndTime);

    const slotByPeriod = {};
    timetableSlots
      .filter((s) => s.day === dayName)
      .forEach((s) => {
        slotByPeriod[s.period_number] = s;
      });

    const rows = timeline.map((item) => {
      if (item.isBreak) {
        return { ...item, slot: null };
      }
      return { ...item, slot: slotByPeriod[item.num] || null };
    });

    return { dayName, isSunday, rows };
  }, [timetableSlots, scheduleConfig]);

  // Latest Result & Fee summary
  const latestResult = results[0] || null;
  const pendingFees = useMemo(
    () => fees.filter((f) => ['unpaid', 'partial', 'overdue'].includes(f.status)),
    [fees]
  );
  const totalDue = useMemo(
    () =>
      pendingFees.reduce(
        (sum, f) =>
          sum + Math.max(0, Number(f.total_amount ?? f.amount ?? 0) + Number(f.late_fee_amount || 0) - Number(f.paid_amount || 0)),
        0
      ),
    [pendingFees]
  );

  // Unified Real Achievements Preview List (Academic + Attendance + Competitions)
  const achievementHighlights = useMemo(() => {
    const items = [];
    const metrics = achData?.metrics;
    const competitions = achData?.achievements || [];

    if (metrics?.bestRank) {
      items.push({
        id: 'metric-rank',
        title: `${metrics.bestRank.rankLabel} Rank in ${metrics.bestRank.exam_name}`,
        subtitle: `Scored ${metrics.bestRank.percentage}% (Out of ${metrics.bestRank.totalStudents} students in class)`,
        badge: `#${metrics.bestRank.rank} Rank`,
        tone: 'bg-purple-50 text-purple-700 border-purple-200',
      });
    }

    if (metrics?.topSubjects?.[0]) {
      const top = metrics.topSubjects[0];
      items.push({
        id: 'metric-top-subj',
        title: `Highest Marks in ${top.subject}: ${top.marks_obtained}/${top.max_marks} (${top.percentage}%)`,
        subtitle: `${top.exam_name}${top.isClassHighest ? ' · Highest in Class!' : ''}`,
        badge: `${top.percentage}%`,
        tone: 'bg-blue-50 text-blue-700 border-blue-200',
      });
    }

    if (metrics?.attendance?.perfectMonths?.length > 0) {
      const pm = metrics.attendance.perfectMonths[0];
      items.push({
        id: 'metric-perfect-att',
        title: `100% Attendance in ${pm.label}`,
        subtitle: `Attended all ${pm.workingDays} working school days`,
        badge: '100%',
        tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      });
    } else if (metrics?.attendance?.bestMonth) {
      const bm = metrics.attendance.bestMonth;
      items.push({
        id: 'metric-best-att',
        title: `Best Monthly Attendance: ${bm.percentage}% in ${bm.label}`,
        subtitle: `${bm.attendedDays}/${bm.workingDays} working days present`,
        badge: `${bm.percentage}%`,
        tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      });
    }

    competitions.slice(0, 4).forEach((c) => {
      items.push({
        id: `comp-${c.id}`,
        title: `${c.position} — ${c.title}`,
        subtitle: [c.category, c.level, c.event_date].filter(Boolean).join(' · '),
        badge: c.category,
        tone: 'bg-amber-50 text-amber-800 border-amber-200',
      });
    });

    return items;
  }, [achData]);

  const upcomingExams = examData?.upcomingEntries || [];

  if (loading) return <LoadingSpinner />;

  const displayName = student
    ? `${student.first_name} ${student.last_name || ''}`.trim()
    : user?.name || 'Student';

  const quickLinks = [
    { label: 'Weekly & Daywise Timetable', to: '/parent/timetable', color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' },
    { label: 'Declared Exam Datesheet', to: '/parent/exams', color: 'bg-rose-50 text-rose-700 hover:bg-rose-100' },
    { label: 'Upcoming School Events', to: '/parent/events', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
    { label: 'Achievements & Ranks', to: '/parent/achievements', color: 'bg-amber-50 text-amber-800 hover:bg-amber-100' },
    { label: 'View Report Cards', to: '/parent/report-card', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
    { label: 'Fee Details & Receipts', to: '/parent/fees', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-7 text-white shadow-lg shadow-indigo-500/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-100">
            {getGreeting()}, {displayName}
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Student Academic Dashboard
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-3 text-xs font-semibold text-indigo-50">
            {student?.class && (
              <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm">
                Class: {student.class} {student.section ? `— Sec ${student.section}` : ''}
              </span>
            )}
            {student?.roll_number && (
              <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm">
                Roll No: {student.roll_number}
              </span>
            )}
            {student?.student_id && (
              <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm">
                ID: {student.student_id}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/parent/timetable')}
            className="px-4 py-2.5 rounded-xl bg-white text-indigo-700 text-xs font-extrabold hover:bg-indigo-50 transition-all shadow-sm"
          >
            View Full Timetable
          </button>
          <button
            type="button"
            onClick={() => navigate('/parent/exams')}
            className="px-4 py-2.5 rounded-xl bg-indigo-500/40 hover:bg-indigo-500/60 border border-white/25 text-white text-xs font-bold transition-all"
          >
            Exam Datesheet
          </button>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => navigate('/parent/attendance')}
          className="cursor-pointer bg-white rounded-2xl border border-slate-100 shadow-card p-5 hover:border-emerald-200 transition-all"
        >
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attendance Rate</p>
          <p className="text-2xl font-extrabold text-slate-800 mt-1.5">{attendanceStats.percentage}%</p>
          <p className="text-xs text-slate-500 mt-1">
            {attendanceStats.present + attendanceStats.late} present / {attendanceStats.total} working days
          </p>
        </div>

        <div
          onClick={() => navigate('/parent/report-card')}
          className="cursor-pointer bg-white rounded-2xl border border-slate-100 shadow-card p-5 hover:border-purple-200 transition-all"
        >
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Latest Result</p>
          <p className="text-2xl font-extrabold text-slate-800 mt-1.5">
            {latestResult ? `${latestResult.percentage}%` : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-1 truncate">
            {latestResult
              ? `${latestResult.exam_name}${achData?.metrics?.bestRank ? ` · Rank #${achData.metrics.bestRank.rank}` : ` · Grade ${latestResult.grade}`}`
              : 'No published results yet'}
          </p>
        </div>

        <div
          onClick={() => navigate('/parent/exams')}
          className="cursor-pointer bg-white rounded-2xl border border-slate-100 shadow-card p-5 hover:border-rose-200 transition-all"
        >
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Upcoming Exams</p>
          <p className="text-2xl font-extrabold text-slate-800 mt-1.5">{upcomingExams.length}</p>
          <p className="text-xs text-slate-500 mt-1 truncate">
            {upcomingExams[0]
              ? `Next: ${upcomingExams[0].subject} (${upcomingExams[0].exam_date})`
              : 'No declared exam upcoming'}
          </p>
        </div>

        <div
          onClick={() => navigate('/parent/fees')}
          className="cursor-pointer bg-white rounded-2xl border border-slate-100 shadow-card p-5 hover:border-amber-200 transition-all"
        >
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Fee Dues</p>
          <p className="text-2xl font-extrabold text-slate-800 mt-1.5">₹{totalDue.toLocaleString('en-IN')}</p>
          <p className="text-xs text-slate-500 mt-1">
            {pendingFees.length > 0 ? `${pendingFees.length} pending installment(s)` : 'All fees up to date'}
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Today's Class Schedule */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-800">
                  {todayScheduleInfo.isSunday ? 'Monday Schedule Preview' : `${todayScheduleInfo.dayName} Schedule`}
                </h2>
                <p className="text-xs text-slate-400">
                  Published class periods for {student ? `${student.class} ${student.section || ''}` : 'your class'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/parent/timetable')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-all"
              >
                Full Timetable →
              </button>
            </div>

            {timetableSlots.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-50/70 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                No timetable has been published for your class yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {todayScheduleInfo.rows.map((row, i) => {
                  if (row.isBreak) {
                    return (
                      <div
                        key={row.id || `brk-${i}`}
                        className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/70 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-extrabold text-amber-900">{row.name || 'Break'}</p>
                          <p className="text-[11px] text-amber-700">{row.duration} mins recess</p>
                        </div>
                        <span className="text-[11px] font-bold text-amber-800">{row.time}</span>
                      </div>
                    );
                  }
                  return (
                    <div
                      key={`today-p-${row.num}`}
                      className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase text-slate-400">Period {row.num}</p>
                        <p className="text-sm font-extrabold text-slate-800 truncate">
                          {row.slot?.subject || 'Free Period'}
                        </p>
                        {row.slot?.teacher?.name && (
                          <p className="text-[11px] text-slate-500 truncate">{row.slot.teacher.name}</p>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-indigo-600 bg-white px-2.5 py-1 rounded-xl border border-slate-200/80 whitespace-nowrap">
                        {row.time}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming Exams (Declared Datesheets) */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-800">Upcoming Exams</h2>
                <p className="text-xs text-slate-400">Official declared examination datesheet for your class</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/parent/exams')}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 transition-all"
              >
                Full Datesheet →
              </button>
            </div>

            {upcomingExams.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-50/70 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                No upcoming exams currently declared for your class.
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingExams.slice(0, 5).map((ex) => (
                  <div
                    key={ex.id}
                    className="p-3.5 rounded-2xl bg-rose-50/40 border border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-extrabold text-slate-800">{ex.subject}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                          {ex.exam_name}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {ex.room ? `Room: ${ex.room}` : 'Room: TBA'}
                        {ex.syllabus_notes ? ` · Syllabus: ${ex.syllabus_notes}` : ''}
                      </p>
                    </div>
                    <div className="sm:text-right shrink-0">
                      <p className="text-xs font-extrabold text-slate-800">
                        {new Date(`${ex.exam_date}T00:00:00`).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short',
                        })}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-500">
                        {formatTime12(ex.start_time)} – {formatTime12(ex.end_time)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Achievements & Recognition (100% Real Data) */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-800">Achievements &amp; Recognition</h2>
                <p className="text-xs text-slate-400">
                  Real exam ranks, top subject marks, attendance awards &amp; Class Incharge competition prizes
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/parent/achievements')}
                className="text-xs font-bold text-amber-700 hover:text-amber-800 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 transition-all"
              >
                View All →
              </button>
            </div>

            {achievementHighlights.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-50/70 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                No achievements or published exam milestones recorded yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {achievementHighlights.slice(0, 6).map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/50 flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-extrabold text-slate-800 leading-snug">{item.title}</p>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border shrink-0 ${item.tone}`}>
                        {item.badge}
                      </span>
                    </div>
                    {item.subtitle && <p className="text-[11px] text-slate-500">{item.subtitle}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Upcoming School Events (Created by Admin) */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-extrabold text-slate-800">Upcoming Events</h2>
              <button
                type="button"
                onClick={() => navigate('/parent/events')}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                View All
              </button>
            </div>

            {events.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No upcoming school events scheduled.</p>
            ) : (
              <div className="space-y-3">
                {events.slice(0, 4).map((ev) => (
                  <div key={ev.id} className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100">
                    <p className="text-xs font-extrabold text-slate-800">{ev.title}</p>
                    <p className="text-[11px] font-semibold text-blue-700 mt-1">
                      {new Date(ev.event_date).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </p>
                    {ev.location && <p className="text-[11px] text-slate-500 mt-0.5">Location: {ev.location}</p>}
                    {ev.description && (
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{ev.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Attendance Calendar */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-extrabold text-slate-800">{calendarInfo.monthLabel}</h2>
              <button
                type="button"
                onClick={() => navigate('/parent/attendance')}
                className="text-xs font-bold text-emerald-600 hover:underline"
              >
                Full Report
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
              {calendarInfo.cells.map((cell) => {
                if (cell.empty) return <div key={cell.key} />;
                const colorCls =
                  cell.status === 'present'
                    ? 'bg-emerald-500 text-white'
                    : cell.status === 'absent'
                    ? 'bg-rose-500 text-white'
                    : cell.status === 'late'
                    ? 'bg-amber-400 text-white'
                    : cell.status === 'holiday'
                    ? 'bg-sky-100 text-sky-700'
                    : cell.status === 'sunday'
                    ? 'bg-slate-100 text-slate-400'
                    : 'bg-slate-50 text-slate-600 border border-slate-100';

                return (
                  <div
                    key={cell.key}
                    title={`${cell.dateStr}: ${cell.status}`}
                    className={`h-8 rounded-lg flex items-center justify-center font-bold text-[11px] ${colorCls} ${
                      cell.isToday ? 'ring-2 ring-indigo-600 ring-offset-1' : ''
                    }`}
                  >
                    {cell.day}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-3 mt-4 text-[10px] font-semibold text-slate-500">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Present</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" />Absent</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" />Late</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-sky-200" />Holiday</span>
            </div>
          </div>

          {/* Notice Board */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-extrabold text-slate-800">Notice Board</h2>
              <button
                type="button"
                onClick={() => navigate('/parent/notifications')}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                View All
              </button>
            </div>
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No notices available.</p>
            ) : (
              <div className="space-y-3">
                {notifications.slice(0, 4).map((n) => (
                  <div key={n.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-xs font-bold text-slate-800">{n.title}</p>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6">
            <h2 className="text-base font-extrabold text-slate-800 mb-3">Quick Links</h2>
            <div className="grid grid-cols-1 gap-2">
              {quickLinks.map((ql) => (
                <button
                  key={ql.to + ql.label}
                  type="button"
                  onClick={() => navigate(ql.to)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${ql.color}`}
                >
                  <span>{ql.label}</span>
                  <span>→</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
