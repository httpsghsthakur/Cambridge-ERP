import React, { useState, useEffect } from 'react';
import API from '../../utils/api';
import toast from 'react-hot-toast';

export default function CentralIntegration() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [copied, setCopied] = useState(false);
  const [pairingTokenInput, setPairingTokenInput] = useState('');
  const [diagnostics, setDiagnostics] = useState(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await API.get('/central/status');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to fetch Central Integration status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleCopySchoolId = () => {
    if (!data?.config?.school_id) return;
    navigator.clipboard.writeText(data.config.school_id);
    setCopied(true);
    toast.success('School ID copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRegister = async () => {
    try {
      setActionLoading('register');
      const res = await API.post('/central/register');
      if (res.data.success) {
        toast.success(res.data.message || 'School registered successfully!');
        await fetchStatus();
      } else {
        toast.error(res.data.error || 'Registration failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration request failed');
    } finally {
      setActionLoading('');
    }
  };

  const handlePair = async () => {
    try {
      setActionLoading('pair');
      const res = await API.post('/central/pair', { token: pairingTokenInput || undefined });
      if (res.data.success) {
        toast.success('School successfully paired and verified!');
        setPairingTokenInput('');
        await fetchStatus();
      } else {
        toast.error(res.data.error || 'Pairing verification failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Pairing request failed');
    } finally {
      setActionLoading('');
    }
  };

  const handleSyncNow = async () => {
    try {
      setActionLoading('sync');
      const res = await API.post('/central/sync');
      if (res.data.success) {
        toast.success(`Sync complete! ${res.data.records_synced || 0} records synchronized.`);
        await fetchStatus();
      } else {
        toast.error(res.data.error || 'Sync failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Sync request failed');
    } finally {
      setActionLoading('');
    }
  };

  const handleHeartbeat = async () => {
    try {
      setActionLoading('heartbeat');
      const res = await API.post('/central/heartbeat');
      if (res.data.success) {
        toast.success('Heartbeat ping acknowledged by Central Platform');
        await fetchStatus();
      } else {
        toast.error(res.data.error || 'Heartbeat failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Heartbeat request failed');
    } finally {
      setActionLoading('');
    }
  };

  const handleDiagnostics = async () => {
    try {
      setActionLoading('diagnostics');
      const res = await API.get('/central/diagnostics');
      if (res.data.success) {
        setDiagnostics(res.data);
        toast.success('Diagnostic checks completed successfully');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Diagnostics check failed');
    } finally {
      setActionLoading('');
    }
  };

  const handleReconnect = async () => {
    if (!window.confirm('Are you sure you want to re-authenticate with the Central Platform? Your permanent School ID will remain unchanged.')) {
      return;
    }
    try {
      setActionLoading('reconnect');
      const res = await API.post('/central/reconnect');
      if (res.data.success) {
        toast.success('Reconnection challenge initiated. School ID preserved.');
        await fetchStatus();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Reconnection failed');
    } finally {
      setActionLoading('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 font-medium">Loading Central Management status...</p>
        </div>
      </div>
    );
  }

  const config = data?.config || {};
  const statusColors = {
    connected: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    awaiting_pairing: 'bg-amber-100 text-amber-800 border-amber-300',
    not_registered: 'bg-gray-100 text-gray-800 border-gray-300',
    suspended: 'bg-rose-100 text-rose-800 border-rose-300',
    connection_error: 'bg-red-100 text-red-800 border-red-300',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Title & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Central Platform Integration</h1>
          <p className="text-sm text-gray-600 mt-1">
            Connect this School ERP to our centralized management dashboard for telemetry, updates, and monitoring.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchStatus}
            disabled={!!actionLoading}
            className="px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm"
          >
            Refresh
          </button>
          <button
            onClick={handleDiagnostics}
            disabled={!!actionLoading}
            className="px-3.5 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition shadow-sm"
          >
            {actionLoading === 'diagnostics' ? 'Checking...' : 'Run Diagnostics'}
          </button>
        </div>
      </div>

      {/* Suspension Alert Banner */}
      {config.is_suspended && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-lg shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0 text-rose-500 text-xl font-bold mr-3">⚠️</div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-rose-800">ERP Service Temporarily Suspended</h3>
              <p className="text-sm text-rose-700 mt-1">
                {config.suspension_reason || 'This school management service is temporarily inactive. Please contact the platform administrator.'}
              </p>
              <p className="text-xs text-rose-600 mt-2 font-medium">
                Note: All school academic, student, teacher, and attendance records remain 100% safe, untouched, and preserved.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Primary Status Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
              ID
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Permanent School ID</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xl font-mono font-bold text-gray-900">
                  {config.school_id || 'NOT REGISTERED'}
                </span>
                {config.school_id && (
                  <button
                    onClick={handleCopySchoolId}
                    className="px-2.5 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                  >
                    {copied ? '✓ Copied' : 'Copy School ID'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full border capitalize ${
                statusColors[config.connection_status] || 'bg-gray-100 text-gray-800 border-gray-300'
              }`}
            >
              {config.connection_status?.replace('_', ' ') || 'Unknown'}
            </span>
          </div>
        </div>

        {/* Connection Details Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-gray-50/50">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase">Connector Client ID</span>
            <p className="text-xs font-mono text-gray-800 mt-1 truncate" title={config.connector_client_id}>
              {config.connector_client_id || 'N/A'}
            </p>
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase">Last Heartbeat</span>
            <p className="text-sm font-medium text-gray-800 mt-1">
              {config.last_heartbeat_at ? new Date(config.last_heartbeat_at).toLocaleString() : 'Never'}
            </p>
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase">Last Operational Sync</span>
            <p className="text-sm font-medium text-gray-800 mt-1">
              {config.last_sync_at ? new Date(config.last_sync_at).toLocaleString() : 'Never'}
            </p>
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase">Connector / ERP Version</span>
            <p className="text-sm font-medium text-gray-800 mt-1">
              v{config.connector_version} / v{config.erp_version}
            </p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="p-6 border-t border-gray-100 flex flex-wrap items-center gap-3">
          {(!config.school_id || config.connection_status === 'not_registered') && (
            <button
              onClick={handleRegister}
              disabled={!!actionLoading}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition shadow-sm"
            >
              {actionLoading === 'register' ? 'Registering...' : 'Register School with Central Platform'}
            </button>
          )}

          {config.connection_status === 'awaiting_pairing' && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Paste Pairing Token (if manual)"
                value={pairingTokenInput}
                onChange={(e) => setPairingTokenInput(e.target.value)}
                className="px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                onClick={handlePair}
                disabled={!!actionLoading}
                className="px-4 py-2 text-sm font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition shadow-sm"
              >
                {actionLoading === 'pair' ? 'Verifying...' : 'Complete Pairing Challenge'}
              </button>
            </div>
          )}

          {config.connection_status === 'connected' && (
            <>
              <button
                onClick={handleSyncNow}
                disabled={!!actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition shadow-sm"
              >
                {actionLoading === 'sync' ? 'Syncing...' : 'Sync Now'}
              </button>
              <button
                onClick={handleHeartbeat}
                disabled={!!actionLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm"
              >
                {actionLoading === 'heartbeat' ? 'Pinging...' : 'Send Heartbeat'}
              </button>
            </>
          )}

          <button
            onClick={handleReconnect}
            disabled={!!actionLoading}
            className="px-3.5 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition ml-auto"
          >
            {actionLoading === 'reconnect' ? 'Re-authenticating...' : 'Re-authenticate Connector'}
          </button>
        </div>
      </div>

      {/* Non-Financial Privacy Guarantee Banner */}
      <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-5 flex items-start gap-4">
        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">
          🛡️
        </div>
        <div>
          <h4 className="text-sm font-bold text-indigo-950">Strict Non-Financial Privacy Policy Enforced</h4>
          <p className="text-xs text-indigo-800 mt-1 leading-relaxed">
            By system architectural contract, this connector <strong>NEVER</strong> accesses, reads, collects, or synchronizes any school financial data. Student fees, fee structures, receipts, bank accounts, expenses, and staff payroll are cryptographically and programmatically excluded across all layers.
          </p>
        </div>
      </div>

      {/* Diagnostics Panel (if triggered) */}
      {diagnostics && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">System Diagnostics Results</h3>
            <span className="text-xs text-gray-500">{new Date(diagnostics.timestamp).toLocaleTimeString()}</span>
          </div>
          <div className="space-y-3">
            {diagnostics.diagnostics.map((chk, i) => (
              <div key={i} className="flex items-start justify-between p-3 rounded-lg border border-gray-100 bg-gray-50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={chk.passed ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                      {chk.passed ? '✓' : '✗'}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">{chk.name}</span>
                  </div>
                  <pre className="text-xs text-gray-600 mt-1 font-mono">
                    {typeof chk.details === 'object' ? JSON.stringify(chk.details, null, 2) : chk.details}
                  </pre>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${chk.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {chk.passed ? 'PASSED' : 'FAILED'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subscription & Permissions Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Commercial Subscription (ERP service only) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h3 className="text-base font-bold text-gray-900">Commercial ERP Subscription</h3>
          <p className="text-xs text-gray-500">
            Managed centrally by the platform for this school's software license.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <div>
              <span className="text-xs text-gray-500 font-medium">Subscription Plan</span>
              <p className="text-sm font-bold text-gray-900 capitalize mt-0.5">{config.subscription_plan || 'Standard'}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 font-medium">Plan Status</span>
              <p className="text-sm font-bold text-emerald-600 capitalize mt-0.5">{config.subscription_status || 'Active'}</p>
            </div>
            <div className="col-span-2">
              <span className="text-xs text-gray-500 font-medium">Subscription Expiry Date</span>
              <p className="text-sm font-medium text-gray-900 mt-0.5">
                {config.subscription_expires_at ? new Date(config.subscription_expires_at).toLocaleDateString() : 'Active (Continuous)'}
              </p>
            </div>
          </div>
        </div>

        {/* Approved Permissions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h3 className="text-base font-bold text-gray-900">Approved Platform Entitlements</h3>
          <p className="text-xs text-gray-500">
            Automatically provisioned during verified pairing.
          </p>
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
            {config.approved_permissions?.length > 0 ? (
              config.approved_permissions.map((perm, idx) => (
                <span key={idx} className="px-2.5 py-1 text-xs font-mono font-medium bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200">
                  {perm}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-400">No permissions provisioned yet</span>
            )}
          </div>
        </div>
      </div>

      {/* Sync Logs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">Recent Operational Synchronizations</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs font-semibold uppercase">
              <tr>
                <th className="px-6 py-3 text-left">Started At</th>
                <th className="px-6 py-3 text-left">Type</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Records</th>
                <th className="px-6 py-3 text-left">Duration</th>
                <th className="px-6 py-3 text-left">Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {data?.recentSyncs?.length > 0 ? (
                data.recentSyncs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-gray-600 font-mono text-xs">
                      {new Date(log.started_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-gray-800 capitalize font-medium">{log.sync_type}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                        log.status === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-700">{log.records_synced || 0}</td>
                    <td className="px-6 py-3 text-gray-500 text-xs">{log.duration_ms ? `${log.duration_ms}ms` : '-'}</td>
                    <td className="px-6 py-3 text-gray-500 text-xs font-mono truncate max-w-xs" title={log.payload_summary}>
                      {log.payload_summary || '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-400">
                    No synchronization logs recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Central Command Audit Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">Auditable Remote Management Logs</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs font-semibold uppercase">
              <tr>
                <th className="px-6 py-3 text-left">Command ID</th>
                <th className="px-6 py-3 text-left">Command Type</th>
                <th className="px-6 py-3 text-left">Issued By</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Executed At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {data?.recentCommands?.length > 0 ? (
                data.recentCommands.map((cmd) => (
                  <tr key={cmd.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-mono text-xs text-gray-600">{cmd.command_id}</td>
                    <td className="px-6 py-3 font-mono text-xs font-bold text-indigo-700">{cmd.command_type}</td>
                    <td className="px-6 py-3 text-gray-600 text-xs">{cmd.issued_by}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                        cmd.status === 'executed' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {cmd.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-500 text-xs">
                      {cmd.executed_at ? new Date(cmd.executed_at).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                    No remote commands logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
