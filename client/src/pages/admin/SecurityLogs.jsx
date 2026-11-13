import { useState, useEffect } from 'react';
import API from '../../utils/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';

export default function SecurityLogs() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterSeverity, setFilterSeverity] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const [logsRes, statsRes] = await Promise.all([
        API.get(`/security-logs?page=${page}&limit=50${filterSeverity ? `&severity=${filterSeverity}` : ''}`),
        API.get('/security-logs/stats')
      ]);
      setLogs(logsRes.data.logs);
      setTotalPages(logsRes.data.pages);
      setStats(statsRes.data);
    } catch (err) {
      toast.error('Failed to load security logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, filterSeverity]);

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'red': return 'bg-red-100 text-red-800 border-red-200';
      case 'yellow': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'green': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Security Command Center</h2>
        <p className="text-gray-500 text-sm mt-1">Active threat detection and prevention logs.</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['red', 'yellow', 'green', 'all'].map(s => {
          let count = 0;
          if (s === 'all') {
            count = stats.reduce((acc, curr) => acc + parseInt(curr.count), 0);
          } else {
            const stat = stats.find(x => x.severity === s);
            if (stat) count = stat.count;
          }
          
          return (
            <div key={s} 
                 onClick={() => { setFilterSeverity(s === 'all' ? '' : s); setPage(1); }}
                 className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                   filterSeverity === s || (s === 'all' && filterSeverity === '') 
                   ? 'ring-2 ring-blue-500 ring-offset-2' 
                   : ''
                 } ${s === 'red' ? 'bg-red-50 border-red-100' : s === 'yellow' ? 'bg-yellow-50 border-yellow-100' : s === 'green' ? 'bg-green-50 border-green-100' : 'bg-white'}`}>
              <p className="text-sm font-medium text-gray-500 uppercase">{s} Alerts</p>
              <p className={`text-3xl font-bold mt-2 ${s === 'red' ? 'text-red-600' : s === 'yellow' ? 'text-yellow-600' : s === 'green' ? 'text-green-600' : 'text-gray-700'}`}>{count}</p>
            </div>
          );
        })}
      </div>

      {/* Log Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Time</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Severity</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Threat Type</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">What Happened</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">IP & Endpoint</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-10 text-center text-gray-400">Scanning for threats...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-gray-400">No security events found.</td></tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                      {format(new Date(log.created_at), 'MMM d, HH:mm:ss')}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-full border ${getSeverityColor(log.severity)}`}>
                        {log.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-700">{log.threat_type}</td>
                    <td className="py-3 px-4 text-gray-600 max-w-xs truncate" title={log.what_happened}>
                      {log.what_happened}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <p className="text-gray-800 font-mono">{log.ip_address}</p>
                      <p className="text-gray-400 truncate max-w-[150px]" title={log.endpoint}>{log.endpoint}</p>
                    </td>
                    <td className="py-3 px-4">
                      <button onClick={() => setSelectedLog(log)}
                        className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 font-medium transition-colors">
                        Investigate
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex justify-between items-center bg-gray-50">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 border rounded-lg bg-white disabled:opacity-50 text-sm font-medium hover:bg-gray-50">
              Previous
            </button>
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 border rounded-lg bg-white disabled:opacity-50 text-sm font-medium hover:bg-gray-50">
              Next
            </button>
          </div>
        )}
      </div>

      {/* Investigation Modal */}
      <Modal isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} title="Threat Investigation Report">
        {selectedLog && (
          <div className="space-y-6">
            <div className={`p-4 rounded-xl border ${getSeverityColor(selectedLog.severity)} flex items-center justify-between`}>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Threat Classification</p>
                <p className="text-lg font-bold">{selectedLog.threat_type}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Severity Level</p>
                <p className="text-2xl font-black uppercase">{selectedLog.severity}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">What Happened</h4>
                <p className="text-sm text-gray-800">{selectedLog.what_happened}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                <h4 className="text-xs font-bold text-red-600 uppercase mb-2">Potential Impact</h4>
                <p className="text-sm text-red-900">{selectedLog.what_could_happen}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div><p className="text-gray-500 text-xs">Target Endpoint</p><p className="font-mono mt-1 text-xs break-all">{selectedLog.endpoint}</p></div>
              <div><p className="text-gray-500 text-xs">Attacker IP</p><p className="font-mono mt-1">{selectedLog.ip_address}</p></div>
              <div><p className="text-gray-500 text-xs">Timestamp</p><p className="mt-1">{format(new Date(selectedLog.created_at), 'PPpp')}</p></div>
              <div><p className="text-gray-500 text-xs">Authenticated User ID</p><p className="mt-1">{selectedLog.user_id || 'Unauthenticated'}</p></div>
            </div>
            
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center">
                Intercepted Payload 
                <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-[10px]">EVIDENCE</span>
              </h4>
              <div className="bg-gray-900 text-green-400 p-4 rounded-xl overflow-x-auto text-xs font-mono shadow-inner">
                <pre>{JSON.stringify(selectedLog.payload, null, 2)}</pre>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
