import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../utils/api';
import { attendanceBg, formatDate, formatDateInput, todayInput } from '../../utils/helpers';
import { can } from '../../utils/roleUtils';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'leave', label: 'Leave' },
  { value: 'half_day', label: 'Half Day' },
];

export default function TeacherAttendanceManager() {
  const { user } = useAuth();
  const allowed = can(user, 'MANAGE_TEACHER_ATTENDANCE');

  const [date, setDate] = useState(todayInput());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year] = useState(new Date().getFullYear());
  const [teachers, setTeachers] = useState([]);
  const [records, setRecords] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedLeave, setExpandedLeave] = useState(null);

  const monthlySummary = useMemo(() => {
    const summary = {};
    records.forEach((record) => {
      if (!summary[record.teacher_id]) {
        summary[record.teacher_id] = { present: 0, absent: 0, leave: 0, half_day: 0, holiday: 0, total: 0 };
      }
      summary[record.teacher_id][record.status] = (summary[record.teacher_id][record.status] || 0) + 1;
      if (record.status !== 'holiday') summary[record.teacher_id].total += 1;
    });
    return summary;
  }, [records]);

  const load = async () => {
    setLoading(true);
    try {
      const [teachersRes, attendanceRes, leavesRes] = await Promise.all([
        API.get('/teachers'),
        API.get(`/teacher-attendance?month=${month}&year=${year}`),
        API.get('/staff-leaves')
      ]);

      const teacherList = (teachersRes.data || []).filter((t) => t.status !== 'inactive');
      const attendanceRecords = attendanceRes.data || [];
      const nextMap = {};

      teacherList.forEach((t) => {
        nextMap[t.id] = 'present';
      });

      const allLeaves = leavesRes.data || [];
      const pendingLeavesData = allLeaves.filter(l => l.status === 'pending');
      setPendingLeaves(pendingLeavesData);

      allLeaves.filter(l => l.status === 'approved').forEach(l => {
        const s = new Date(l.start_date);
        const e = new Date(l.end_date);
        const d = new Date(date);
        s.setHours(0,0,0,0); e.setHours(0,0,0,0); d.setHours(0,0,0,0);
        if (d >= s && d <= e) {
          nextMap[l.teacher_id] = 'leave';
        }
      });

      attendanceRecords
        .filter((record) => formatDateInput(record.date) === date)
        .forEach((record) => {
          nextMap[record.teacher_id] = record.status;
        });

      setTeachers(teacherList);
      setRecords(attendanceRecords);
      setAttendanceMap(nextMap);
      setExpandedLeave(null);
    } catch (err) {
      toast.error('Failed to load staff attendance.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (allowed) load(); }, [allowed, date, month, year]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = teachers.map((teacher) => ({
        teacher_id: teacher.id,
        status: attendanceMap[teacher.id] || 'present',
      }));
      await API.post('/teacher-attendance/bulk', { date, records: payload });
      toast.success('Staff attendance saved.');
      await load();
    } catch (err) {
      toast.error('Failed to save staff attendance.');
    } finally {
      setSaving(false);
    }
  };

  const handleLeaveAction = async (leaveId, status) => {
    const notes = prompt(`Reason for ${status === 'approved' ? 'Approval' : 'Rejection'} (Optional):`);
    if (status === 'rejected' && notes === null) return; 
    try {
      await API.put(`/staff-leaves/${leaveId}/status`, { status, admin_remarks: notes || '' });
      toast.success(`Leave request ${status}.`);
      load();
    } catch (err) {
      toast.error('Failed to update leave request.');
    }
  };

  const getPendingLeave = (teacherId) => {
    return pendingLeaves.find(l => 
      l.teacher_id === teacherId && 
      new Date(l.start_date) <= new Date(date) && 
      new Date(l.end_date) >= new Date(date)
    );
  };

  if (!allowed) {
    return <div className="p-6 text-sm text-gray-500">Access denied.</div>;
  }

  const fieldClass = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 bg-white';

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Attendance Date</label>
            <input type="date" value={date} max={todayInput()} onChange={e => setDate(e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Summary Month</label>
            <select value={month} onChange={e => setMonth(parseInt(e.target.value, 10))} className={fieldClass}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((v) => (
                <option key={v} value={v}>{new Date(year, v - 1, 1).toLocaleDateString('en-IN', { month: 'long' })}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
            <input value={year} readOnly className={`${fieldClass} bg-gray-50 text-gray-500`} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="bg-gray-100 text-gray-600 rounded-lg px-3 py-1 text-xs font-medium">{teachers.length} staff</span>
          <span className="bg-blue-100 text-blue-700 rounded-lg px-3 py-1 text-xs font-medium">Date: {formatDate(date)}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-semibold text-gray-700">Staff Attendance</h3>
            <p className="text-xs text-gray-400 mt-0.5">Mark daily attendance and review monthly totals.</p>
          </div>
          <button onClick={handleSave} disabled={saving || loading || teachers.length === 0}
            className="bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>

        {loading ? (
          <p className="text-center py-10 text-gray-400 text-sm">Loading staff...</p>
        ) : teachers.length === 0 ? (
          <p className="text-center py-10 text-gray-400 text-sm">No staff found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: '920px' }}>
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Staff', 'Subject', 'Today', 'Present', 'Absent', 'Leave', 'Half Day', 'Attendance %'].map((heading) => (
                    <th key={heading} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => {
                  const stats = monthlySummary[teacher.id] || { present: 0, absent: 0, leave: 0, half_day: 0, total: 0 };
                  const percentage = stats.total > 0 ? Math.round(((stats.present + stats.half_day) / stats.total) * 100) : 0;
                  const selectedStatus = attendanceMap[teacher.id] || 'present';
                  const pendingLeave = getPendingLeave(teacher.id);

                  return (
                    <React.Fragment key={teacher.id}>
                      <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div>
                            <Link to={`/admin/staff-attendance/${teacher.id}/leaves`} className="font-medium text-blue-600 hover:underline">{teacher.name}</Link>
                            <p className="text-xs text-gray-400">{teacher.teacher_id}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 whitespace-nowrap">{teacher.subject}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-2">
                            <select
                              value={selectedStatus}
                              onChange={(e) => setAttendanceMap((prev) => ({ ...prev, [teacher.id]: e.target.value }))}
                              className={`border border-gray-200 rounded-lg px-3 py-2 text-sm min-w-[130px] ${attendanceBg[selectedStatus] || 'bg-white text-gray-700'}`}
                            >
                              {STATUS_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                            {pendingLeave && (
                              <button onClick={() => setExpandedLeave(expandedLeave === teacher.id ? null : teacher.id)}
                                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold text-left underline flex items-center gap-1">
                                View Leave Application {expandedLeave === teacher.id ? '▲' : '▼'}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-700">{stats.present}</td>
                        <td className="py-3 px-4 text-gray-700">{stats.absent}</td>
                        <td className="py-3 px-4 text-gray-700">{stats.leave}</td>
                        <td className="py-3 px-4 text-gray-700">{stats.half_day}</td>
                        <td className="py-3 px-4">
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">{percentage}%</span>
                        </td>
                      </tr>
                      {expandedLeave === teacher.id && pendingLeave && (
                        <tr className="bg-indigo-50/30">
                          <td colSpan={8} className="p-4 border-b border-gray-100 shadow-inner">
                            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center ml-2">
                              <div>
                                <h4 className="text-sm font-bold text-gray-800">{pendingLeave.leave_type}</h4>
                                <p className="text-xs text-gray-500 mt-1">From {formatDate(pendingLeave.start_date)} to {formatDate(pendingLeave.end_date)}</p>
                                <p className="text-sm text-gray-700 mt-2 italic border-l-2 border-indigo-200 pl-3">"{pendingLeave.reason}"</p>
                              </div>
                              <div className="flex gap-2 mr-2">
                                <button onClick={() => handleLeaveAction(pendingLeave.id, 'approved')} className="text-xs font-bold px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
                                  ✔️ Approve
                                </button>
                                <button onClick={() => handleLeaveAction(pendingLeave.id, 'rejected')} className="text-xs font-bold px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors">
                                  ❌ Reject
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
