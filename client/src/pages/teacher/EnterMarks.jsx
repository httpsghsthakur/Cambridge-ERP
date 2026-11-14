import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';
import Modal from '../../components/common/Modal';
import { getGradeBg, formatDate } from '../../utils/helpers';
import { EXAM_TYPES } from '../../constants/roles';
import toast from 'react-hot-toast';

const workflowColor = {
  draft:             'bg-gray-100 text-gray-600',
  submitted:         'bg-blue-100 text-blue-700',
  incharge_approved: 'bg-yellow-100 text-yellow-700',
  admin2_approved:   'bg-purple-100 text-purple-700',
  published:         'bg-green-100 text-green-700',
  rejected:          'bg-red-100 text-red-700',
};

const workflowLabel = {
  draft:             ' Draft',
  submitted:         ' Submitted',
  incharge_approved: ' Incharge OK',
  admin2_approved:   ' Admin2 OK',
  published:         ' Published',
  rejected:          ' Rejected',
};

export default function EnterMarks() {
  const { user } = useAuth();
  const teacher  = user?.linkedTeacher;

  const [assignments, setAssignments] = useState([]);
  
  // Selected class subject assignment
  const [selectedAssignmentIndex, setSelectedAssignmentIndex] = useState('0');
  const [cls, setCls]         = useState('');
  const [section, setSection] = useState('A');
  const [subject, setSubject] = useState('');
  
  const [students, setStudents] = useState([]);
  const [marks, setMarks]       = useState({});
  const [examName, setExamName] = useState('');
  const [examType, setExamType] = useState('unit_test');
  const [maxMarks, setMaxMarks] = useState(100);
  const [isClassTest, setIsClassTest] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [results, setResults]   = useState([]);
  const [submitModal, setSubmitModal] = useState(null); // result to submit
  const [inchargeModal, setInchargeModal] = useState(null);
  const [actionNote, setActionNote] = useState('');

  const SECTIONS = ['A', 'B', 'C', 'D'];
  const COMMON_CLASSES = ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
  const COMMON_SUBJECTS = ['English', 'Hindi', 'Mathematics', 'Science', 'Social Studies', 'Urdu', 'Kashmiri', 'Computer Science', 'General'];

  useEffect(() => {
    API.get('/class-subjects/my-assignments')
      .then(res => {
        const list = res.data || [];
        setAssignments(list);
        if (list.length > 0) {
          setSelectedAssignmentIndex('0');
          setCls(list[0].class || '');
          setSection(list[0].section || 'A');
          setSubject(list[0].subject || 'General');
        } else {
          setCls('8th');
          setSection('A');
          setSubject(teacher?.subject ? teacher.subject.split(',')[0].trim() : 'General');
        }
      })
      .catch(() => {
        toast.error('Failed to load assignments');
        setCls('8th');
        setSection('A');
        setSubject('General');
      });
  }, [teacher]);

  const handleAssignmentChange = (e) => {
    const val = e.target.value;
    setSelectedAssignmentIndex(val);
    const idx = parseInt(val, 10);
    if (!isNaN(idx) && assignments[idx]) {
      const a = assignments[idx];
      setCls(a.class);
      setSection(a.section || 'A');
      setSubject(a.subject || 'General');
    }
  };

  useEffect(() => {
    if (!cls || !section) {
      setStudents([]);
      setResults([]);
      return;
    }
    
    setLoadingStudents(true);
    API.get(`/students?class=${encodeURIComponent(cls)}&section=${encodeURIComponent(section)}`)
      .then(r => {
        const list = r.data.students || [];
        setStudents(list);
        const init = {};
        list.forEach(s => { init[s.id] = ''; });
        setMarks(init);
      })
      .catch(() => toast.error('Failed to load students'))
      .finally(() => setLoadingStudents(false));

    API.get(`/results/class?class=${encodeURIComponent(cls)}&section=${encodeURIComponent(section)}`)
      .then(r => setResults(r.data || []))
      .catch(() => {});
  }, [cls, section]);

  const calcGrade = (obtained, max) => {
    const p = max > 0 ? (obtained / max) * 100 : 0;
    return p >= 90 ? 'A+' : p >= 80 ? 'A' : p >= 70 ? 'B' : p >= 60 ? 'C' : p >= 40 ? 'D' : 'F';
  };

  const handleSave = async () => {
    if (!examName.trim()) return toast.error('Enter exam name first.');
    setSaving(true);
    try {
      let saved = 0;
      for (const s of students) {
        const val = marks[s.id];
        if (val === '' || val === undefined) continue;
        const obtained = parseInt(val);
        await API.post('/results', {
          student_id:    s.id,
          exam_name:     examName,
          exam_type:     examType,
          class:         cls,
          section,
          subjects: [{ subject: subject || 'General', max_marks: parseInt(maxMarks), obtained_marks: obtained }],
          is_class_test: isClassTest,
        });
        saved++;
      }
      toast.success(`Marks saved for ${saved} students!`);
      const r = await API.get(`/results/class?class=${cls}&section=${section}`);
      setResults(r.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save.');
    } finally { setSaving(false); }
  };

  const submitForReview = async (resultId) => {
    try {
      await API.put(`/results/${resultId}/submit`);
      toast.success('Submitted for class incharge review.');
      const r = await API.get(`/results/class?class=${cls}&section=${section}`);
      setResults(r.data || []);
      setSubmitModal(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
  };

  const submitAllForReview = async () => {
    if (!examName.trim()) return toast.error('Enter exam name first.');
    if (!window.confirm(`Submit all draft marks for ${cls} ${section} - ${examName}?`)) return;
    
    setSaving(true);
    try {
      const res = await API.put('/results/bulk-submit', {
        class: cls,
        section: section,
        exam_name: examName
      });
      toast.success(res.data.message || 'Submitted successfully.');
      const r = await API.get(`/results/class?class=${cls}&section=${section}`);
      setResults(r.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit marks.');
    } finally {
      setSaving(false);
    }
  };

  const inchargeAction = async (resultId, action) => {
    try {
      await API.put(`/results/${resultId}/incharge-review`, { action, notes: actionNote });
      toast.success(action === 'approve' ? 'Approved and forwarded!' : 'Rejected.');
      const r = await API.get(`/results/class?class=${cls}&section=${section}`);
      setResults(r.data || []);
      setInchargeModal(null);
      setActionNote('');
    } catch (err) { toast.error(err.response?.data?.message || 'Not authorized as incharge.'); }
  };

  const sendClassTest = async (resultId) => {
    try {
      await API.put(`/results/${resultId}/send-to-parents`);
      toast.success('Class test result sent to parents!');
      const r = await API.get(`/results/class?class=${cls}&section=${section}`);
      setResults(r.data || []);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
  };

  const f = 'border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 bg-white w-full';

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 pb-4 border-b border-gray-100">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Assigned Class & Subject (Quick Select)
            </label>
            <select 
              value={selectedAssignmentIndex} 
              onChange={handleAssignmentChange} 
              className={f}
            >
              {assignments.length > 0 ? (
                assignments.map((assignment, index) => (
                  <option key={assignment.id} value={index}>
                    {assignment.class} {assignment.section} — {assignment.subject}
                  </option>
                ))
              ) : (
                <option value="">No explicit timetable assigned</option>
              )}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
            <select
              value={cls}
              onChange={e => setCls(e.target.value)}
              className={f}
            >
              {[...new Set([...assignments.map(a => a.class), ...COMMON_CLASSES])].filter(Boolean).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Section</label>
            <select
              value={section}
              onChange={e => setSection(e.target.value)}
              className={f}
            >
              {SECTIONS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-2">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Subject</label>
            <input
              type="text"
              list="common-subjects-list"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className={f}
              placeholder="e.g. Mathematics"
            />
            <datalist id="common-subjects-list">
              {[...new Set([...assignments.map(a => a.subject), ...COMMON_SUBJECTS])].filter(Boolean).map(sub => (
                <option key={sub} value={sub} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Max Marks</label>
            <input type="number" value={maxMarks} onChange={e => setMaxMarks(e.target.value)}
              className={f} min={1} max={200} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Exam Type</label>
            <select value={examType} onChange={e => setExamType(e.target.value)} className={f}>
              {EXAM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 mt-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Exam Name *</label>
            <input value={examName} onChange={e => setExamName(e.target.value)}
              className={f} placeholder="e.g. Unit Test 1 — 2026" />
          </div>
        </div>

        {/* Class test toggle */}
        <label className="flex items-center gap-2 mt-3 cursor-pointer">
          <input type="checkbox" checked={isClassTest} onChange={e => setIsClassTest(e.target.checked)}
            className="w-4 h-4 accent-blue-500" />
          <span className="text-sm text-gray-600">
            Class Test <span className="text-gray-400 text-xs">(skip approval workflow — send directly to parents)</span>
          </span>
        </label>
      </div>

      {/* Marks entry + results in two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Entry */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">
              Mark Entry — {cls} {section} · {subject}
            </h3>
            <span className="text-xs text-gray-400">{students.length} students</span>
          </div>
          {loadingStudents ? (
            <p className="text-center text-gray-400 py-8 text-sm">Loading students...</p>
          ) : students.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">No students found for Class {cls || '—'} {section || ''}.</p>
          ) : (
            <>
              <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
                {students.map(s => {
                  const val   = marks[s.id];
                  const grade = val !== '' && val !== undefined ? calcGrade(parseInt(val), maxMarks) : '';
                  return (
                    <div key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="text-xs text-gray-400 w-5 flex-shrink-0">{s.roll_number}</span>
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {s.first_name?.[0]}
                      </div>
                      <span className="text-sm flex-1 truncate">{s.first_name} {s.last_name}</span>
                      <input
                        type="number" min={0} max={maxMarks}
                        value={marks[s.id] ?? ''}
                        onChange={e => setMarks(p => ({ ...p, [s.id]: e.target.value }))}
                        className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center outline-none focus:border-blue-500"
                        placeholder="—"
                      />
                      {grade && (
                        <span className={`text-xs font-bold px-2 py-1 rounded w-10 text-center flex-shrink-0 ${getGradeBg(grade)}`}>
                          {grade}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="px-4 py-3 border-t border-gray-100">
                <button onClick={handleSave} disabled={saving || !examName.trim()}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                  {saving ? 'Saving...' : ` Save Marks${isClassTest ? ' (Class Test)' : ''}`}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Results sidebar */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Saved Results</h3>
            {examName && results.some(r => r.exam_name === examName && (r.workflow_status === 'draft' || r.workflow_status === 'rejected') && r.entered_by === user?.id) && (
              <button
                onClick={submitAllForReview}
                disabled={saving}
                className="text-xs bg-blue-500 hover:bg-blue-600 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                {saving ? 'Submitting...' : 'Submit All to Incharge'}
              </button>
            )}
          </div>
          {results.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">No results yet.</p>
          ) : (
            <div className="divide-y divide-gray-50 max-h-[480px] overflow-y-auto">
              {results.map(r => (
                <div key={r.id} className="px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {r.student?.first_name} {r.student?.last_name}
                      </p>
                      <p className="text-xs text-gray-400">{r.exam_name}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${getGradeBg(r.grade)}`}>{r.grade}</span>
                      <p className="text-xs text-gray-400 mt-0.5">{r.percentage}%</p>
                    </div>
                  </div>
                  {/* Workflow status */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${workflowColor[r.workflow_status]}`}>
                      {workflowLabel[r.workflow_status]}
                    </span>
                    <div className="flex gap-1.5">
                      {r.workflow_status === 'draft' && (
                        <button onClick={() => setSubmitModal(r)}
                          className="text-xs bg-blue-500 text-white px-2 py-1 rounded-lg hover:bg-blue-600">
                          Submit
                        </button>
                      )}
                      {r.workflow_status === 'submitted' && (
                        <button onClick={() => { setInchargeModal(r); setActionNote(''); }}
                          className="text-xs bg-yellow-500 text-white px-2 py-1 rounded-lg hover:bg-yellow-600">
                          Review
                        </button>
                      )}
                      {r.is_class_test && !r.sent_to_parents && (
                        <button onClick={() => sendClassTest(r.id)}
                          className="text-xs bg-green-500 text-white px-2 py-1 rounded-lg hover:bg-green-600">
                          Send
                        </button>
                      )}
                      {r.sent_to_parents && (
                        <span className="text-xs text-green-600 font-medium">✓ Sent</span>
                      )}
                    </div>
                  </div>
                  {r.rejection_reason && (
                    <p className="text-xs text-red-500 bg-red-50 rounded px-2 py-1">
                      Rejected: {r.rejection_reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Submit for review modal */}
      <Modal isOpen={!!submitModal} onClose={() => setSubmitModal(null)} title="Submit for Review">
        {submitModal && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-3 text-sm">
              <p><span className="text-gray-500">Student:</span> <span className="font-medium">{submitModal.student?.first_name} {submitModal.student?.last_name}</span></p>
              <p className="mt-1"><span className="text-gray-500">Exam:</span> <span className="font-medium">{submitModal.exam_name}</span></p>
              <p className="mt-1"><span className="text-gray-500">Marks:</span> <span className="font-medium">{submitModal.total_obtained}/{submitModal.total_marks} ({submitModal.percentage}%) — {submitModal.grade}</span></p>
            </div>
            <p className="text-sm text-gray-600">Submit this result to the class incharge for review?</p>
            <div className="flex gap-2">
              <button onClick={() => submitForReview(submitModal.id)}
                className="flex-1 bg-blue-500 text-white font-medium py-2.5 rounded-xl text-sm hover:bg-blue-600">
                Yes, Submit
              </button>
              <button onClick={() => setSubmitModal(null)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Incharge review modal */}
      <Modal isOpen={!!inchargeModal} onClose={() => setInchargeModal(null)} title="Class Incharge Review">
        {inchargeModal && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-3 text-sm">
              <p><span className="text-gray-500">Student:</span> <span className="font-medium">{inchargeModal.student?.first_name} {inchargeModal.student?.last_name}</span></p>
              <p className="mt-1"><span className="text-gray-500">Result:</span> <span className="font-medium">{inchargeModal.percentage}% — Grade {inchargeModal.grade}</span></p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Notes (optional)</label>
              <textarea value={actionNote} onChange={e => setActionNote(e.target.value)} rows={2}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500"
                placeholder="Add review notes..." />
            </div>
            <div className="flex gap-2">
              <button onClick={() => inchargeAction(inchargeModal.id, 'approve')}
                className="flex-1 bg-green-500 text-white font-medium py-2.5 rounded-xl text-sm hover:bg-green-600">
                ✓ Approve & Forward
              </button>
              <button onClick={() => inchargeAction(inchargeModal.id, 'reject')}
                className="flex-1 bg-red-500 text-white font-medium py-2.5 rounded-xl text-sm hover:bg-red-600">
                ✗ Reject
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}