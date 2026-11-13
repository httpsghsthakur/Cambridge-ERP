import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import API from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { can } from '../../utils/roleUtils';

export default function InchargeResults() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [examName, setExamName] = useState('');
  const [inchargeFilter, setInchargeFilter] = useState('');
  const [payload, setPayload] = useState({ incharges: [], active_incharge: null, exams: [], results: [] });
  const [reviewNotes, setReviewNotes] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkModal, setBulkModal] = useState(false);
  const [bulkNotes, setBulkNotes] = useState('');

  const loadResults = async (selectedExam = '', selectedIncharge = '') => {
    if (!can(user, 'INCHARGE_REVIEW')) return;

    setLoading(true);
    try {
      let query = '?';
      if (selectedExam) query += `exam_name=${encodeURIComponent(selectedExam)}&`;
      if (selectedIncharge) {
        const [cls, sec] = selectedIncharge.split('|');
        query += `class=${encodeURIComponent(cls)}&section=${encodeURIComponent(sec)}&`;
      }
      const response = await API.get(`/results/class-incharge${query}`);
      setPayload(response.data || { incharges: [], active_incharge: null, exams: [], results: [] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load class results.');
      setPayload({ incharges: [], active_incharge: null, exams: [], results: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResults(examName, inchargeFilter);
  }, [examName, inchargeFilter]);

  const handleReview = async (resultId, action) => {
    setActionLoading((prev) => ({ ...prev, [resultId]: true }));
    try {
      const notes = reviewNotes[resultId] || '';
      await API.put(`/results/${resultId}/incharge-review`, { action, notes });
      toast.success(`Result ${action === 'approve' ? 'approved' : 'rejected'} successfully.`);
      loadResults(examName, inchargeFilter);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [resultId]: false }));
    }
  };

  const handleBulkReview = async (action) => {
    let cls, sec;
    if (inchargeFilter) {
      [cls, sec] = inchargeFilter.split('|');
    } else if (payload.active_incharge) {
      cls = payload.active_incharge.class;
      sec = payload.active_incharge.section;
    }

    if (!cls || !sec || !examName) {
      return toast.error('Please select both a class and an exam first.');
    }

    setBulkLoading(true);
    try {
      const res = await API.put('/results/bulk-incharge-review', {
        action,
        notes: bulkNotes,
        class: cls,
        section: sec,
        exam_name: examName
      });
      toast.success(res.data.message || `Results ${action === 'approve' ? 'approved' : 'rejected'}.`);
      setBulkModal(false);
      setBulkNotes('');
      loadResults(examName, inchargeFilter);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    } finally {
      setBulkLoading(false);
    }
  };

  const groupedRows = useMemo(() => {
    const rows = new Map();

    for (const result of payload.results || []) {
      const key = result.student_id;
      if (!rows.has(key)) {
        rows.set(key, {
          studentId: result.student?.student_id || result.student_id,
          rollNumber: result.student?.roll_number || '—',
          studentName: `${result.student?.first_name || ''} ${result.student?.last_name || ''}`.trim(),
          class: result.student?.class,
          section: result.student?.section,
          exams: {},
        });
      }

      const entry = rows.get(key);
      const examKey = result.exam_name || 'Exam';
      if (!entry.exams[examKey]) {
        entry.exams[examKey] = {
          resultId: result.id,
          workflowStatus: result.workflow_status,
          rejectionReason: result.rejection_reason,
          subjects: [],
        };
      }

      for (const subject of result.subjects || []) {
        entry.exams[examKey].subjects.push({
          subject: subject.subject,
          marks: `${subject.obtained_marks}/${subject.max_marks}`,
          grade: subject.grade,
          enteredBy: result.enteredByUser?.name || '—',
        });
      }
    }

    return Array.from(rows.values());
  }, [payload.results]);

  if (!can(user, 'INCHARGE_REVIEW')) {
    return <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">Access denied.</div>;
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-gray-800">Class Incharge Results</h2>
              {examName && (inchargeFilter || payload.active_incharge) && payload.results.some(r => r.workflow_status === 'submitted') && (
                <button
                  onClick={() => setBulkModal(true)}
                  className="bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                >
                  Review Class Results
                </button>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {payload.incharges && payload.incharges.length > 0
                ? payload.active_incharge 
                  ? `Viewing all subjects for ${payload.active_incharge.class} - ${payload.active_incharge.section}`
                  : `Viewing all subjects for ${payload.incharges.length} classes`
                : 'View all subjects for your assigned class.'}
            </p>
          </div>
          <div className="flex w-full flex-col sm:w-auto sm:flex-row gap-3">
            {payload.incharges && payload.incharges.length > 1 && (
              <div className="w-full sm:w-48">
                <label className="mb-1 block text-xs font-medium text-gray-500">Filter by Class</label>
                <select
                  value={inchargeFilter}
                  onChange={(e) => setInchargeFilter(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                >
                  <option value="">All Classes</option>
                  {payload.incharges.map((ic) => (
                    <option key={`${ic.class}|${ic.section}`} value={`${ic.class}|${ic.section}`}>
                      {ic.class} - {ic.section}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="w-full sm:w-48">
              <label className="mb-1 block text-xs font-medium text-gray-500">Filter by Exam</label>
              <select
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              >
                <option value="">All Exams</option>
                {(payload.exams || []).map((exam) => (
                  <option key={exam} value={exam}>
                    {exam}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading results...</div>
        ) : groupedRows.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">No results found for this class.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Roll No.</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Exam</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Marks</th>
                  <th className="px-4 py-3">Grade</th>
                  <th className="px-4 py-3">Entered By</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {groupedRows.flatMap((row) =>
                  Object.entries(row.exams).flatMap(([exam, examData], examIndex) =>
                    examData.subjects.map((subject, subjectIndex) => (
                      <tr key={`${row.studentId}-${exam}-${subject.subject}-${subjectIndex}`} className="border-t border-gray-100">
                        <td className="px-4 py-3 text-gray-600">{subjectIndex === 0 && examIndex === 0 ? `${row.class} - ${row.section}` : ''}</td>
                        <td className="px-4 py-3 text-gray-600">{subjectIndex === 0 && examIndex === 0 ? row.rollNumber : ''}</td>
                        <td className="px-4 py-3">
                          {subjectIndex === 0 && examIndex === 0 ? (
                            <div>
                              <p className="font-medium text-gray-800">{row.studentName}</p>
                              <p className="text-xs text-gray-400">{row.studentId}</p>
                            </div>
                          ) : (
                            ''
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{subjectIndex === 0 ? exam : ''}</td>
                        <td className="px-4 py-3 text-gray-700">{subject.subject}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{subject.marks}</td>
                        <td className="px-4 py-3">{subject.grade}</td>
                        <td className="px-4 py-3 text-gray-500">{subject.enteredBy}</td>
                        {subjectIndex === 0 && (
                          <td className="px-4 py-3 text-center border-l border-gray-100" rowSpan={examData.subjects.length}>
                            {examData.workflowStatus === 'draft' && (
                              <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">Draft</span>
                            )}
                            {examData.workflowStatus === 'submitted' && (
                              <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">Pending Review</span>
                            )}
                            {examData.workflowStatus === 'incharge_approved' && (
                              <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">Approved by Incharge</span>
                            )}
                            {examData.workflowStatus === 'admin2_approved' && (
                              <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">Forwarded to Admin</span>
                            )}
                            {examData.workflowStatus === 'published' && (
                              <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">Published</span>
                            )}
                            {examData.workflowStatus === 'rejected' && (
                              <div>
                                <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">Rejected</span>
                                {examData.rejectionReason && (
                                  <p className="mt-1 text-xs text-red-500 max-w-[120px] mx-auto break-words font-normal">Reason: {examData.rejectionReason}</p>
                                )}
                              </div>
                            )}
                          </td>
                        )}
                        {subjectIndex === 0 && (
                          <td className="px-4 py-3 text-center border-l border-gray-100" rowSpan={examData.subjects.length}>
                            {examData.workflowStatus === 'submitted' ? (
                              <div className="flex flex-col gap-2 min-w-[180px] max-w-[220px] mx-auto text-left">
                                <input
                                  type="text"
                                  placeholder="Review notes (optional)..."
                                  value={reviewNotes[examData.resultId] || ''}
                                  onChange={(e) => setReviewNotes({ ...reviewNotes, [examData.resultId]: e.target.value })}
                                  className="rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-blue-500 w-full"
                                  disabled={actionLoading[examData.resultId]}
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleReview(examData.resultId, 'approve')}
                                    disabled={actionLoading[examData.resultId]}
                                    className="flex-1 rounded bg-green-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:opacity-50"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleReview(examData.resultId, 'reject')}
                                    disabled={actionLoading[examData.resultId]}
                                    className="flex-1 rounded bg-red-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"
                                  >
                                    Reject
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {bulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold text-gray-800">Review Class Results</h3>
            <p className="mb-4 text-sm text-gray-600">
              You are reviewing all submitted marks for <strong>{examName}</strong>. 
              Approving will forward them to the administration for final declaration.
            </p>
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-gray-500">Notes (Optional)</label>
              <textarea
                value={bulkNotes}
                onChange={(e) => setBulkNotes(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-blue-500"
                placeholder="Add any comments..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkReview('approve')}
                disabled={bulkLoading}
                className="flex-1 rounded-xl bg-green-500 py-2.5 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-60"
              >
                {bulkLoading ? 'Processing...' : '✓ Approve & Forward All'}
              </button>
              <button
                onClick={() => setBulkModal(false)}
                disabled={bulkLoading}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
