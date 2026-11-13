import { useState, useEffect, useMemo } from 'react';
import API from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  DAYS,
  DEFAULT_SCHEDULE_CONFIG,
  getScheduleForDay,
  calculateDayTimeline,
  getUnifiedColumns,
} from '../../utils/timetableHelper';
import toast from 'react-hot-toast';

const SUBJECT_PALETTES = [
  'bg-blue-50 text-blue-700 border-blue-200',
  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'bg-purple-50 text-purple-700 border-purple-200',
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-rose-50 text-rose-700 border-rose-200',
  'bg-indigo-50 text-indigo-700 border-indigo-200',
  'bg-cyan-50 text-cyan-700 border-cyan-200',
];

const getSubjectPalette = (subject) => {
  if (!subject) return 'bg-slate-50 text-slate-500 border-slate-200';
  let hash = 0;
  for (let i = 0; i < subject.length; i += 1) {
    hash = subject.charCodeAt(i) + ((hash << 5) - hash);
  }
  return SUBJECT_PALETTES[Math.abs(hash) % SUBJECT_PALETTES.length];
};

export default function MyTimetable() {
  const { user } = useAuth();
  const student = user?.linkedStudent;

  const todayName = useMemo(() => {
    const idx = new Date().getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
    return idx >= 1 && idx <= 6 ? DAYS[idx - 1] : 'Monday';
  }, []);

  const [slots, setSlots] = useState([]);
  const [scheduleConfig, setScheduleConfig] = useState(DEFAULT_SCHEDULE_CONFIG);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('daywise'); // 'daywise' | 'weekly'
  const [selectedDay, setSelectedDay] = useState(todayName);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const params = {};
        if (student?.class) params.class = student.class;
        if (student?.section) params.section = student.section;

        const [ttRes, cfgRes] = await Promise.all([
          API.get('/timetable', { params }),
          API.get('/timetable/config', { params }).catch(() => ({ data: null })),
        ]);

        if (!active) return;
        setSlots(Array.isArray(ttRes.data) ? ttRes.data : []);
        if (cfgRes?.data) {
          setScheduleConfig({ ...DEFAULT_SCHEDULE_CONFIG, ...cfgRes.data });
        }
      } catch (err) {
        if (active) toast.error('Failed to load timetable.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();
    return () => { active = false; };
  }, [student?.class, student?.section]);

  const slotMap = useMemo(() => {
    const map = {};
    slots.forEach((s) => {
      map[`${s.day}::${s.period_number}`] = s;
    });
    return map;
  }, [slots]);

  const dayTimeline = useMemo(() => {
    const dayCfg = getScheduleForDay(selectedDay, scheduleConfig);
    return calculateDayTimeline(dayCfg, scheduleConfig.schoolEndTime);
  }, [selectedDay, scheduleConfig]);

  const weeklyColumns = useMemo(() => getUnifiedColumns(scheduleConfig), [scheduleConfig]);

  if (loading) return <LoadingSpinner />;

  const classLabel = student
    ? `${student.class}${student.section ? ` — Section ${student.section}` : ''}`
    : 'Your Class';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
            Class Timetable
          </span>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight mt-2">
            {classLabel} Schedule
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            School Hours: {dayTimeline.startTimeFormatted} – {dayTimeline.endTimeFormatted} · Published Weekly & Daywise Timetable
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 print:hidden">
          <div className="inline-flex bg-slate-100 p-1 rounded-2xl border border-slate-200/70">
            <button
              type="button"
              onClick={() => setViewMode('daywise')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'daywise'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Daywise View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('weekly')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'weekly'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Weekly Schedule
            </button>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white transition-all shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
        </div>
      </div>

      {slots.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-12 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-slate-800">Timetable Not Published Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Your Class Incharge or School Admin hasn&apos;t published the class timetable for {classLabel} yet. Check back soon.
          </p>
        </div>
      ) : viewMode === 'daywise' ? (
        <div className="space-y-5">
          {/* Day selector pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 print:hidden">
            {DAYS.map((day) => {
              const daySlotsCount = slots.filter((s) => s.day === day).length;
              const isSelected = selectedDay === day;
              const isToday = day === todayName;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/40'
                  }`}
                >
                  <span>{day}</span>
                  {isToday && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      Today
                    </span>
                  )}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isSelected ? 'bg-indigo-500 text-indigo-50' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {daySlotsCount}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selected Day Vertical Timeline */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-extrabold text-slate-800">{selectedDay} Timetable</h2>
                <p className="text-xs text-slate-400 font-medium">
                  {dayTimeline.startTimeFormatted} – {dayTimeline.endTimeFormatted}
                </p>
              </div>
              {selectedDay === todayName && (
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Today&apos;s Schedule
                </span>
              )}
            </div>

            <div className="space-y-3">
              {dayTimeline.timeline.map((item, idx) => {
                if (item.isBreak) {
                  return (
                    <div
                      key={item.id || `break-${idx}`}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 py-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/70"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-extrabold">
                          BRK
                        </span>
                        <div>
                          <p className="text-sm font-bold text-amber-900">{item.name || 'Break'}</p>
                          <p className="text-[11px] font-medium text-amber-700">{item.duration} mins recess</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-amber-800 bg-white/80 px-3 py-1.5 rounded-xl border border-amber-200/80 w-fit">
                        {item.time}
                      </span>
                    </div>
                  );
                }

                const slot = slotMap[`${selectedDay}::${item.num}`];
                const badgeClass = getSubjectPalette(slot?.subject);

                return (
                  <div
                    key={`p-${item.num}`}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border transition-all ${
                      slot
                        ? 'bg-white border-slate-200/80 hover:border-indigo-200 shadow-sm'
                        : 'bg-slate-50/60 border-dashed border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold uppercase text-slate-400 leading-none">Per</span>
                        <span className="text-base font-extrabold leading-tight">{item.num}</span>
                      </div>
                      <div>
                        {slot ? (
                          <>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-sm font-extrabold px-2.5 py-0.5 rounded-lg border ${badgeClass}`}>
                                {slot.subject}
                              </span>
                              {slot.room && (
                                <span className="text-[11px] font-semibold text-slate-400">Room {slot.room}</span>
                              )}
                            </div>
                            <p className="text-xs font-medium text-slate-500 mt-1">
                              Teacher: <span className="text-slate-700 font-semibold">{slot.teacher?.name || 'TBA'}</span>
                            </p>
                          </>
                        ) : (
                          <p className="text-xs font-semibold text-slate-400 italic">No class scheduled / Free period</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:text-right">
                      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                        {item.time}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Weekly Full Grid View */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold text-slate-800">Weekly Class Schedule</h2>
            <span className="text-xs font-semibold text-slate-400">{classLabel}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-3 text-xs font-extrabold text-slate-600 uppercase tracking-wider rounded-tl-xl w-28">
                    Day
                  </th>
                  {weeklyColumns.map((col, idx) => (
                    <th
                      key={col.isBreak ? `bcol-${idx}` : `pcol-${col.num}`}
                      className={`p-3 text-center border-l border-slate-200/70 ${
                        col.isBreak ? 'bg-amber-50/70 text-amber-800 min-w-[90px]' : 'text-slate-700 min-w-[120px]'
                      }`}
                    >
                      <div className="text-xs font-extrabold uppercase tracking-wide">
                        {col.isBreak ? (col.name || 'Break') : `Period ${col.num}`}
                      </div>
                      <div className="text-[10px] font-medium text-slate-400 mt-0.5">{col.time}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {DAYS.map((day) => {
                  const isToday = day === todayName;
                  return (
                    <tr key={day} className={isToday ? 'bg-indigo-50/30' : 'hover:bg-slate-50/60'}>
                      <td className="p-3 font-extrabold text-xs text-slate-800 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{day}</span>
                          {isToday && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-600 text-white font-bold">
                              TODAY
                            </span>
                          )}
                        </div>
                      </td>
                      {weeklyColumns.map((col, idx) => {
                        if (col.isBreak) {
                          return (
                            <td
                              key={`${day}-b-${idx}`}
                              className="p-2 text-center border-l border-slate-100 bg-amber-50/40"
                            >
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                                {col.name || 'Break'}
                              </span>
                            </td>
                          );
                        }
                        const slot = slotMap[`${day}::${col.num}`];
                        return (
                          <td key={`${day}-p-${col.num}`} className="p-2 border-l border-slate-100 align-top">
                            {slot ? (
                              <div className={`p-2 rounded-xl border text-center ${getSubjectPalette(slot.subject)}`}>
                                <p className="text-xs font-extrabold leading-snug">{slot.subject}</p>
                                <p className="text-[10px] font-medium opacity-80 mt-0.5 truncate">
                                  {slot.teacher?.name || 'TBA'}
                                </p>
                              </div>
                            ) : (
                              <div className="p-2 text-center text-[11px] text-slate-300">—</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

