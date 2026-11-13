import React, { useState, useEffect } from 'react';
import API from '../../utils/api';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

export default function LeaveManagement() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [staffType, setStaffType] = useState('');
  
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadLeaves();
  }, [search, status, staffType]);

  const loadLeaves = async () => {
    setLoading(true);
    try {
      const res = await API.get('/staff-leaves', {
        params: { name: search, status, staff_type: staffType }
      });
      setLeaves(res.data);
    } catch (err) {
      toast.error('Failed to load leave applications.');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, actionStatus, adminRemarks = '') => {
    setSaving(true);
    try {
      await API.put(`/staff-leaves/${id}/status`, { status: actionStatus, admin_remarks: adminRemarks });
      toast.success(`Leave ${actionStatus} successfully.`);
      if (actionStatus === 'rejected') setShowRejectModal(false);
      loadLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update leave status.');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { 
      key: 'teacher.name', label: 'Staff Member', 
      render: (val, row) => (
        <div>
          <p className="font-semibold text-gray-800">{row.teacher?.name}</p>
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">{row.teacher?.staff_type || 'Teacher'}</p>
        </div>
      )
    },
    { key: 'leave_type', label: 'Type' },
    { key: 'start_date', label: 'From' },
    { key: 'end_date', label: 'To' },
    { key: 'total_days', label: 'Days' },
    { 
      key: 'status', label: 'Status',
      render: val => (
        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
          val === 'approved' ? 'bg-green-100 text-green-700' :
          val === 'rejected' ? 'bg-red-100 text-red-700' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {val.toUpperCase()}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-800">Staff Leave Management</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
          placeholder="Search staff..."
          onChange={q => setSearch(q)}
          className="flex-1"
        />
        <select value={staffType} onChange={e => setStaffType(e.target.value)} className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none">
          <option value="">All Staff Types</option>
          <option value="Teacher">Teacher</option>
          <option value="Principal">Principal</option>
          <option value="Vice Principal">Vice Principal</option>
          <option value="Accountant">Accountant</option>
          <option value="Fee Collector">Fee Collector</option>
          <option value="Receptionist">Receptionist</option>
          <option value="Clerk">Clerk</option>
          <option value="Librarian">Librarian</option>
          <option value="Lab Assistant">Lab Assistant</option>
          <option value="Sports Teacher">Sports Teacher</option>
          <option value="Driver">Driver</option>
          <option value="Helper">Helper</option>
          <option value="Security Guard">Security Guard</option>
          <option value="Office Staff">Office Staff</option>
          <option value="Other">Other</option>
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <DataTable 
          columns={columns} 
          data={leaves} 
          loading={loading} 
          emptyText="No leave applications found."
          actions={(row) => (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setSelectedLeave(row)} 
                className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                View
              </button>
            </div>
          )}
        />
      </div>

      <Modal isOpen={!!selectedLeave} onClose={() => setSelectedLeave(null)} title="Leave Details">
        {selectedLeave && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs font-medium mb-1">Staff Name</p>
                <p className="font-semibold text-gray-800">{selectedLeave.teacher?.name}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-medium mb-1">Staff ID / Type</p>
                <p className="font-semibold text-gray-800">{selectedLeave.teacher?.teacher_id} • {selectedLeave.teacher?.staff_type || 'Teacher'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-medium mb-1">Leave Dates</p>
                <p className="font-semibold text-gray-800">{selectedLeave.start_date} to {selectedLeave.end_date}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-medium mb-1">Total Days / Type</p>
                <p className="font-semibold text-gray-800">{selectedLeave.total_days} Days • {selectedLeave.leave_type}</p>
              </div>
            </div>

            <div>
              <p className="text-gray-500 text-xs font-medium mb-1">Reason</p>
              <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-700 text-sm whitespace-pre-wrap">
                {selectedLeave.reason}
              </div>
            </div>

            {selectedLeave.attachment_url && (
              <div>
                <a href={process.env.REACT_APP_API_URL.replace('/api', '') + selectedLeave.attachment_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-blue-600 font-medium hover:underline">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                  View Attachment
                </a>
              </div>
            )}

            {selectedLeave.status === 'pending' && (
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button 
                  onClick={() => handleAction(selectedLeave.id, 'approved')}
                  disabled={saving}
                  className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors"
                >
                  Approve Leave
                </button>
                <button 
                  onClick={() => { setShowRejectModal(true); setSelectedLeave(selectedLeave); }}
                  disabled={saving}
                  className="flex-1 bg-red-50 hover:bg-red-100 disabled:opacity-60 text-red-600 font-semibold py-2.5 rounded-xl transition-colors"
                >
                  Reject...
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title="Reject Leave">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Rejection Reason (Required)</label>
            <textarea 
              value={remarks} 
              onChange={e => setRemarks(e.target.value)} 
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-500" 
              rows="3" 
              placeholder="Provide a reason for rejection..."
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowRejectModal(false)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50">Cancel</button>
            <button 
              onClick={() => {
                if (!remarks.trim()) { toast.error('Rejection reason is required.'); return; }
                handleAction(selectedLeave.id, 'rejected', remarks);
              }}
              disabled={saving}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl disabled:opacity-60"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
