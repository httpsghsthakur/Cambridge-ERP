import React, { useState, useEffect } from 'react';
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

  // Auto-listen: poll every 3 seconds for incoming approval requests or remote suspension status
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

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success('School ID copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 font-medium">Loading Central ERP Connection...</p>
        </div>
      </div>
    );
  }

  const config = data?.config || {};
  const pendingApproval = data?.pending_approval;
  const isApproved = data?.approval_status === 'APPROVED' || config.connection_status === 'connected';
  const isSuspended = !!config.is_suspended;
  const activeSchoolId = config.school_id || schoolId || 'SCH-B0E1B';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <span>🌐</span> Centralized System Link (WWS)
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {isApproved
              ? 'This ERP is connected to WWS Central Command. Remote management and license protection are active.'
              : 'Link this school ERP to WWS Central Command with your School ID and approve incoming requests.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isSuspended ? (
            <span className="px-3.5 py-1.5 text-xs font-bold rounded-full bg-red-100 text-red-800 border border-red-300 flex items-center gap-2 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
              Suspended Remotely
            </span>
          ) : isApproved ? (
            <span className="px-3.5 py-1.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 flex items-center gap-2 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Connected & Active
            </span>
          ) : (
            <span className="px-3.5 py-1.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
              Waiting for Request...
            </span>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          1. CONNECTED STATE: VIEW-ONLY SCHOOL ID & REMOTE SUSPENSION STATUS
          (Once connected, no central metrics or clutter are shown — strictly view-only)
          ───────────────────────────────────────────────────────────────────────────── */}
      {isApproved ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Suspension Alert (if school is suspended from Central Command) */}
          {isSuspended && (
            <div className="bg-red-500 p-5 text-white flex items-start gap-4 border-b-2 border-red-600">
              <span className="text-3xl">⚠️</span>
              <div className="space-y-1">
                <div className="text-xs font-extrabold uppercase tracking-wider bg-red-700/60 px-2.5 py-0.5 rounded inline-block">
                  Service Suspended by Central Command
                </div>
                <h3 className="text-lg font-bold">
                  ERP Operations Temporarily Paused
                </h3>
                <p className="text-xs text-red-100 leading-relaxed">
                  <strong>Reason:</strong> {config.suspension_reason || 'Suspended by platform administrator.'}
                </p>
                {config.suspended_at && (
                  <p className="text-[11px] text-red-200 font-mono">
                    Suspended At: {new Date(config.suspended_at).toLocaleString()}
                  </p>
                )}
                <p className="text-[11px] text-red-100 pt-1">
                  🔒 All school database records remain 100% safe and preserved. Service will automatically resume once reactivated from Central Command.
                </p>
              </div>
            </div>
          )}

          {/* Connected School ID Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 p-6 text-white">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300">
              Connected School Identifier
            </span>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔒</span>
                <div>
                  <span className="text-3xl sm:text-4xl font-mono font-extrabold text-yellow-400 tracking-wider">
                    {activeSchoolId}
                  </span>
                  <div className="text-[11px] text-blue-200 mt-0.5 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>View-Only Active Link</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard(activeSchoolId)}
                className="px-4 py-2 bg-blue-900/60 hover:bg-blue-800 text-white font-medium text-xs rounded-xl border border-blue-700/60 transition flex items-center gap-1.5 self-start sm:self-center"
              >
                <span>📋</span> Copy School ID
              </button>
            </div>
          </div>

          {/* View-Only Details Card */}
          <div className="p-6 space-y-4 bg-slate-50/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Connection Status</span>
                <div className="text-sm font-bold text-emerald-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Connected & Authorized
                </div>
                <p className="text-[11px] text-gray-500">Managed remotely by WWS Central Command</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Remote Entitlement</span>
                <div className={`text-sm font-bold ${isSuspended ? 'text-red-600' : 'text-blue-700'} flex items-center gap-1.5`}>
                  <span>{isSuspended ? '🔴 Suspended' : '🟢 Active License'}</span>
                </div>
                <p className="text-[11px] text-gray-500">
                  {isSuspended ? 'Service blocked by Central Platform' : 'Suspension & reactivation feature armed'}
                </p>
              </div>
            </div>

            {/* Air-Gap Policy Banner */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 text-xs text-gray-600 flex items-start gap-3">
              <span className="text-lg">🛡️</span>
              <div>
                <strong className="text-gray-900 block font-semibold mb-0.5">Enterprise Air-Gap Privacy Policy</strong>
                This ERP is connected to the Central Platform for operational administration and license entitlement. Student fee ledgers, payment transactions, and payroll data remain strictly private and air-gapped on this server.
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────────────────────
           2. NOT CONNECTED STATE: INPUT SCHOOL ID & RECEIVE WWS APPROVAL REQUEST
           ───────────────────────────────────────────────────────────────────────────── */
        <div className="space-y-6">
          {/* School ID Input Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-blue-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 p-6 text-white">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
                School ERP Receiver Configuration
              </span>
              <h2 className="text-xl font-bold text-white mt-1">
                Enter School ID
              </h2>
              <p className="text-xs text-blue-200 mt-0.5">
                Paste your School ID from WWS. This ERP will receive the approval request sent from WWS.
              </p>
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
                  <span>Save your School ID here. When you click &ldquo;Send Approval Request&rdquo; in WWS, this ERP will automatically receive the request below.</span>
                  {lastChecked && (
                    <span className="text-[11px] text-gray-400 font-mono">Listening (Last check: {lastChecked})</span>
                  )}
                </div>
              </div>

              {/* Advanced Settings */}
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

          {/* Incoming Approval Request Card */}
          {pendingApproval && (
            <div className="rounded-2xl border-2 p-6 transition-all duration-300 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-400 shadow-lg ring-4 ring-amber-200/50">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 text-[11px] font-extrabold uppercase rounded-full tracking-wider flex items-center gap-1 shadow-sm bg-amber-500 text-white animate-pulse">
                      <span>🔔</span> Approval Request Received from WWS
                    </span>
                    <span className="text-xs font-mono text-gray-600 font-semibold">
                      School ID: <strong className="text-gray-900">{pendingApproval.school_id || schoolId}</strong>
                    </span>
                  </div>

                  <h3 className="text-lg font-extrabold text-gray-900">
                    Central System (WWS) is Requesting Real Data Access
                  </h3>

                  <p className="text-xs text-gray-700 leading-relaxed max-w-2xl">
                    <strong>{pendingApproval.requester || 'WWS Central ERP Command (https://wws.ktwr.in)'}</strong> has dispatched an authorized connection request to this ERP for School ID <strong>{pendingApproval.school_id || schoolId}</strong>.
                  </p>

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

                  <div className="flex items-center gap-2 text-[11px] text-gray-600 bg-white/70 p-2 rounded-lg border border-gray-200 mt-2">
                    <span>🔒</span>
                    <span><strong>Air-Gap Privacy Guarantee:</strong> Student fee ledgers, receipts, bank accounts, and payroll are 100% blocked from transmission.</span>
                  </div>
                </div>

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
                        <span>✅</span> Approve Request & Send Real Data
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleRejectRequest}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 font-semibold rounded-xl border border-gray-300 transition text-xs text-center"
                  >
                    Dismiss Request
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
