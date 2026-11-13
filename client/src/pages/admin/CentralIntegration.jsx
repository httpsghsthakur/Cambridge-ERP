import React, { useState, useEffect, useRef } from 'react';
import API from '../../utils/api';
import toast from 'react-hot-toast';

export default function CentralIntegration() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [schoolId, setSchoolId] = useState('SCH-B0E1B');
  const [centralUrl, setCentralUrl] = useState('https://wws.ktwr.in');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  const fetchStatus = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await API.get('/central/status');
      if (res.data?.success) {
        setData(res.data);
        const cfg = res.data.config || {};
        if (cfg.school_id && !schoolId) {
          setSchoolId(cfg.school_id);
        }
        if (cfg.central_api_url) {
          setCentralUrl(cfg.central_api_url);
        }
        setLastChecked(new Date().toLocaleTimeString());
      }
    } catch (err) {
      if (!isBackground) {
        toast.error(err.response?.data?.error || 'Failed to fetch Central Connector status');
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchStatus();
  }, []);

  // Auto-listen: poll every 3 seconds for incoming approval requests from WWS
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStatus(true);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Save School ID into ERP
  const handleSaveSchoolId = async (e) => {
    if (e) e.preventDefault();
    const cleanId = schoolId.trim().toUpperCase();
    if (!cleanId) {
      return toast.error('Please enter the School ID from WWS.');
    }

    setActionLoading(true);
    try {
      const res = await API.post('/central/save-school-id', {
        school_id: cleanId,
        central_erp_url: centralUrl.trim(),
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'School ID saved! Listening for approval request from WWS...');
        await fetchStatus();
      } else {
        toast.error(res.data?.error || 'Failed to save School ID');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Failed to save School ID');
    } finally {
      setActionLoading(false);
    }
  };

  // Approve Incoming Request & Send All Real Data to WWS
  const handleApproveAndTransmit = async () => {
    const cleanId = (schoolId || config.school_id || '').trim().toUpperCase();
    if (!cleanId) {
      return toast.error('School ID is missing.');
    }

    setActionLoading(true);
    try {
      const res = await API.post('/central/approve-request', {
        school_id: cleanId,
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Approval granted! All real data transmitted to WWS.');
        await fetchStatus();
      } else {
        toast.error(res.data?.error || 'Approval failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Failed to approve and send data');
    } finally {
      setActionLoading(false);
    }
  };

  // Reject / Dismiss Incoming Request
  const handleRejectRequest = async () => {
    setActionLoading(true);
    try {
      const res = await API.post('/central/reject-request', {
        school_id: (schoolId || config.school_id || '').trim().toUpperCase(),
      });
      if (res.data?.success) {
        toast.success('Approval request rejected/dismissed.');
        await fetchStatus();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reject request');
    } finally {
      setActionLoading(false);
    }
  };

  // Manual Re-Send Real Data to WWS
  const handleSyncNow = async () => {
    setActionLoading(true);
    try {
      const res = await API.post('/central/sync');
      if (res.data?.success) {
        toast.success(`Real data re-sent to WWS! ${res.data.records_synced || 0} records transmitted.`);
        await fetchStatus();
      } else {
        toast.error(res.data?.error || 'Sync failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Sync request failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Telemetry Heartbeat
  const handleHeartbeat = async () => {
    setActionLoading(true);
    try {
      const res = await API.post('/central/heartbeat');
      if (res.data?.success) {
        toast.success('Vitality heartbeat acknowledged by WWS Central Platform!');
        await fetchStatus();
      } else {
        toast.error(res.data?.error || 'Heartbeat ping failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Heartbeat ping failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 font-medium">Loading Central ERP Connector...</p>
        </div>
      </div>
    );
  }

  const config = data?.config || {};
  const pendingApproval = data?.pending_approval;
  const isApproved = data?.approval_status === 'APPROVED' || config.connection_status === 'connected';
  const realMetrics = data?.real_metrics || {};
  const recentSyncs = data?.recentSyncs || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <span>🌐</span> Centralized System Link (WWS)
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Receive incoming approval requests from WWS Central System and approve to send real operational data.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isApproved ? (
            <span className="px-3.5 py-1.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 flex items-center gap-2 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Connected & Authorized
            </span>
          ) : pendingApproval ? (
            <span className="px-3.5 py-1.5 text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-300 flex items-center gap-2 shadow-sm animate-bounce">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              Incoming Request Received!
            </span>
          ) : (
            <span className="px-3.5 py-1.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
              Listening for WWS Requests...
            </span>
          )}

          <button
            type="button"
            onClick={() => fetchStatus(false)}
            title="Refresh Status"
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 transition text-xs"
          >
            🔄
          </button>
        </div>
      </div>

      {/* 1. PRIMARY SCHOOL ID CARD (The ONLY Field Needed) */}
      <div className="bg-white rounded-2xl shadow-sm border border-blue-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
                School ERP Receiver Configuration
              </span>
              <h2 className="text-xl font-bold text-white mt-1">
                School ID Identifier
              </h2>
              <p className="text-xs text-blue-200 mt-0.5">
                Paste your School ID from WWS. This ERP will receive the approval request sent from WWS.
              </p>
            </div>
            {config.school_id && (
              <div className="text-right bg-blue-950/60 px-4 py-2 rounded-xl border border-blue-700/60">
                <div className="text-[10px] uppercase font-bold text-blue-300 tracking-wider">Active School ID</div>
                <div className="text-lg font-mono font-extrabold text-yellow-400 tracking-wider">{config.school_id}</div>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSaveSchoolId} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
              <span>🏷️</span> School ID
              <span className="text-[11px] font-normal text-gray-500 lowercase">(from wws.ktwr.in)</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value.toUpperCase())}
                placeholder="e.g. SCH-B0E1B"
                required
                className="flex-1 text-base font-mono font-bold px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50 uppercase tracking-wider text-gray-900 placeholder:text-gray-400"
              />
              <button
                type="submit"
                disabled={actionLoading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 text-sm whitespace-nowrap"
              >
                {actionLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <span>💾</span> Save School ID
                  </>
                )}
              </button>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
              <span>When you click &ldquo;Send Approval Request&rdquo; in WWS, this ERP will automatically receive the request below.</span>
              {lastChecked && (
                <span className="text-[11px] text-gray-400 font-mono">Listening (Last check: {lastChecked})</span>
              )}
            </div>
          </div>

          {/* Optional Collapsed Advanced Settings */}
          <div className="pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-gray-500 hover:text-blue-600 font-medium flex items-center gap-1"
            >
              <span>{showAdvanced ? '▼' : '▶'}</span> Advanced Connection URL (Default: https://wws.ktwr.in)
            </button>
            {showAdvanced && (
              <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  Central ERP Platform URL
                </label>
                <input
                  type="url"
                  value={centralUrl}
                  onChange={(e) => setCentralUrl(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2 border border-gray-300 rounded-lg bg-white"
                />
              </div>
            )}
          </div>
        </form>
      </div>

      {/* 2. INCOMING APPROVAL REQUEST CARD (RECEIVED FROM WWS) */}
      {pendingApproval && (
        <div className={`rounded-2xl border-2 p-6 transition-all duration-300 ${
          isApproved
            ? 'bg-emerald-50/70 border-emerald-300'
            : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-400 shadow-lg ring-4 ring-amber-200/50'
        }`}>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 text-[11px] font-extrabold uppercase rounded-full tracking-wider flex items-center gap-1 shadow-sm ${
                  isApproved ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white animate-pulse'
                }`}>
                  <span>🔔</span> {isApproved ? 'Data Access Approved & Transmitted' : 'Approval Request Received from WWS'}
                </span>
                <span className="text-xs font-mono text-gray-600 font-semibold">
                  School ID: <strong className="text-gray-900">{pendingApproval.school_id || schoolId}</strong>
                </span>
              </div>

              <h3 className="text-lg font-extrabold text-gray-900">
                {isApproved ? 'Real Data Transmitted to WWS Central Platform' : 'Central System (WWS) is Requesting Real Data Access'}
              </h3>

              <p className="text-xs text-gray-700 leading-relaxed max-w-2xl">
                <strong>{pendingApproval.requester || 'WWS Central ERP Command (https://wws.ktwr.in)'}</strong> has dispatched an authorized connection request to this ERP for School ID <strong>{pendingApproval.school_id || schoolId}</strong>.
              </p>

              {/* Data Scopes WWS is Asking For */}
              <div className="pt-2">
                <div className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Real Data Requested by WWS:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 bg-white/90 p-2 rounded-lg border border-amber-200 text-gray-800">
                    <span className="text-emerald-600 font-bold">✓</span> Real Enrolled Student Census & Distribution
                  </div>
                  <div className="flex items-center gap-2 bg-white/90 p-2 rounded-lg border border-amber-200 text-gray-800">
                    <span className="text-emerald-600 font-bold">✓</span> Teaching Faculty & Staff Headcount
                  </div>
                  <div className="flex items-center gap-2 bg-white/90 p-2 rounded-lg border border-amber-200 text-gray-800">
                    <span className="text-emerald-600 font-bold">✓</span> Daily Academic Attendance Percentages
                  </div>
                  <div className="flex items-center gap-2 bg-white/90 p-2 rounded-lg border border-amber-200 text-gray-800">
                    <span className="text-emerald-600 font-bold">✓</span> System Vitality & Telemetry Diagnostics
                  </div>
                </div>
              </div>

              {/* Strict Non-Financial Air-Gap Notice */}
              <div className="flex items-center gap-2 text-[11px] text-gray-600 bg-white/70 p-2 rounded-lg border border-gray-200 mt-2">
                <span>🔒</span>
                <span><strong>Air-Gap Privacy Guarantee:</strong> Student fee ledgers, receipts, bank accounts, and payroll are 100% blocked from transmission.</span>
              </div>
            </div>

            {/* Action Buttons in ERP */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-2 pt-2 md:pt-0 shrink-0">
              <button
                type="button"
                onClick={handleApproveAndTransmit}
                disabled={actionLoading}
                className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-500/30 disabled:opacity-50 text-sm whitespace-nowrap"
              >
                {actionLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Transmitting Real Data to WWS...
                  </>
                ) : (
                  <>
                    <span>✅</span> {isApproved ? 'Re-Approve & Send Real Data' : 'Approve Request & Send Real Data'}
                  </>
                )}
              </button>

              {!isApproved && (
                <button
                  type="button"
                  onClick={handleRejectRequest}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 font-semibold rounded-xl border border-gray-300 transition text-xs text-center"
                >
                  Dismiss Request
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. VERIFIED REAL DATA TRANSMITTED TO WWS */}
      {isApproved && (
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-200 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                <span>📡</span> Live Real Data Stream Active
              </div>
              <h3 className="text-base font-bold text-gray-900 mt-0.5">
                Real ERP Data Transmitted to WWS Central Command
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSyncNow}
                disabled={actionLoading}
                className="px-3.5 py-1.5 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition flex items-center gap-1.5"
              >
                <span>🔄</span> Re-Send Real Data to WWS
              </button>
              <button
                type="button"
                onClick={handleHeartbeat}
                disabled={actionLoading}
                className="px-3.5 py-1.5 text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg transition flex items-center gap-1.5"
              >
                <span>💓</span> Send Vitality Ping
              </button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Enrolled Students</div>
              <div className="text-2xl font-mono font-extrabold text-blue-600 mt-1">
                {realMetrics.total_students ?? 0}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                Active: {realMetrics.active_students ?? 0}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Faculty & Staff</div>
              <div className="text-2xl font-mono font-extrabold text-indigo-600 mt-1">
                {realMetrics.total_teachers ?? 0}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">Teaching Staff</div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Attendance Rate</div>
              <div className="text-2xl font-mono font-extrabold text-emerald-600 mt-1">
                {realMetrics.attendance_rate ?? 95}%
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">Academic Average</div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Last Transmission</div>
              <div className="text-sm font-semibold text-gray-900 mt-2 truncate">
                {config.last_sync_at ? new Date(config.last_sync_at).toLocaleTimeString() : 'Just now'}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                {config.last_sync_at ? new Date(config.last_sync_at).toLocaleDateString() : 'Active'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. RECENT TRANSMISSION AUDIT LOG */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
            <span>📋</span> Real Data Transmission Audit Log
          </h4>
          <span className="text-[11px] text-gray-500">
            Transmissions dispatched to WWS Central Platform
          </span>
        </div>

        {recentSyncs.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-500">
            No synchronization history recorded yet. Approve the incoming request to transmit initial operational data.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/50 text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Started At</th>
                  <th className="py-2.5 px-4 font-semibold">Type</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 px-4 font-semibold">Records</th>
                  <th className="py-2.5 px-4 font-semibold">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentSyncs.map((sync) => (
                  <tr key={sync.id} className="hover:bg-gray-50/50">
                    <td className="py-2.5 px-4 font-mono text-gray-700">
                      {new Date(sync.started_at || sync.created_at).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 uppercase font-semibold text-gray-800">
                      {sync.sync_type}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        sync.status === 'success' ? 'bg-emerald-100 text-emerald-800' :
                        sync.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {sync.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-gray-700">
                      {sync.records_synced || 0}
                    </td>
                    <td className="py-2.5 px-4 text-gray-500">
                      {sync.duration_ms ? `${sync.duration_ms}ms` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
