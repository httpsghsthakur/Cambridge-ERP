import { useState, useEffect, useMemo } from 'react';
import API from '../../utils/api';
import toast from 'react-hot-toast';

const PROMOTION_MAP = {
  'day care':  'Playgroup',
  'Playgroup': 'Nursery',
  'Nursery':   'LKG',
  'LKG':       'UKG',
  'UKG':       '1st',
  '1st':       '2nd',
  '2nd':       '3rd',
  '3rd':       '4th',
  '4th':       '5th',
  '5th':       '6th',
  '6th':       '7th',
  '7th':       '8th',
  '8th':       '9th',
  '9th':       '10th',
  '10th':      'Graduated (Alumni)',
};

const formatDateShort = (val) => {
  if (!val) return '';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return val;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const classifySession = (session, activeSession) => {
  if (session.is_active) return 'Active';
  if (session.is_archived) return 'Archived';
  if (session.status_label === 'Previous' || session.promotion_completed) return 'Previous';
  if (
    activeSession?.start_date &&
    session.start_date &&
    new Date(session.start_date) < new Date(activeSession.start_date)
  ) {
    return 'Previous';
  }
  return session.status_label || 'Upcoming';
};

export default function Promotion() {
  const [sessions, setSessions]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [newSession, setNewSession]       = useState('');
  const [newStartDate, setNewStartDate]   = useState('');
  const [newEndDate, setNewEndDate]       = useState('');
  const [creating, setCreating]           = useState(false);
  const [promoting, setPromoting]         = useState(false);
  const [fromSessionId, setFromSessionId] = useState('');
  const [toSessionId, setToSessionId]     = useState('');
  const [activateTarget, setActivateTarget] = useState(true);
  const [summaryModal, setSummaryModal]   = useState(null);
  const [promotionHistory, setPromotionHistory] = useState([]);
  const [historySearch, setHistorySearch]       = useState('');

  const loadPromotionHistory = () => {
    API.get('/session/promotion-history')
      .then(r => setPromotionHistory(Array.isArray(r.data?.history) ? r.data.history : []))
      .catch(() => setPromotionHistory([]));
  };

  const loadSessions = () => {
    setLoading(true);
    API.get('/session')
      .then(r => setSessions(Array.isArray(r.data) ? r.data : []))
      .catch(() => toast.error('Failed to load academic sessions.'))
      .finally(() => setLoading(false));
    loadPromotionHistory();
  };

  useEffect(() => { loadSessions(); }, []);

  const activeSession = useMemo(
    () => sessions.find(s => s.is_active) || null,
    [sessions]
  );

  const enrichedSessions = useMemo(
    () => sessions.map(s => ({ ...s, computedStatus: classifySession(s, activeSession) })),
    [sessions, activeSession]
  );

  const upcomingSessions = useMemo(
    () =>
      enrichedSessions
        .filter(s => s.computedStatus === 'Upcoming')
        .sort((a, b) => new Date(a.start_date || 0) - new Date(b.start_date || 0)),
    [enrichedSessions]
  );

  const sourceCandidates = useMemo(
    () => enrichedSessions.filter(s => s.is_active || (s.active_student_count || 0) > 0),
    [enrichedSessions]
  );

  useEffect(() => {
    if (activeSession && !fromSessionId) {
      setFromSessionId(String(activeSession.id));
    } else if (!activeSession && sourceCandidates.length > 0 && !fromSessionId) {
      setFromSessionId(String(sourceCandidates[0].id));
    }
  }, [activeSession, sourceCandidates, fromSessionId]);

  useEffect(() => {
    if (upcomingSessions.length > 0) {
      const stillValid = upcomingSessions.some(s => String(s.id) === String(toSessionId));
      if (!stillValid) setToSessionId(String(upcomingSessions[0].id));
    } else {
      setToSessionId('');
    }
  }, [upcomingSessions, toSessionId]);

  const handleNameChange = (val) => {
    setNewSession(val);
    const matchRange = val.trim().match(/^(\d{4})[-/](\d{2,4})$/);
    if (matchRange) {
      const startYear = parseInt(matchRange[1], 10);
      let endYearStr = matchRange[2];
      if (endYearStr.length === 2) endYearStr = matchRange[1].slice(0, 2) + endYearStr;
      const endYear = parseInt(endYearStr, 10);
      if (endYear > startYear) {
        setNewStartDate(`${startYear}-04-01`);
        setNewEndDate(`${endYear}-03-31`);
      }
    }
  };

  const createSession = async () => {
    if (!newSession.trim()) return toast.error('Enter session name (e.g. 2027-2028)');
    setCreating(true);
    try {
      const payload = { name: newSession.trim() };
      if (newStartDate) payload.start_date = newStartDate;
      if (newEndDate) payload.end_date = newEndDate;
      await API.post('/session', payload);
      toast.success('Academic session created!');
      setNewSession('');
      setNewStartDate('');
      setNewEndDate('');
      loadSessions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create session.');
    } finally {
      setCreating(false);
    }
  };

  const activateSession = async (session) => {
    if (!window.confirm(`Set "${session.name}" as the active academic session? Older sessions will be archived.`)) return;
    try {
      await API.put(`/session/${session.id}/activate`);
      toast.success(`"${session.name}" is now the active session.`);
      setFromSessionId(String(session.id));
      loadSessions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to activate session.');
    }
  };

  const toggleArchive = async (session) => {
    const nextArchived = !session.is_archived;
    try {
      await API.put(`/session/${session.id}/archive`, { is_archived: nextArchived });
      toast.success(nextArchived ? `"${session.name}" archived.` : `"${session.name}" restored.`);
      loadSessions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update session.');
    }
  };

  const deleteSession = async (session) => {
    if (!window.confirm(`Delete unused session "${session.name}"? This cannot be undone.`)) return;
    try {
      await API.delete(`/session/${session.id}`);
      toast.success(`Session "${session.name}" deleted.`);
      loadSessions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete session.');
    }
  };

  const bulkPromote = async () => {
    if (!fromSessionId) return toast.error('Select a source session first.');
    if (!toSessionId) return toast.error('Create or select an upcoming session first.');
    const fromObj = enrichedSessions.find(s => String(s.id) === String(fromSessionId));
    const toObj   = enrichedSessions.find(s => String(s.id) === String(toSessionId));

    if (
      !window.confirm(
        `Promote eligible students from "${fromObj?.name}" to "${toObj?.name}"?\n\nClass 10 students will transition to Graduated (Alumni) status and students with pending dues will be skipped.`
      )
    ) {
      return;
    }

    setPromoting(true);
    try {
      const res = await API.post('/session/promote', {
        from_session_id: Number(fromSessionId),
        to_session_id:   Number(toSessionId),
        activate_target: activateTarget,
      });
      toast.success('Promotion completed successfully!');
      setSummaryModal({
        fromName: fromObj?.name || '',
        toName: toObj?.name || '',
        rows: res.data.summary || [],
      });
      if (activateTarget) setFromSessionId(String(toSessionId));
      loadSessions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Promotion failed.');
    } finally {
      setPromoting(false);
    }
  };

  const statusBadgeStyle = (status) => {
    if (status === 'Active')   return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    if (status === 'Upcoming') return 'bg-blue-100 text-blue-700 border border-blue-200';
    if (status === 'Previous') return 'bg-amber-100 text-amber-700 border border-amber-200';
    return 'bg-slate-100 text-slate-600 border border-slate-200';
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Sessions */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Academic Sessions</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage past, active, and upcoming school years. Past sessions remain archived while future years stay ready for promotion.
            </p>
          </div>
          {activeSession && (
            <span className="self-start sm:self-auto text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Current: {activeSession.name}
            </span>
          )}
        </div>

        <div className="space-y-2.5 mb-5">
          {loading ? (
            <p className="text-xs text-slate-400 py-4 text-center">Loading sessions...</p>
          ) : enrichedSessions.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No academic sessions found. Create one below.</p>
          ) : (
            enrichedSessions.map(s => {
              const status = s.computedStatus;
              const activeCount = s.active_student_count ?? 0;
              const totalCount = s.total_student_count ?? 0;

              return (
                <div
                  key={s.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-colors ${
                    s.is_active ? 'bg-emerald-50/40 border-emerald-200' : 'bg-slate-50/70 border-slate-200/70'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-800">{s.name}</span>
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${statusBadgeStyle(status)}`}>
                        {status}
                      </span>
                      {s.promotion_completed && (
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 font-semibold">
                          Promoted ✓
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                      {(s.start_date || s.end_date) && (
                        <span>
                          {formatDateShort(s.start_date)} – {formatDateShort(s.end_date)}
                        </span>
                      )}
                      <span className="font-medium text-slate-600">
                        {activeCount} active / {totalCount} total students
                      </span>
                    </div>
                  </div>

                  {!s.is_active && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {!s.is_archived && (
                        <button
                          onClick={() => activateSession(s)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold transition-colors"
                        >
                          Activate
                        </button>
                      )}
                      <button
                        onClick={() => toggleArchive(s)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-semibold transition-colors"
                      >
                        {s.is_archived ? 'Restore' : 'Archive'}
                      </button>
                      {totalCount === 0 && (
                        <button
                          onClick={() => deleteSession(s)}
                          className="text-xs px-2.5 py-1.5 rounded-lg text-red-500 hover:bg-red-50 font-semibold transition-colors"
                          title="Delete unused session"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Create new session */}
        <div className="pt-4 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Add Upcoming Academic Session
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <input
              value={newSession}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="e.g. 2027-2028"
              onKeyDown={e => e.key === 'Enter' && createSession()}
              className="sm:col-span-5 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            />
            <input
              type="date"
              value={newStartDate}
              onChange={e => setNewStartDate(e.target.value)}
              title="Session Start Date"
              className="sm:col-span-3 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-600 outline-none focus:border-blue-500"
            />
            <input
              type="date"
              value={newEndDate}
              onChange={e => setNewEndDate(e.target.value)}
              title="Session End Date"
              className="sm:col-span-2 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-600 outline-none focus:border-blue-500"
            />
            <button
              onClick={createSession}
              disabled={creating}
              className="sm:col-span-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              {creating ? '...' : '+ Create'}
            </button>
          </div>
        </div>
      </div>

      {/* Promotion map */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 text-base mb-1">Bulk Student Promotion</h3>
        <p className="text-xs text-slate-400 mb-4">
          Promotes eligible students (with cleared fees) to the next class and generates their promotion/annual fees.
        </p>

        {/* Source & Target selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Promote From Session
            </label>
            <select
              value={fromSessionId}
              onChange={e => setFromSessionId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-blue-500"
            >
              {sourceCandidates.length === 0 ? (
                <option value="">No source session available</option>
              ) : (
                sourceCandidates.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.computedStatus} • {s.active_student_count || 0} active students)
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Promote To (Upcoming Session)
            </label>
            <select
              value={toSessionId}
              onChange={e => setToSessionId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-blue-500"
            >
              {upcomingSessions.length === 0 ? (
                <option value="">Create an upcoming session above first</option>
              ) : (
                upcomingSessions.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.computedStatus})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs font-medium text-slate-600 mb-4 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={activateTarget}
            onChange={e => setActivateTarget(e.target.checked)}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          Automatically activate target session and archive source session after promotion
        </label>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-4 text-xs text-amber-900 leading-relaxed">
          ⚠️ Students with cleared dues will be moved to their next class. Class 10 students will transition to{' '}
          <strong>Graduated (Alumni)</strong> status, while students with unpaid or partial dues will remain in the source session until cleared.
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
          {Object.entries(PROMOTION_MAP).map(([from, to]) => (
            <div key={from} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm">
              <span className="font-medium text-slate-700">{from}</span>
              <span className="text-slate-400 mx-2">→</span>
              <span className={`font-semibold ${to.includes('Graduated') ? 'text-purple-700' : 'text-blue-600'}`}>
                {to}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={bulkPromote}
          disabled={promoting || !fromSessionId || !toSessionId || String(fromSessionId) === String(toSessionId)}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
        >
          {promoting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Promoting Students...
            </span>
          ) : 'Promote All Eligible Classes'}
        </button>

        {upcomingSessions.length === 0 && (
          <p className="text-xs text-slate-400 text-center mt-2">
            Create an upcoming academic session above before running promotion.
          </p>
        )}
      </div>

      {/* Saved Last-Session Attendance & Promotion History */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Saved Session Attendance &amp; Promotion Log</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Each promoted student&apos;s previous session attendance is archived here while their new session begins at 0%
            </p>
          </div>
          <input
            type="text"
            placeholder="Filter by student, class, session..."
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500 w-full sm:w-64"
          />
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wide border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-3.5">Student</th>
                <th className="py-2.5 px-3.5">From Session &amp; Class</th>
                <th className="py-2.5 px-3.5">To Session &amp; Class</th>
                <th className="py-2.5 px-3.5">Saved Attendance</th>
                <th className="py-2.5 px-3.5 text-center">Final %</th>
                <th className="py-2.5 px-3.5">Promoted Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {promotionHistory
                .filter((row) => {
                  if (!historySearch.trim()) return true;
                  const q = historySearch.toLowerCase();
                  const fullName = `${row.student?.first_name || ''} ${row.student?.last_name || ''}`.toLowerCase();
                  return (
                    fullName.includes(q) ||
                    (row.student?.student_id || '').toLowerCase().includes(q) ||
                    (row.from_class || '').toLowerCase().includes(q) ||
                    (row.to_class || '').toLowerCase().includes(q) ||
                    (row.from_session_name || '').toLowerCase().includes(q) ||
                    (row.to_session_name || '').toLowerCase().includes(q)
                  );
                })
                .map((row) => {
                  const pct = Number(row.attendance_percentage || 0);
                  const working = Number(row.attendance_working_days || 0);
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3.5">
                        <p className="font-semibold text-slate-800">
                          {row.student ? `${row.student.first_name} ${row.student.last_name}` : `Student #${row.student_id}`}
                        </p>
                        {row.student?.student_id && (
                          <p className="text-[11px] text-slate-400 font-mono">{row.student.student_id}</p>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <p className="font-medium text-slate-700">{row.from_session_name || row.from_session}</p>
                        <p className="text-[11px] text-slate-500">
                          Class {row.from_class}{row.from_section ? `-${row.from_section}` : ''}
                        </p>
                      </td>
                      <td className="py-2.5 px-3.5">
                        <p className="font-medium text-blue-700">{row.to_session_name || row.to_session}</p>
                        <p className="text-[11px] text-slate-500">
                          {row.to_class === 'alumni' ? 'Graduated (Alumni)' : `Class ${row.to_class}`}
                        </p>
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-600">
                        {working > 0 ? (
                          <span>
                            <strong className="text-emerald-600">{row.attendance_present || 0}P</strong>
                            {' / '}
                            <strong className="text-red-500">{row.attendance_absent || 0}A</strong>
                            {' / '}
                            <strong className="text-amber-600">{row.attendance_late || 0}L</strong>
                            <span className="text-slate-400"> ({working} days)</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">No days marked</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold ${
                          working === 0 ? 'bg-slate-100 text-slate-500'
                          : pct >= 80 ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                        }`}>
                          {pct}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-500">
                        {formatDateShort(row.created_at || row.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              {promotionHistory.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No promotion history records found yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Promotion Summary Modal */}
      {summaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-lg shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Promotion Summary</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {summaryModal.fromName} → {summaryModal.toName}
                </p>
              </div>
              <button
                onClick={() => setSummaryModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl">
              {summaryModal.rows.map((r, idx) => (
                <div key={idx} className="flex items-center justify-between px-3.5 py-2.5 text-xs">
                  <span className="font-semibold text-slate-700">
                    {r.fromClass} → {r.toClass === 'alumni' ? 'Graduated (Alumni)' : r.toClass}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                      Promoted: {r.count}
                    </span>
                    {r.skipped > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold">
                        Skipped (Dues): {r.skipped}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSummaryModal(null)}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold py-2.5 rounded-xl"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}