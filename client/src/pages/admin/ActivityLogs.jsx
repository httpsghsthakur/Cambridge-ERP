import { useState, useEffect } from 'react';
import API from '../../utils/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import Modal from '../../components/common/Modal';

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    targetType: '',
    action: ''
  });
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);
  
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page,
        limit: 50,
        ...filters
      }).toString();
      
      const [logsRes, analyticsRes] = await Promise.all([
        API.get(`/logs?${query}`),
        API.get(`/logs/analytics?${query}`)
      ]);
      
      setLogs(logsRes.data.logs);
      setTotalPages(logsRes.data.pages);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      toast.error('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, filters.startDate, filters.endDate, filters.targetType, filters.action]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Activity Logs</h2>
        <p className="text-gray-500 text-sm mt-1">Monitor and audit every action performed across the system.</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Start Date</label>
          <input type="date" className="border rounded-lg px-3 py-2 text-sm outline-none"
            value={filters.startDate} onChange={e => {setFilters({...filters, startDate: e.target.value}); setPage(1)}} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">End Date</label>
          <input type="date" className="border rounded-lg px-3 py-2 text-sm outline-none"
            value={filters.endDate} onChange={e => {setFilters({...filters, endDate: e.target.value}); setPage(1)}} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Module</label>
          <select className="border rounded-lg px-3 py-2 text-sm outline-none"
            value={filters.targetType} onChange={e => {setFilters({...filters, targetType: e.target.value}); setPage(1)}}>
            <option value="">All Modules</option>
            <option value="auth">Authentication</option>
            <option value="student">Students</option>
            <option value="teacher">Teachers</option>
            <option value="fees">Fees</option>
            <option value="result">Results</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Search Action</label>
          <input type="text" placeholder="e.g. USER_LOGIN" className="border rounded-lg px-3 py-2 text-sm outline-none"
            value={filters.action} onChange={e => {setFilters({...filters, action: e.target.value}); setPage(1)}} />
        </div>
        <button onClick={() => { setFilters({startDate:'', endDate:'', targetType:'', action:''}); setPage(1); }}
          className="text-blue-500 text-sm hover:underline ml-2">
          Clear Filters
        </button>
      </div>

      {/* Analytics Charts */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Activity Volume (30 Days)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.byDate}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Actions by Module</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.byModule}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="target_type" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Log Stream Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Time</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">User</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Action</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Module</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">IP Address</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-10 text-center text-gray-400">Loading logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-gray-400">No activity logs found.</td></tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                      {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td className="py-3 px-4">
                      {log.user ? (
                        <div>
                          <p className="font-medium text-gray-800">{log.user.name}</p>
                          <p className="text-xs text-gray-400">{log.user.role}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">System / Anonymous</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-700">{log.action}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium uppercase">
                        {log.target_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{log.ip_address || '-'}</td>
                    <td className="py-3 px-4">
                      <button onClick={() => setSelectedLog(log)}
                        className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 font-medium transition-colors">
                        View JSON
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex justify-between items-center bg-gray-50">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 border rounded-lg bg-white disabled:opacity-50 text-sm font-medium">
              Previous
            </button>
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 border rounded-lg bg-white disabled:opacity-50 text-sm font-medium">
              Next
            </button>
          </div>
        )}
      </div>

      {/* JSON Payload Modal */}
      <Modal isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} title="Activity Payload Details">
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-xl">
              <div>
                <p className="text-gray-500 text-xs">Action</p>
                <p className="font-bold">{selectedLog.action}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Target ID</p>
                <p className="font-semibold">{selectedLog.target_id || 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500 text-xs">User Agent</p>
                <p className="text-xs text-gray-600 break-all">{selectedLog.user_agent}</p>
              </div>
            </div>
            
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Changed Values (JSON)</p>
              <div className="bg-gray-900 text-green-400 p-4 rounded-xl overflow-x-auto text-xs font-mono">
                <pre>{JSON.stringify(selectedLog.new_values, null, 2)}</pre>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
