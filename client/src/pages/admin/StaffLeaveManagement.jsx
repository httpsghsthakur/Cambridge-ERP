import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function StaffLeaveManagement() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/staff-leaves/teacher/${id}`);
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load leave profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500 text-sm">Loading profile...</div>;
  }

  if (!data || !data.teacher) {
    return <div className="p-8 text-center text-gray-500 text-sm">Staff member not found.</div>;
  }

  const { teacher, leaves, summary } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link to="/admin/teacher-attendance" className="text-sm text-blue-500 hover:underline mb-2 inline-block">
          &larr; Back to Staff Attendance
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">{teacher.name}'s Leave Profile</h1>
        <p className="text-gray-500 text-sm">ID: {teacher.teacher_id}</p>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Leaves Available</p>
          <p className="text-3xl font-extrabold text-gray-800">{summary.total_available}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Leaves Taken</p>
          <p className="text-3xl font-extrabold text-blue-600">{summary.taken}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Remaining Balance</p>
          <p className={`text-3xl font-extrabold ${summary.balance < 5 ? 'text-red-500' : 'text-green-500'}`}>
            {summary.balance}
          </p>
        </div>
      </div>

      {/* Historical Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-base font-bold text-gray-800">Leave History</h3>
        </div>
        
        {leaves.length === 0 ? (
          <p className="text-center py-10 text-gray-400 text-sm">No leave applications found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Date Applied</th>
                  <th className="py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Leave Type</th>
                  <th className="py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {leaves.map((leave) => {
                  const isPending = leave.status === 'pending';
                  const isApproved = leave.status === 'approved';
                  const isRejected = leave.status === 'rejected';

                  return (
                    <tr key={leave.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-5 text-gray-500 whitespace-nowrap">{formatDate(leave.created_at)}</td>
                      <td className="py-4 px-5 font-medium text-gray-800 whitespace-nowrap">{leave.leave_type}</td>
                      <td className="py-4 px-5 text-gray-600 whitespace-nowrap">
                        {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
                      </td>
                      <td className="py-4 px-5 text-gray-600 max-w-xs truncate" title={leave.reason}>
                        {leave.reason}
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                          ${isPending ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${isApproved ? 'bg-green-100 text-green-800' : ''}
                          ${isRejected ? 'bg-red-100 text-red-800' : ''}
                        `}>
                          {leave.status}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-gray-500 italic max-w-xs truncate" title={leave.admin_remarks}>
                        {leave.admin_remarks || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
