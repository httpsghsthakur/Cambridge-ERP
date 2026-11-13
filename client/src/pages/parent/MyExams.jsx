import { useState, useEffect } from 'react';
import API from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const EXAM_TYPE_LABELS = {
  unit_test: 'Unit Test',
  half_yearly: 'Half Yearly',
  annual: 'Annual Exam',
  assessment: 'Assessment',
  pre_board: 'Pre-Board',
  other: 'Examination',
};

const formatTime12 = (time24) => {
  if (!time24) return '';
  const [hStr, mStr] = String(time24).split(':');
  const h = parseInt(hStr, 10);
  if (Number.isNaN(h)) return time24;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr || '00'} ${period}`;
};

const formatDateLong = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getDayDeltaBadge = (dateStr) => {
  if (!dateStr) return null;
  const todayStr = new Date().toISOString().slice(0, 10);
  const diffDays = Math.round(
    (new Date(`${dateStr}T00:00:00`) - new Date(`${todayStr}T00:00:00`)) / (1000 * 60 * 60 * 24)
  );
  if (diffDays < 0) return { label: 'Completed', cls: 'bg-slate-100 text-slate-500 border-slate-200' };
  if (diffDays === 0) return { label: 'Today', cls: 'bg-rose-50 text-rose-700 border-rose-200' };
  if (diffDays === 1) return { label: 'Tomorrow', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
  return { label: `In ${diffDays} days`, cls: 'bg-blue-50 text-blue-700 border-blue-200' };
};

export default function MyExams() {
  const { user } = useAuth();
  const student = user?.linkedStudent;

  const [datesheets, setDatesheets] = useState([]);
  const [upcomingEntries, setUpcomingEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    API.get('/datesheets/student')
      .then((res) => {
        if (!active) return;
        setDatesheets(Array.isArray(res.data?.datesheets) ? res.data.datesheets : []);
        setUpcomingEntries(Array.isArray(res.data?.upcomingEntries) ? res.data.upcomingEntries : []);
      })
      .catch(() => {
        if (active) toast.error('Failed to load exam datesheets.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  if (loading) return <LoadingSpinner />;

  const classLabel = student
    ? `${student.class}${student.section ? ` — Section ${student.section}` : ''}`
    : 'Your Class';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
            Examination Schedule
          </span>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight mt-2">
            Declared Exam Datesheets
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Official examination datesheets approved and declared for {classLabel}.
          </p>
        </div>

        <div className="flex items-center gap-3 print:hidden">
          <div className="px-4 py-2 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
            <p className="text-[10px] font-bold uppercase text-slate-400">Upcoming Papers</p>
            <p className="text-lg font-extrabold text-slate-800">{upcomingEntries.length}</p>
          </div>
          {datesheets.length > 0 && (
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white transition-all shadow-sm"
            >
              Print Datesheet
            </button>
          )}
        </div>
      </div>

      {datesheets.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-12 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-slate-800">No Declared Exam Datesheets Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Once your Class Incharge prepares and the Admin approves &amp; declares an examination datesheet, the full schedule will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {datesheets.map((ds) => (
            <div key={ds.id} className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gradient-to-r from-slate-50/70 to-white">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {EXAM_TYPE_LABELS[ds.exam_type] || 'Exam'}
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Declared
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {ds.class} — Section {ds.section}
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-800 mt-2">{ds.exam_name}</h2>
                  {ds.declared_at && (
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                      Declared on {new Date(ds.declared_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>
                {ds.createdByTeacher?.name && (
                  <div className="text-xs text-slate-500 font-medium bg-white px-3.5 py-2 rounded-xl border border-slate-200/80">
                    Prepared by <span className="font-bold text-slate-700">{ds.createdByTeacher.name}</span>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3.5 px-5">Date &amp; Day</th>
                      <th className="py-3.5 px-5">Subject</th>
                      <th className="py-3.5 px-5">Timing</th>
                      <th className="py-3.5 px-5">Room / Hall</th>
                      <th className="py-3.5 px-5">Syllabus / Notes</th>
                      <th className="py-3.5 px-5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {(ds.entries || []).map((entry) => {
                      const badge = getDayDeltaBadge(entry.exam_date);
                      return (
                        <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-5 font-bold text-slate-800 whitespace-nowrap">
                            {formatDateLong(entry.exam_date)}
                          </td>
                          <td className="py-3.5 px-5 font-extrabold text-indigo-700">{entry.subject}</td>
                          <td className="py-3.5 px-5 text-xs font-semibold text-slate-600 whitespace-nowrap">
                            {formatTime12(entry.start_time)} – {formatTime12(entry.end_time)}
                          </td>
                          <td className="py-3.5 px-5 text-xs font-medium text-slate-500">
                            {entry.room || 'TBA'}
                          </td>
                          <td className="py-3.5 px-5 text-xs text-slate-500 max-w-xs">
                            {entry.syllabus_notes || '—'}
                          </td>
                          <td className="py-3.5 px-5 text-right whitespace-nowrap">
                            {badge && (
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${badge.cls}`}>
                                {badge.label}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {ds.instructions && (
                <div className="px-6 py-4 bg-amber-50/60 border-t border-amber-100 text-xs text-amber-900">
                  <span className="font-bold uppercase tracking-wider text-[10px] text-amber-700 mr-2">
                    Instructions:
                  </span>
                  {ds.instructions}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

