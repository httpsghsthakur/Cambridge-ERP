import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../hooks/useAttendance';
import API from '../../utils/api';
import { attendanceBg, formatDate } from '../../utils/helpers';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const parseYmdParts = (dateStr) => {
  const [y, m, d] = String(dateStr || '').split('-').map((n) => parseInt(n, 10));
  return { y, m, d };
};

const buildSessionMonthOptions = (sessionObj, fallbackYear) => {
  if (sessionObj?.start_date && sessionObj?.end_date) {
    const start = parseYmdParts(sessionObj.start_date);
    const end   = parseYmdParts(sessionObj.end_date);
    if (start.y && start.m && end.y && end.m) {
      const list = [];
      let curY = start.y;
      let curM = start.m;
      let guard = 0;
      while ((curY < end.y || (curY === end.y && curM <= end.m)) && guard < 24) {
        list.push({
          month: curM,
          year: curY,
          key: `${curY}-${String(curM).padStart(2, '0')}`,
          label: `${MONTHS[curM - 1]} ${curY}`,
        });
        curM += 1;
        if (curM > 12) {
          curM = 1;
          curY += 1;
        }
        guard += 1;
      }
      if (list.length > 0) return list;
    }
  }
  return MONTHS.map((mName, idx) => ({
    month: idx + 1,
    year: fallbackYear,
    key: `${fallbackYear}-${String(idx + 1).padStart(2, '0')}`,
    label: `${mName} ${fallbackYear}`,
  }));
};

export default function MyAttendance() {
  const { user } = useAuth();
  const studentId = user?.linkedStudent?.id;
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());
  const [selectedSessionFilter, setSelectedSessionFilter] = useState('');
  const [logFilter, setLogFilter] = useState('all'); // all | present | absent | late
  const [fullSessionLogs, setFullSessionLogs] = useState([]);
  const [showFullSessionDates, setShowFullSessionDates] = useState(false);

  const {
    records,
    stats,
    sessionStats,
    currentSessionId,
    selectedSessionId,
    sessionComparison,
    sessions,
    loading,
    fetchStudentAttendance,
  } = useAttendance();

  // Fetch month-specific attendance within selected session
  useEffect(() => {
    if (!studentId) return;
    fetchStudentAttendance(studentId, month, year, selectedSessionFilter);
  }, [studentId, month, year, selectedSessionFilter, fetchStudentAttendance]);

  // Fetch full list of dated records for the selected session when viewing entire-session date log
  useEffect(() => {
    if (!studentId || !showFullSessionDates) return;
    const qs = selectedSessionFilter ? `?session_id=${encodeURIComponent(selectedSessionFilter)}` : '';
    API.get(`/attendance/student/${studentId}${qs}`)
      .then((res) => setFullSessionLogs(res.data?.records || []))
      .catch(() => setFullSessionLogs([]));
  }, [studentId, selectedSessionFilter, showFullSessionDates]);

  const effectiveSessionId = selectedSessionFilter || selectedSessionId || currentSessionId;
  const activeSessionObj = useMemo(
    () => sessions.find((s) => String(s.id) === String(effectiveSessionId)) || null,
    [sessions, effectiveSessionId]
  );

  const selectedComp = useMemo(
    () => sessionComparison.find((c) => String(c.session_id) === String(effectiveSessionId)) || null,
    [sessionComparison, effectiveSessionId]
  );

  const monthOptions = useMemo(
    () => buildSessionMonthOptions(activeSessionObj, year),
    [activeSessionObj, year]
  );

  const handleSelectSession = (nextSessId) => {
    setSelectedSessionFilter(String(nextSessId));
    const nextSessObj = sessions.find((s) => String(s.id) === String(nextSessId)) || null;
    if (nextSessObj) {
      const opts = buildSessionMonthOptions(nextSessObj, now.getFullYear());
      const curKey = `${year}-${String(month).padStart(2, '0')}`;
      if (!opts.some((o) => o.key === curKey) && opts.length > 0) {
        const nowKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const matchNow = opts.find((o) => o.key === nowKey);
        const pick = matchNow || opts[0];
        setMonth(pick.month);
        setYear(pick.year);
      }
    }
  };

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay    = new Date(year, month - 1, 1).getDay();
  const recordMap   = {};
  records.forEach((r) => {
    const { d } = parseYmdParts(r.date);
    if (d) recordMap[d] = r.status;
  });

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const displayedLogs = useMemo(() => {
    const src = showFullSessionDates ? fullSessionLogs : records;
    const filtered = logFilter === 'all' ? src : src.filter((r) => r.status === logFilter);
    return [...filtered].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  }, [showFullSessionDates, fullSessionLogs, records, logFilter]);

  const bannerStats = sessionStats || { present: 0, absent: 0, late: 0, total: 0, percentage: 0 };

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header + Session Switcher */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-800">My Attendance &amp; Session History</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track current session attendance from 0% and compare across promoted academic sessions
          </p>
        </div>

        {sessions.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Session:</label>
            <select
              value={effectiveSessionId ? String(effectiveSessionId) : ''}
              onChange={(e) => handleSelectSession(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 bg-white"
            >
              {sessions.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name}
                  {String(s.id) === String(currentSessionId) ? ' (Current)' : s.is_archived ? ' (Saved)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Selected Session Overall Banner */}
      <div className="bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-blue-100">
              {selectedComp?.session_name || activeSessionObj?.name || 'Academic Session'}
              {selectedComp?.class_name ? ` · ${selectedComp.class_name}${selectedComp.section ? `-${selectedComp.section}` : ''}` : ''}
            </span>
          </div>
          {selectedComp?.is_current && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white">
              Active Session
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-4xl font-extrabold">{bannerStats.percentage || 0}%</p>
            <p className="text-xs font-medium text-blue-100 mt-1">
              {bannerStats.total === 0
                ? 'Session started at 0% — no working days marked yet'
                : 'Overall Session Attendance'}
            </p>
          </div>
          <div className="grid grid-cols-4 gap-3 sm:gap-6 text-center bg-white/10 rounded-xl px-4 py-3">
            <div>
              <p className="text-xl font-bold">{bannerStats.present || 0}</p>
              <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest mt-0.5">Present</p>
            </div>
            <div>
              <p className="text-xl font-bold">{bannerStats.late || 0}</p>
              <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest mt-0.5">Late</p>
            </div>
            <div>
              <p className="text-xl font-bold">{bannerStats.absent || 0}</p>
              <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest mt-0.5">Absent</p>
            </div>
            <div>
              <p className="text-xl font-bold">{bannerStats.total || 0}</p>
              <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest mt-0.5">Working Days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Session-Wise & Class-Wise Comparison */}
      {sessionComparison.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Session-Wise &amp; Class-Wise Attendance Comparison</h3>
              <p className="text-xs text-slate-400">Click any session row to inspect its month calendar and exact present/absent dates</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-gray-100 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2.5 px-4">Session</th>
                  <th className="py-2.5 px-4">Class</th>
                  <th className="py-2.5 px-3 text-center">Present</th>
                  <th className="py-2.5 px-3 text-center">Absent</th>
                  <th className="py-2.5 px-3 text-center">Late</th>
                  <th className="py-2.5 px-3 text-center">Working Days</th>
                  <th className="py-2.5 px-4">Attendance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sessionComparison.map((row, idx) => {
                  const isSelected = String(row.session_id) === String(effectiveSessionId);
                  const prev = idx > 0 ? sessionComparison[idx - 1] : null;
                  const delta = prev && row.total > 0 && prev.total > 0
                    ? row.percentage - prev.percentage
                    : null;

                  return (
                    <tr
                      key={`${row.session_id || row.session_name}-${idx}`}
                      onClick={() => row.session_id && handleSelectSession(row.session_id)}
                      className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'}`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">{row.session_name}</span>
                          {row.is_current && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700">
                              Current
                            </span>
                          )}
                          {!row.is_current && (
                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-slate-100 text-slate-600">
                              Saved
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-slate-600">
                        {row.class_name || '—'}{row.section ? ` - ${row.section}` : ''}
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-emerald-600">{row.present}</td>
                      <td className="py-3 px-3 text-center font-semibold text-red-500">{row.absent}</td>
                      <td className="py-3 px-3 text-center font-semibold text-amber-600">{row.late}</td>
                      <td className="py-3 px-3 text-center text-slate-600">{row.total}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5 min-w-[130px]">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                row.total === 0 ? 'bg-slate-300'
                                : row.percentage >= 85 ? 'bg-emerald-500'
                                : row.percentage >= 75 ? 'bg-amber-500'
                                : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(100, row.percentage)}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-800 text-xs w-9 text-right">
                            {row.percentage}%
                          </span>
                          {delta !== null && delta !== 0 && (
                            <span className={`text-[10px] font-bold ${delta > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              {delta > 0 ? `+${delta}%` : `${delta}%`}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Calendar + Present/Absent Date Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Monthly Calendar */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-800">Monthly Calendar</h3>
            <select
              value={`${year}-${String(month).padStart(2, '0')}`}
              onChange={(e) => {
                const [yVal, mVal] = e.target.value.split('-').map(Number);
                setYear(yVal);
                setMonth(mVal);
              }}
              className="border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 bg-white"
            >
              {monthOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>{opt.label}</option>
              ))}
            </select>
          </div>

          {!loading && (
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Present', val: stats.present || 0, color: 'text-emerald-600' },
                { label: 'Absent',  val: stats.absent  || 0, color: 'text-red-500' },
                { label: 'Late',    val: stats.late    || 0, color: 'text-amber-600' },
                {
                  label: 'Month %',
                  val: `${stats.percentage || 0}%`,
                  color: (stats.percentage || 0) >= 85 ? 'text-emerald-600'
                       : (stats.percentage || 0) >= 75 ? 'text-amber-600'
                       : 'text-red-500',
                },
              ].map((s) => (
                <div key={s.label} className="bg-slate-50 rounded-xl border border-slate-100 p-2.5 text-center">
                  <p className="text-[10px] text-slate-400 font-medium">{s.label}</p>
                  <p className={`text-sm sm:text-base font-bold mt-0.5 ${s.color}`}>{s.val}</p>
                </div>
              ))}
            </div>
          )}

          {loading ? <LoadingSpinner /> : (
            <div>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {dayLabels.map((d, i) => (
                  <div key={i} className="text-[11px] font-semibold text-gray-400 text-center py-1">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                  const status = recordMap[day];
                  const isToday = day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear();
                  return (
                    <div
                      key={day}
                      className={`aspect-square flex flex-col items-center justify-center rounded-lg text-[11px] sm:text-xs font-medium
                        ${status ? attendanceBg[status] : 'bg-gray-50 text-gray-300'}
                        ${isToday ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}
                    >
                      <span>{day}</span>
                      {status && (
                        <span className="text-[8px] sm:text-[9px] mt-0.5 uppercase">
                          {status[0]}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-3 mt-4">
                {[['present', 'Present'], ['absent', 'Absent'], ['late', 'Late'], ['holiday', 'Holiday']].map(([s, l]) => (
                  <span key={s} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className={`w-3 h-3 rounded-sm ${attendanceBg[s].split(' ')[0]}`} />
                    {l}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Date-Wise Present / Absent History */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Present &amp; Absent Dates</h3>
              <p className="text-xs text-slate-400">
                {showFullSessionDates
                  ? `All recorded dates in ${selectedComp?.session_name || activeSessionObj?.name || 'session'}`
                  : `${MONTHS[month - 1]} ${year}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowFullSessionDates((v) => !v)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg"
            >
              {showFullSessionDates ? 'This Month Only' : 'View Entire Session'}
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: 'All' },
              { id: 'present', label: 'Present' },
              { id: 'absent', label: 'Absent' },
              { id: 'late', label: 'Late' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setLogFilter(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  logFilter === tab.id
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100 border border-gray-100 rounded-xl">
            {displayedLogs.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-10">
                No {logFilter === 'all' ? '' : `${logFilter} `}attendance dates recorded for this selection.
              </p>
            ) : (
              displayedLogs.map((rec) => (
                <div key={rec.id || rec.date} className="flex items-center justify-between px-3.5 py-2.5 text-xs">
                  <div>
                    <p className="font-semibold text-slate-800">{formatDate(rec.date)}</p>
                    <p className="text-[11px] text-slate-400">
                      {new Date(`${rec.date}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'long' })}
                      {rec.class ? ` · ${rec.class}${rec.section ? `-${rec.section}` : ''}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {rec.is_finalized && (
                      <span className="text-[10px] text-slate-400 font-medium">Locked</span>
                    )}
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${attendanceBg[rec.status] || 'bg-slate-100 text-slate-600'}`}>
                      {rec.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
