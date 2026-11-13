import { useState, useEffect, useMemo } from 'react';
import API from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const STATUS_TABS = [
  { key: 'all', label: 'All Datesheets' },
  { key: 'submitted', label: 'Pending Review' },
  { key: 'approved', label: 'Approved (Ready)' },
  { key: 'declared', label: 'Declared' },
  { key: 'rejected', label: 'Rejected' },
];

const STATUS_BADGE = {
  draft: 'bg-slate-100 text-slate-600 border-slate-200',
  submitted: 'bg-blue-50 text-blue-700 border-blue-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  declared: 'bg-purple-50 text-purple-700 border-purple-200',
};

export default function AdminDatesheets() {
  const [loading, setLoading] = useState(true);
  const [datesheets, setDatesheets] = useState([]);
  const [summary, setSummary] = useState({});
  const [classMatrix, setClassMatrix] = useState([]);

  const [statusFilter, setStatusFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [examQuery, setExamQuery] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  // Rejection remark modal state
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectNotes, setRejectNotes] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const res = await API.get('/datesheets/admin');
      setDatesheets(Array.isArray(res.data?.datesheets) ? res.data.datesheets : []);
      setSummary(res.data?.summary || {});
      setClassMatrix(Array.isArray(res.data?.classMatrix) ? res.data.classMatrix : []);
    } catch {
      toast.error('Failed to load examination datesheets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const distinctClasses = useMemo(() => {
    const set = new Set([...classMatrix.map((c) => c.class), ...datesheets.map((d) => d.class)].filter(Boolean));
    return ['all', ...Array.from(set).sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }))];
  }, [classMatrix, datesheets]);

  const filteredDatesheets = useMemo(() => {
    return datesheets.filter((ds) => {
      if (statusFilter !== 'all' && ds.status !== statusFilter) return false;
      if (classFilter !== 'all' && ds.class !== classFilter) return false;
      if (examQuery.trim() && !String(ds.exam_name || '').toLowerCase().includes(examQuery.trim().toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [datesheets, statusFilter, classFilter, examQuery]);

  // Compute class readiness overview for all school classes before declaration
  const classCoverageRows = useMemo(() => {
    return classMatrix.map((cm) => {
      const classSheets = datesheets.filter(
        (d) =>
          d.class === cm.class &&
          d.section === cm.section &&
          (!examQuery.trim() || String(d.exam_name || '').toLowerCase().includes(examQuery.trim().toLowerCase()))
      );
      const latest = classSheets[0] || null;
      return {
        ...cm,
        status: latest ? latest.status : 'missing',
        exam_name: latest?.exam_name || null,
        entriesCount: latest?.entries?.length || 0,
      };
    });
  }, [classMatrix, datesheets, examQuery]);

  const handleReview = async (id, decision, notes = '') => {
    setBusyId(id);
    try {
      await API.put(`/datesheets/${id}/review`, { decision, review_notes: notes });
      toast.success(decision === 'approved' ? 'Datesheet approved!' : 'Datesheet sent back for revision.');
      setRejectTarget(null);
      setRejectNotes('');
      await loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Review action failed.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeclare = async (ds) => {
    if (
      !window.confirm(
        `Declare "${ds.exam_name}" datesheet for ${ds.class} - Section ${ds.section}? This will immediately notify all students, parents, and teachers.`
      )
    ) {
      return;
    }
    setBusyId(ds.id);
    try {
      const res = await API.put(`/datesheets/${ds.id}/declare`);
      toast.success(res.data?.message || 'Datesheet declared!');
      await loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to declare datesheet.');
    } finally {
      setBusyId(null);
    }
  };

  const handleBulkDeclare = async () => {
    const readyIds = filteredDatesheets
      .filter((d) => ['approved', 'submitted'].includes(d.status))
      .map((d) => d.id);
    if (readyIds.length === 0) {
      return toast.error('No approved or submitted datesheets match your current filter.');
    }
    if (
      !window.confirm(
        `Declare ${readyIds.length} class datesheet(s) together and send an official school-wide announcement notification to everyone?`
      )
    ) {
      return;
    }

    setBulkBusy(true);
    try {
      const res = await API.post('/datesheets/bulk-declare', {
        ids: readyIds,
        exam_name: examQuery.trim() || undefined,
      });
      toast.success(res.data?.message || 'Declared all selected datesheets!');
      await loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk declaration failed.');
    } finally {
      setBulkBusy(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const readyCount = filteredDatesheets.filter((d) => ['approved', 'submitted'].includes(d.status)).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            Examination Control
          </span>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight mt-2">
            Class Exam Datesheet Approvals &amp; Declaration
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Review datesheets submitted by Class Incharges across every class before declaring and notifying everyone.
          </p>
        </div>

        <button
          type="button"
          disabled={bulkBusy || readyCount === 0}
          onClick={handleBulkDeclare}
          className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold shadow-lg shadow-purple-500/20 disabled:opacity-40 transition-all whitespace-nowrap"
        >
          {bulkBusy ? 'Declaring...' : `Declare All Ready (${readyCount})`}
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: summary.total || 0, cls: 'text-slate-800' },
          { label: 'Pending Review', value: summary.submitted || 0, cls: 'text-blue-700' },
          { label: 'Approved Ready', value: summary.approved || 0, cls: 'text-emerald-700' },
          { label: 'Declared', value: summary.declared || 0, cls: 'text-purple-700' },
          { label: 'Rejected', value: summary.rejected || 0, cls: 'text-rose-700' },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-2xl border border-slate-100 shadow-card p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{k.label}</p>
            <p className={`text-2xl font-extrabold mt-1 ${k.cls}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* All-Class Status Coverage Overview Before Declaration */}
      {classCoverageRows.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 space-y-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-800">All-Class Submission Coverage</h2>
            <p className="text-xs text-slate-400">
              Verify every class &amp; section status prior to declaration.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {classCoverageRows.map((row) => (
              <div
                key={`${row.class}::${row.section}`}
                onClick={() => setClassFilter(row.class)}
                className="cursor-pointer p-3 rounded-2xl border border-slate-200/80 hover:border-indigo-300 bg-slate-50/70 transition-all"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-extrabold text-slate-800">
                    {row.class}-{row.section}
                  </span>
                  <span
                    className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                      STATUS_BADGE[row.status] || 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {row.status === 'missing' ? 'Pending' : row.status}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 truncate">
                  {row.inchargeName ? `Incharge: ${row.inchargeName}` : 'No Incharge assigned'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setStatusFilter(t.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                statusFilter === t.key
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700"
          >
            {distinctClasses.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? 'All Classes' : c}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={examQuery}
            onChange={(e) => setExamQuery(e.target.value)}
            placeholder="Filter by exam name..."
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium w-48"
          />
        </div>
      </div>

      {/* Class-wise Datesheet Cards */}
      {filteredDatesheets.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-12 text-center text-xs text-slate-400">
          No exam datesheets match your current filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDatesheets.map((ds) => {
            const isBusy = busyId === ds.id;
            const canApprove = ['submitted', 'rejected', 'draft'].includes(ds.status);
            const canReject = ['submitted', 'approved'].includes(ds.status);
            const canDeclare = ['submitted', 'approved'].includes(ds.status);

            return (
              <div key={ds.id} className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-extrabold text-slate-800">{ds.exam_name}</span>
                      <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {ds.class} — Section {ds.section}
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${STATUS_BADGE[ds.status] || STATUS_BADGE.draft}`}>
                        {ds.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5">
                      Prepared by: <span className="font-bold text-slate-700">{ds.createdByTeacher?.name || ds.createdByUser?.name || 'Staff'}</span>
                      {ds.entries?.length ? ` · ${ds.entries.length} subject paper(s)` : ''}
                    </p>
                    {ds.review_notes && (
                      <p className="text-xs text-rose-600 font-semibold mt-1">Remarks: {ds.review_notes}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {canApprove && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleReview(ds.id, 'approved')}
                        className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all disabled:opacity-50"
                      >
                        Approve
                      </button>
                    )}
                    {canReject && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => { setRejectTarget(ds); setRejectNotes(''); }}
                        className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all disabled:opacity-50"
                      >
                        Reject / Return
                      </button>
                    )}
                    {canDeclare && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleDeclare(ds)}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold shadow-sm transition-all disabled:opacity-50"
                      >
                        {isBusy ? 'Processing...' : 'Declare & Notify All'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Subject</th>
                        <th className="py-2.5 px-3">Timing</th>
                        <th className="py-2.5 px-3">Room / Hall</th>
                        <th className="py-2.5 px-3">Syllabus / Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(ds.entries || []).map((en) => (
                        <tr key={en.id}>
                          <td className="py-2.5 px-3 font-bold text-slate-700 whitespace-nowrap">{en.exam_date}</td>
                          <td className="py-2.5 px-3 font-extrabold text-indigo-700">{en.subject}</td>
                          <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{en.start_time} – {en.end_time}</td>
                          <td className="py-2.5 px-3 text-slate-500">{en.room || 'TBA'}</td>
                          <td className="py-2.5 px-3 text-slate-500">{en.syllabus_notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {ds.instructions && (
                  <p className="text-xs text-amber-800 bg-amber-50/70 border border-amber-100 px-3.5 py-2 rounded-xl">
                    <span className="font-bold">Instructions:</span> {ds.instructions}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 w-full max-w-md shadow-xl space-y-4">
            <h3 className="text-lg font-extrabold text-slate-800">
              Return Datesheet for Revision
            </h3>
            <p className="text-xs text-slate-500">
              Provide feedback for {rejectTarget.class} - Section {rejectTarget.section} ({rejectTarget.exam_name}).
            </p>
            <textarea
              rows={3}
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="e.g. Science and Maths exam dates clash with holiday..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!rejectNotes.trim() || busyId === rejectTarget.id}
                onClick={() => handleReview(rejectTarget.id, 'rejected', rejectNotes)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50"
              >
                Return to Incharge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

