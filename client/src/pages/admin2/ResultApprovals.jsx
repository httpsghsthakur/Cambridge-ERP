import { useState, useEffect } from 'react';
import API from '../../utils/api';
import Modal from '../../components/common/Modal';
import { getGradeBg } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function ResultApprovals() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [groupedResults, setGroupedResults] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modalGroup, setModalGroup] = useState(null);
  const [note, setNote]         = useState('');
  const [acting, setActing]     = useState(false);

  const load = () => {
    setLoading(true);
    API.get('/results/pending-approval')
      .then(r => {
        const results = r.data || [];
        const groups = {};
        results.forEach(res => {
          const key = `${res.class}-${res.section}-${res.exam_name}`;
          if (!groups[key]) {
            groups[key] = {
              class: res.class,
              section: res.section,
              exam_name: res.exam_name,
              exam_type: res.exam_type,
              students: []
            };
          }
          groups[key].students.push(res);
        });
        setGroupedResults(Object.values(groups));
      })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (group, action) => {
    setActing(true);
    try {
      const endpoint = isAdmin ? '/results/bulk-publish-class' : '/results/bulk-admin2-review';
      await API.put(endpoint, { 
        action, 
        notes: note,
        class: group.class,
        section: group.section,
        exam_name: group.exam_name
      });
      toast.success(action === 'approve' 
        ? (isAdmin ? 'Results Declared!' : 'Forwarded to Admin!') 
        : 'Results rejected.');
      setModalGroup(null);
      setNote('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.');
    } finally { setActing(false); }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-800">
          {isAdmin ? 'Result Declarations' : 'Result Approvals'}
        </h2>
        <p className="text-gray-400 text-sm mt-0.5">
          {isAdmin 
            ? 'Review approved results and publish them to students & parents.'
            : 'Review results approved by class incharge and forward to Admin.'}
        </p>
      </div>

      {/* Workflow legend */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
        <p className="font-semibold mb-1">Approval Workflow:</p>
        <p>Teacher → Class Incharge → {isAdmin ? 'Admin2 → ' : ''}<strong>{isAdmin ? 'Admin (You)' : 'Admin2 (You)'}</strong> {isAdmin ? '→ Published' : '→ Admin → Published'}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <p className="text-center py-10 text-gray-400 text-sm">Loading...</p>
        ) : groupedResults.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-2"></p>
            <p className="text-gray-500 font-medium">No pending approvals</p>
            <p className="text-gray-400 text-sm mt-1">All class results have been reviewed</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 560 }}>
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Class', 'Exam Name', 'Pending Students', 'Actions'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groupedResults.map((g, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-bold text-gray-800">{g.class} - {g.section}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-gray-700 font-medium">{g.exam_name}</p>
                      <p className="text-xs text-gray-400">{g.exam_type}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-orange-100 text-orange-800 font-bold px-2.5 py-1 rounded-lg text-xs">
                        {g.students.length} Students
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button onClick={() => { setModalGroup(g); setNote(''); }}
                        className="text-xs bg-blue-500 text-white px-4 py-1.5 rounded-lg hover:bg-blue-600 font-medium">
                        Review Class
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review modal */}
      <Modal isOpen={!!modalGroup} onClose={() => setModalGroup(null)} title={`Review Class Results`}>
        {modalGroup && (
          <div className="space-y-4">
            {/* Result summary */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm border border-gray-100">
              <div className="flex justify-between"><span className="text-gray-500">Class</span><span className="font-bold">{modalGroup.class} - {modalGroup.section}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Exam</span><span className="font-medium">{modalGroup.exam_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total Students</span><span className="font-semibold">{modalGroup.students.length}</span></div>
            </div>

            {/* Student breakdown */}
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-xl">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left py-2 px-3 text-gray-500 font-semibold uppercase">Student</th>
                    <th className="text-left py-2 px-3 text-gray-500 font-semibold uppercase">Marks</th>
                    <th className="text-left py-2 px-3 text-gray-500 font-semibold uppercase">Grade</th>
                    <th className="text-left py-2 px-3 text-gray-500 font-semibold uppercase">Entered By</th>
                  </tr>
                </thead>
                <tbody>
                  {modalGroup.students.map((res, i) => (
                    <tr key={res.id} className="border-b border-gray-50">
                      <td className="py-2 px-3">
                        <p className="font-medium">{res.student?.first_name} {res.student?.last_name}</p>
                      </td>
                      <td className="py-2 px-3">
                        {res.total_obtained}/{res.total_marks} ({res.percentage}%)
                      </td>
                      <td className="py-2 px-3">
                        <span className={`font-bold px-1.5 py-0.5 rounded ${getGradeBg(res.grade)}`}>{res.grade}</span>
                      </td>
                      <td className="py-2 px-3 text-gray-500">
                        {res.enteredByUser?.name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Notes (optional)</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500"
                placeholder="Add approval or rejection notes..." />
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => handleAction(modalGroup, 'approve')} disabled={acting}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
                {acting ? 'Processing...' : (isAdmin ? '✓ Declare Class Results' : '✓ Approve & Forward')}
              </button>
              <button onClick={() => handleAction(modalGroup, 'reject')} disabled={acting}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
                {acting ? 'Processing...' : '✗ Reject Class Results'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}