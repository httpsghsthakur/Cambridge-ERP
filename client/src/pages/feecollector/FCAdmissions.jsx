import { useState, useEffect } from 'react';
import API from '../../utils/api';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import Avatar from '../../components/common/Avatar';
import toast from 'react-hot-toast';

const statusColor = {
  pending:      'bg-yellow-100 text-yellow-700',
  under_review: 'bg-blue-100 text-blue-700',
  approved:     'bg-green-100 text-green-700',
  rejected:     'bg-red-100 text-red-700',
};

import StudentFeeWidget from '../../components/common/StudentFeeWidget';

export default function FCAdmissions() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewing, setViewing] = useState(null);

  const load = () => {
    setLoading(true);
    const q = filter ? `?status=${filter}` : '';
    API.get(`/fc/admission-requests${q}`)
      .then(r => setRequests(r.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const handleAction = async (id, status) => {
    const notes = status === 'rejected'
      ? prompt('Reason for rejection:')
      : 'Approved by admin.';
    if (status === 'rejected' && !notes) return;
    try {
      const idStr = String(id);
      if (idStr.startsWith('student-')) {
        const studentId = idStr.replace('student-', '');
        await API.put(`/students/${studentId}/approval`, { status, rejection_reason: notes });
      } else {
        await API.put(`/fc/admission-requests/${id}`, { status, review_notes: notes });
      }
      toast.success(`Request ${status}!`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Admissions & Approvals</h2>
          <p className="text-gray-400 text-sm">{requests.length} total requests</p>
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white w-full sm:w-auto">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <p className="text-center py-10 text-gray-400 text-sm">Loading...</p>
        ) : requests.length === 0 ? (
          <p className="text-center py-10 text-gray-400 text-sm">No admission requests found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 600 }}>
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Student', 'Class', 'Parent', 'Phone', 'Submitted', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium whitespace-nowrap">{r.first_name} {r.last_name}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{r.applying_class}</td>
                    <td className="py-3 px-4 text-gray-600 text-xs">{r.parent_name}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{r.parent_phone}</td>
                    <td className="py-3 px-4 text-gray-400 text-xs whitespace-nowrap">{formatDate(r.created_at || r.createdAt)}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[r.status]}`}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <button onClick={() => { setViewing(r); setShowViewModal(true); }}
                          className="text-xs text-indigo-500 hover:text-indigo-700 font-medium">
                          Review
                        </button>
                        {r.status === 'pending' && (user?.role === 'admin' || user?.role === 'admin2') && (
                          <div className="flex gap-2">
                            <button onClick={() => handleAction(r.id, 'approved')}
                              className="text-xs bg-green-500 text-white px-2.5 py-1 rounded-lg hover:bg-green-600">
                              Approve
                            </button>
                            <button onClick={() => handleAction(r.id, 'rejected')}
                              className="text-xs bg-red-500 text-white px-2.5 py-1 rounded-lg hover:bg-red-600">
                              Reject
                            </button>
                          </div>
                        )}
                        {r.status === 'approved' && (
                          <span className="text-xs text-green-600 font-medium">✓ Created</span>
                        )}
                        {(r.status === 'rejected') && (
                          <span className="text-xs text-red-500" title={r.review_notes}>Rejected</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={showViewModal}
        onClose={() => { setShowViewModal(false); setViewing(null); }}
        title="Admission Request Details"
      >
        {viewing && (
          <div className="space-y-4 text-sm text-gray-700">
            <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
              <Avatar name={`${viewing.first_name} ${viewing.last_name}`} size="lg" />
              <div>
                <h3 className="text-lg font-bold text-gray-900">{viewing.first_name} {viewing.last_name}</h3>
                <p className="text-gray-500 font-mono text-xs">{formatDate(viewing.created_at || viewing.createdAt)}</p>
                <span className={`mt-1 inline-block text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${statusColor[viewing.status] || 'bg-gray-100 text-gray-600'}`}>
                  {viewing.status.replace('_', ' ')}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Applying For</p>
                <p className="font-semibold">{viewing.applying_class}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Previous School</p>
                <p className="font-semibold">{viewing.previous_school || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Gender</p>
                <p className="font-semibold">{viewing.gender || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Date of Birth</p>
                <p className="font-semibold">{viewing.date_of_birth ? new Date(viewing.date_of_birth).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 mt-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Parent Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Name</p>
                  <p className="font-semibold">{viewing.parent_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Phone</p>
                  <p className="font-semibold">{viewing.parent_phone || 'N/A'}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Email</p>
                  <p className="font-semibold">{viewing.parent_email || 'N/A'}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Address</p>
                  <p className="font-semibold">{viewing.parent_address || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 mt-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Fee Status & Details</h4>
              {viewing.student_id_created ? (
                <StudentFeeWidget studentId={viewing.student_id_created} />
              ) : (
                <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 space-y-2">
                  <p className="text-xs text-yellow-700">
                    This is a new public admission request. A full student fee account will be generated upon approval.
                  </p>
                  <div className="flex justify-between items-center bg-white p-2 rounded border border-yellow-100">
                    <span className="text-sm text-gray-600 font-medium">Admission Fee Paid</span>
                    <span className={`font-bold ${viewing.admission_fee_paid > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {formatCurrency(viewing.admission_fee_paid || 0)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {viewing.review_notes && (
              <div className="border-t border-gray-100 pt-4 mt-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Review Notes</h4>
                <p className="text-sm italic text-gray-600">{viewing.review_notes}</p>
              </div>
            )}
            {viewing.remarks && (
              <div className="border-t border-gray-100 pt-4 mt-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Remarks (On Submission)</h4>
                <p className="text-sm italic text-gray-600">{viewing.remarks}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}