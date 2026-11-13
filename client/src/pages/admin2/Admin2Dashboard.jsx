import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';
import StatCard from '../../components/common/StatCard';
import toast from 'react-hot-toast';

export default function Admin2Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingResults, setPendingResults] = useState([]);
  const [pendingAdmissions, setPendingAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/results/pending-approval'),
      API.get('/fc/admission-requests?status=pending'),
    ]).then(([r, a]) => {
      setPendingResults(r.data || []);
      setPendingAdmissions(a.data || []);
    }).catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const quickNav = [
    { icon: '', label: 'Approve Results',    path: '/admin2/results',    color: 'bg-blue-500',   count: pendingResults.length },
    { icon: '', label: 'Admission Requests', path: '/admin2/admissions', color: 'bg-purple-500', count: pendingAdmissions.length },
    { icon: '', label: 'Class Incharge',    path: '/admin2/incharge',   color: 'bg-green-500',  count: null },
    { icon: '', label: 'Teacher Attendance', path: '/admin2/teachers',   color: 'bg-orange-500', count: null },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-800">Welcome, {user?.name} </h2>
        <p className="text-gray-400 text-sm mt-0.5">Admin2 Panel — Review and approve pending actions</p>
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickNav.map(a => (
          <button key={a.path} onClick={() => navigate(a.path)}
            className={`${a.color} hover:opacity-90 active:scale-[0.98] text-white rounded-xl p-4 text-left transition-all relative`}>
            {a.count !== null && a.count > 0 && (
              <span className="absolute top-2 right-2 w-5 h-5 bg-white text-xs font-bold rounded-full flex items-center justify-center text-gray-800">
                {a.count}
              </span>
            )}
            <span className="text-2xl block mb-2">{a.icon}</span>
            <span className="text-xs sm:text-sm font-semibold">{a.label}</span>
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Pending Results"    value={loading ? '—' : pendingResults.length}    color="text-blue-600" icon="" />
        <StatCard label="Pending Admissions" value={loading ? '—' : pendingAdmissions.length} color="text-purple-600" icon="" />
        <StatCard label="My Role"            value="Admin 2" sub="Review & Approve"  />
        <StatCard label="Approval Level"     value="Level 2" sub="Before final admin" />
      </div>

      {/* Pending results preview */}
      {!loading && pendingResults.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex justify-between items-center px-4 sm:px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Pending Result Approvals</h3>
            <button onClick={() => navigate('/admin2/results')}
              className="text-xs text-blue-500 hover:text-blue-700 font-medium">View all →</button>
          </div>
          <div className="divide-y divide-gray-50">
            {pendingResults.slice(0, 4).map(r => (
              <div key={r.id} className="flex items-center justify-between px-4 sm:px-5 py-3.5">
                <div>
                  <p className="font-medium text-sm text-gray-800">{r.student?.first_name} {r.student?.last_name}</p>
                  <p className="text-xs text-gray-400">{r.exam_name} · {r.class} {r.section}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-700">{r.percentage}%</span>
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                    Awaiting Review
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}