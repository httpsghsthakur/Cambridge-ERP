import { useState, useEffect, useMemo, useCallback } from 'react';
import API from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const EMPTY_ROW = () => ({
  subject: '',
  exam_date: '',
  start_time: '09:00',
  end_time: '12:00',
  room: '',
  syllabus_notes: '',
});

const STATUS_BADGES = {
  draft: 'bg-slate-100 text-slate-600 border-slate-200',
  submitted: 'bg-blue-50 text-blue-700 border-blue-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  declared: 'bg-purple-50 text-purple-700 border-purple-200',
};

const EXAM_TYPES = [
  { value: 'unit_test', label: 'Unit Test' },
  { value: 'half_yearly', label: 'Half Yearly' },
  { value: 'annual', label: 'Annual Examination' },
  { value: 'assessment', label: 'Periodic Assessment' },
  { value: 'pre_board', label: 'Pre-Board' },
  { value: 'other', label: 'Other' },
];

export default function InchargeDatesheet() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [assignedClasses, setAssignedClasses] = useState([]);
  const [datesheets, setDatesheets] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]);

  // Editor State
  const [editingId, setEditingId] = useState(null);
  const [selectedPairKey, setSelectedPairKey] = useState('');
  const [examName, setExamName] = useState('');
  const [examType, setExamType] = useState('half_yearly');
  const [instructions, setInstructions] = useState('');
  const [rows, setRows] = useState([EMPTY_ROW()]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get('/datesheets/incharge');
      const ac = Array.isArray(res.data?.assignedClasses) ? res.data.assignedClasses : [];
      const ds = Array.isArray(res.data?.datesheets) ? res.data.datesheets : [];
      setAssignedClasses(ac);
      setDatesheets(ds);
      if (ac.length > 0) {
        setSelectedPairKey((prev) => prev || `${ac[0].class}::${ac[0].section}`);
      }
    } catch {
      toast.error('Failed to load datesheet workspace.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedClassInfo = useMemo(() => {
    if (!selectedPairKey) return null;
    const [cls, section] = selectedPairKey.split('::');
    return assignedClasses.find((a) => a.class === cls && a.section === section) || { class: cls, section };
  }, [selectedPairKey, assignedClasses]);

  useEffect(() => {
    if (!selectedClassInfo?.class) return;
    API.get('/class-subjects', {
      params: { class: selectedClassInfo.class, section: selectedClassInfo.section },
    })
      .then((res) => setClassSubjects(Array.isArray(res.data) ? res.data : []))
      .catch(() => setClassSubjects([]));
  }, [selectedClassInfo?.class, selectedClassInfo?.section]);

  const resetForm = () => {
    setEditingId(null);
    setExamName('');
    setExamType('half_yearly');
    setInstructions('');
    setRows([EMPTY_ROW()]);
  };

  const handleLoadSubjects = () => {
    const names = [...new Set(classSubjects.map((cs) => cs.subject).filter(Boolean))];
    if (names.length === 0) {
      toast('No pre-configured subjects found for this class. Add subjects manually below.', { icon: 'ℹ️' });
      return;
    }
    setRows(
      names.map((subject) => ({
        subject,
        exam_date: '',
        start_time: '09:00',
        end_time: '12:00',
        room: '',
        syllabus_notes: '',
      }))
    );
    toast.success(`Loaded ${names.length} subject(s) for ${selectedClassInfo.class} - ${selectedClassInfo.section}`);
  };

  const updateRow = (idx, field, val) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: val } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, EMPTY_ROW()]);
  const removeRow = (idx) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const startEdit = (ds) => {
    setEditingId(ds.id);
    setSelectedPairKey(`${ds.class}::${ds.section}`);
    setExamName(ds.exam_name);
    setExamType(ds.exam_type || 'unit_test');
    setInstructions(ds.instructions || '');
    setRows(
      (ds.entries || []).length > 0
        ? ds.entries.map((e) => ({
            subject: e.subject || '',
            exam_date: e.exam_date || '',
            start_time: e.start_time || '09:00',
            end_time: e.end_time || '12:00',
            room: e.room || '',
            syllabus_notes: e.syllabus_notes || '',
          }))
        : [EMPTY_ROW()]
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async (action) => {
    if (!selectedClassInfo?.class || !selectedClassInfo?.section) {
      return toast.error('Select a valid assigned class and section.');
    }
    if (!examName.trim()) {
      return toast.error('Please enter Exam Name (e.g. Half Yearly Examination 2026).');
    }

    const validRows = rows.filter((r) => r.subject.trim() && r.exam_date && r.start_time && r.end_time);
    if (validRows.length === 0) {
      return toast.error('Add at least one complete row with Subject, Exam Date, Start Time, and End Time.');
    }
    if (validRows.length !== rows.length) {
      return toast.error('Please complete or remove any partially filled subject rows.');
    }

    setSaving(true);
    try {
      const payload = {
        exam_name: examName.trim(),
        exam_type: examType,
        class: selectedClassInfo.class,
        section: selectedClassInfo.section,
        session_id: selectedClassInfo.session_id || null,
        instructions: instructions.trim() || null,
        entries: validRows,
        action, // 'draft' | 'submit'
      };

      if (editingId) {
        await API.put(`/datesheets/${editingId}`, payload);
      } else {
        await API.post('/datesheets', payload);
      }

      toast.success(
        action === 'submit'
          ? 'Datesheet submitted to Admin for approval and declaration!'
          : 'Datesheet saved as draft.'
      );
      resetForm();
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save datesheet.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ds) => {
    if (!window.confirm(`Delete "${ds.exam_name}" (${ds.class} - ${ds.section})?`)) return;
    try {
      await API.delete(`/datesheets/${ds.id}`);
      toast.success('Datesheet deleted.');
      if (editingId === ds.id) resetForm();
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete datesheet.');
    }
  };

  if (loading) return <LoadingSpinner />;

  if (user?.role === 'teacher' && assignedClasses.length === 0) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-100 shadow-card p-10 text-center mt-6">
        <h2 className="text-xl font-extrabold text-slate-800">Class Incharge Access Required</h2>
        <p className="text-sm text-slate-500 mt-2">
          Only a designated Class Incharge can create and submit exam datesheets for their class. Please contact Admin to be assigned as Class Incharge.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
            Class Incharge Portal
          </span>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight mt-2">
            Exam Datesheet Builder
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Create the exam schedule for your assigned class and submit it to Admin for approval &amp; declaration.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLoadSubjects}
          className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all whitespace-nowrap"
        >
          Auto-Fill Class Subjects
        </button>
      </div>

      {/* Builder Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-base font-extrabold text-slate-800">
            {editingId ? 'Edit Exam Datesheet' : 'Create New Exam Datesheet'}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 underline"
            >
              Cancel Editing
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Class &amp; Section
            </label>
            <select
              value={selectedPairKey}
              disabled={Boolean(editingId)}
              onChange={(e) => setSelectedPairKey(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
            >
              {assignedClasses.map((ac) => (
                <option key={`${ac.class}::${ac.section}`} value={`${ac.class}::${ac.section}`}>
                  {ac.class} — Section {ac.section}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Exam Name *
            </label>
            <input
              type="text"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              placeholder="e.g. Half Yearly Examination 2026"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Exam Type
            </label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {EXAM_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic Entries Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <datalist id="incharge-class-subjects">
            {[...new Set(classSubjects.map((cs) => cs.subject))].map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>

          <table className="w-full min-w-[780px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-3.5">Subject *</th>
                <th className="py-3 px-3.5">Exam Date *</th>
                <th className="py-3 px-3.5">Start Time *</th>
                <th className="py-3 px-3.5">End Time *</th>
                <th className="py-3 px-3.5">Room / Hall</th>
                <th className="py-3 px-3.5">Syllabus Notes</th>
                <th className="py-3 px-3.5 text-center w-14">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, idx) => (
                <tr key={idx} className="bg-white">
                  <td className="p-2.5">
                    <input
                      type="text"
                      list="incharge-class-subjects"
                      value={row.subject}
                      onChange={(e) => updateRow(idx, 'subject', e.target.value)}
                      placeholder="Mathematics"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="p-2.5">
                    <input
                      type="date"
                      value={row.exam_date}
                      onChange={(e) => updateRow(idx, 'exam_date', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="p-2.5">
                    <input
                      type="time"
                      value={row.start_time}
                      onChange={(e) => updateRow(idx, 'start_time', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="p-2.5">
                    <input
                      type="time"
                      value={row.end_time}
                      onChange={(e) => updateRow(idx, 'end_time', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="p-2.5">
                    <input
                      type="text"
                      value={row.room}
                      onChange={(e) => updateRow(idx, 'room', e.target.value)}
                      placeholder="Hall A"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="p-2.5">
                    <input
                      type="text"
                      value={row.syllabus_notes}
                      onChange={(e) => updateRow(idx, 'syllabus_notes', e.target.value)}
                      placeholder="Ch. 1 to 6"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="p-2.5 text-center">
                    <button
                      type="button"
                      disabled={rows.length <= 1}
                      onClick={() => removeRow(idx)}
                      className="text-rose-500 hover:text-rose-700 disabled:opacity-30 text-xs font-bold px-2 py-1 rounded-lg hover:bg-rose-50"
                      title="Remove Row"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 w-fit transition-all"
          >
            + Add Subject Exam Row
          </button>

          <div className="flex-1 max-w-md">
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Optional exam instructions (e.g. Reporting time 8:30 AM, bring admit card)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave('draft')}
              className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all disabled:opacity-50"
            >
              Save Draft
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave('submit')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50"
            >
              {saving ? 'Submitting...' : 'Submit to Admin'}
            </button>
          </div>
        </div>
      </div>

      {/* Existing Datesheets List */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 space-y-4">
        <h2 className="text-lg font-extrabold text-slate-800">Submitted &amp; Draft Datesheets</h2>

        {datesheets.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-6 text-center">
            No datesheets created for your assigned class(es) yet.
          </p>
        ) : (
          <div className="space-y-4">
            {datesheets.map((ds) => {
              const canEdit = !['approved', 'declared'].includes(ds.status);
              const canDelete = ['draft', 'rejected'].includes(ds.status);
              return (
                <div key={ds.id} className="border border-slate-200 rounded-2xl p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-extrabold text-slate-800">{ds.exam_name}</span>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {ds.class} — Sec {ds.section}
                        </span>
                        <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${STATUS_BADGES[ds.status] || STATUS_BADGES.draft}`}>
                          {ds.status}
                        </span>
                      </div>
                      {ds.review_notes && (
                        <p className="text-xs text-rose-600 font-semibold mt-1">
                          Admin Remarks: {ds.review_notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => startEdit(ds)}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-all"
                        >
                          Edit / Resubmit
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDelete(ds)}
                          className="px-3.5 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold transition-all"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] uppercase text-slate-400">
                          <th className="py-2 pr-4">Date</th>
                          <th className="py-2 pr-4">Subject</th>
                          <th className="py-2 pr-4">Time</th>
                          <th className="py-2 pr-4">Room</th>
                          <th className="py-2">Syllabus</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {(ds.entries || []).map((en) => (
                          <tr key={en.id}>
                            <td className="py-2 pr-4 font-bold text-slate-700">{en.exam_date}</td>
                            <td className="py-2 pr-4 font-bold text-indigo-700">{en.subject}</td>
                            <td className="py-2 pr-4 text-slate-500">{en.start_time} – {en.end_time}</td>
                            <td className="py-2 pr-4 text-slate-500">{en.room || '—'}</td>
                            <td className="py-2 text-slate-500">{en.syllabus_notes || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

