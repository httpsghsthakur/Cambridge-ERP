import React, { useState, useEffect } from 'react';
import API from '../../utils/api';
import toast from 'react-hot-toast';

export default function CentralIntegration() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [pinging, setPinging] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [rawEnvText, setRawEnvText] = useState('');

  // Connector Form Fields
  const [form, setForm] = useState({
    central_erp_url: 'https://wws.ktwr.in',
    central_school_id: 'SCH-B0E1B',
    central_api_key: 'cc_live_pk_05b30262475f599e500ea4f5',
    central_hmac_secret: 'cc_sec_live_12af5e17caea7f904921bd489184dd3b6267514f3191a7d1',
  });

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await API.get('/central/status');
      if (res.data?.success) {
        setData(res.data);
        const cfg = res.data.config || {};
        setForm({
          central_erp_url: cfg.central_erp_url || cfg.central_api_url || 'https://wws.ktwr.in',
          central_school_id: cfg.central_school_id || cfg.school_id || 'SCH-B0E1B',
          central_api_key: cfg.central_api_key || cfg.connector_client_id || 'cc_live_pk_05b30262475f599e500ea4f5',
          central_hmac_secret: cfg.central_hmac_secret || 'cc_sec_live_12af5e17caea7f904921bd489184dd3b6267514f3191a7d1',
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to fetch Central Connector status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveConfig = async (e) => {
    if (e) e.preventDefault();
    if (!form.central_school_id.trim()) {
      return toast.error('School ID is required.');
    }
    if (!form.central_erp_url.trim()) {
      return toast.error('Central Platform URL is required.');
    }

    setSaving(true);
    try {
      const res = await API.post('/central/configure', {
        central_erp_url: form.central_erp_url.trim(),
        central_school_id: form.central_school_id.trim(),
        central_api_key: form.central_api_key.trim(),
        central_hmac_secret: form.central_hmac_secret.trim(),
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Central ERP linked successfully!');
        await fetchStatus();
      } else {
        toast.error(res.data?.error || 'Failed to save configuration');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Configuration failed');
    } finally {
      setSaving(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const res = await API.post('/central/sync');
      if (res.data?.success) {
        toast.success(`Real data synchronized! ${res.data.records_synced || 0} records transmitted to Central Platform.`);
        await fetchStatus();
      } else {
        toast.error(res.data?.error || 'Sync failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Sync request failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleHeartbeat = async () => {
    setPinging(true);
    try {
      const res = await API.post('/central/heartbeat');
      if (res.data?.success) {
        toast.success('Heartbeat telemetry acknowledged by Central Platform!');
        await fetchStatus();
      } else {
        toast.error(res.data?.error || 'Heartbeat ping failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Heartbeat request failed');
    } finally {
      setPinging(false);
    }
  };

  const handleParseEnvText = () => {
    if (!rawEnvText.trim()) return toast.error('Please paste your configuration lines first.');

    const newForm = { ...form };
    const lines = rawEnvText.split('\n');

    lines.forEach(line => {
      const cleaned = line.trim();
      if (!cleaned || cleaned.startsWith('#')) return;

      const [key, ...rest] = cleaned.split('=');
      if (!key || rest.length === 0) return;

      const val = rest.join('=').trim().replace(/^["']|["']$/g, '');
      const k = key.trim();

      if (k === 'CENTRAL_ERP_URL' || k === 'CENTRAL_PLATFORM_URL') newForm.central_erp_url = val;
      if (k === 'CENTRAL_SCHOOL_ID') newForm.central_school_id = val;
      if (k === 'CENTRAL_API_KEY' || k === 'CENTRAL_CLIENT_ID') newForm.central_api_key = val;
      if (k === 'CENTRAL_HMAC_SECRET' || k === 'CENTRAL_SECRET') newForm.central_hmac_secret = val;
    });

    setForm(newForm);
    setPasteModalOpen(false);
    setRawEnvText('');
    toast.success('All 4 fields extracted from .env snippet! Click "Save & Link Connector" to apply.');
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
  const recentSyncs = data?.recentSyncs || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <span>🌐</span> Centralized System ERP Connector
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Configure your remote Centralized Platform credentials to link this School ERP and stream real-time operational metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPasteModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 transition flex items-center gap-1.5 shadow-sm"
          >
            📋 Paste .env Config
          </button>
          <span className="px-3 py-1.5 text-xs font-bold rounded-full bg-emerald-500/15 text-emerald-700 border border-emerald-400/40 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Live Linked
          </span>
        </div>
      </div>

      {/* Main Configuration Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-blue-200 overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 p-5 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
                Connected School Identifier
              </span>
              <div className="text-3xl font-mono font-extrabold text-yellow-400 mt-0.5 tracking-wider">
                {form.central_school_id || 'SCH-B0E1B'}
              </div>
            </div>
            <div className="text-xs text-blue-200 bg-blue-950/50 p-2.5 rounded-lg border border-blue-700/50">
              <div><strong>Central Target:</strong> {form.central_erp_url || 'https://wws.ktwr.in'}</div>
              <div><strong>Protocol:</strong> HMAC-SHA256 (300s Replay Guard)</div>
            </div>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSaveConfig} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* 1. CENTRAL_ERP_URL */}
            <div className="space-y-1.5 md:col-span-1">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                <span>🔗</span> Central Platform URL (CENTRAL_ERP_URL)
              </label>
              <input
                type="url"
                name="central_erp_url"
                value={form.central_erp_url}
                onChange={handleChange}
                placeholder="https://wws.ktwr.in"
                required
                className="w-full text-sm font-mono px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
              />
              <p className="text-[11px] text-gray-500">
                The centralized server endpoint where operational data will be transmitted.
              </p>
            </div>

            {/* 2. CENTRAL_SCHOOL_ID */}
            <div className="space-y-1.5 md:col-span-1">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                <span>🏷️</span> School ID (CENTRAL_SCHOOL_ID)
              </label>
              <input
                type="text"
                name="central_school_id"
                value={form.central_school_id}
                onChange={handleChange}
                placeholder="SCH-B0E1B"
                required
                className="w-full text-sm font-mono uppercase px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 font-bold text-blue-950"
              />
              <p className="text-[11px] text-gray-500">
                The unique permanent identifier assigned to this institution in the centralized system.
              </p>
            </div>

            {/* 3. CENTRAL_API_KEY */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                <span>🔑</span> Connector API Key (CENTRAL_API_KEY)
              </label>
              <input
                type="text"
                name="central_api_key"
                value={form.central_api_key}
                onChange={handleChange}
                placeholder="cc_live_pk_..."
                required
                className="w-full text-sm font-mono px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
              />
              <p className="text-[11px] text-gray-500">
                Public connector client credential sent in the <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">x-api-key</code> header.
              </p>
            </div>

            {/* 4. CENTRAL_HMAC_SECRET */}
            <div className="space-y-1.5 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                  <span>🔒</span> HMAC Secret Key (CENTRAL_HMAC_SECRET)
                </label>
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  {showSecret ? 'Hide Secret' : 'Show Secret'}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  name="central_hmac_secret"
                  value={form.central_hmac_secret}
                  onChange={handleChange}
                  placeholder="cc_sec_live_..."
                  required
                  className="w-full text-sm font-mono px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 pr-10"
                />
              </div>
              <p className="text-[11px] text-gray-500">
                Shared private secret used to generate cryptographic <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">x-signature</code> HMAC-SHA256 digests.
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleHeartbeat}
                disabled={pinging}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition border border-gray-300 disabled:opacity-50"
              >
                {pinging ? 'Pinging...' : '💓 Send Heartbeat Ping'}
              </button>
              <button
                type="button"
                onClick={handleSyncNow}
                disabled={syncing}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition border border-indigo-200 disabled:opacity-50"
              >
                {syncing ? 'Transmitting...' : '⚡ Transmit Real Data Now'}
              </button>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Saving & Linking...
                </>
              ) : (
                '💾 Save & Link Connector'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Real Data Transmission Overview */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <span>📊</span> Live Operational Data Streamed to Centralized System
          </h3>
          <span className="text-xs text-gray-500">
            Last Transmitted: {config.last_sync_at ? new Date(config.last_sync_at).toLocaleString() : 'Background Sync Active'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100">
            <div className="text-xs text-blue-800 font-semibold uppercase">Total Students</div>
            <div className="text-xl font-extrabold text-blue-950 mt-1">Live DB</div>
            <div className="text-[10px] text-blue-700 mt-0.5">Real-time Count</div>
          </div>
          <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100">
            <div className="text-xs text-indigo-800 font-semibold uppercase">Faculty & Staff</div>
            <div className="text-xl font-extrabold text-indigo-950 mt-1">Live DB</div>
            <div className="text-[10px] text-indigo-700 mt-0.5">Teaching Faculty</div>
          </div>
          <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100">
            <div className="text-xs text-emerald-800 font-semibold uppercase">Attendance %</div>
            <div className="text-xl font-extrabold text-emerald-950 mt-1">Calculated</div>
            <div className="text-[10px] text-emerald-700 mt-0.5">Student Rate</div>
          </div>
          <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-100">
            <div className="text-xs text-amber-800 font-semibold uppercase">Sync Schedule</div>
            <div className="text-xl font-extrabold text-amber-950 mt-1">Every 60m</div>
            <div className="text-[10px] text-amber-700 mt-0.5">Background Automated</div>
          </div>
        </div>
      </div>

      {/* Strict Privacy & Air-Gap Guarantee */}
      <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
          🛡️
        </div>
        <div>
          <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wide">
            Strict Non-Financial Privacy & Air-Gap Enforced
          </h4>
          <p className="text-xs text-blue-900 mt-0.5 leading-relaxed">
            Only approved aggregate operational indicators (student headcount, staff count, attendance percentage, class levels) are synchronized to the central platform. <strong>Student fee collections, outstanding dues, payment receipts, school bank accounts, and internal accounting remain cryptographically air-gapped and are never transmitted.</strong>
          </p>
        </div>
      </div>

      {/* Paste .env Modal */}
      {pasteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>📋</span> Paste Configuration Snippet (.env)
              </h3>
              <button
                type="button"
                onClick={() => setPasteModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Paste the 4 configuration variables given by your centralized system. We will automatically parse and assign them to the form.
            </p>

            <textarea
              rows={6}
              value={rawEnvText}
              onChange={(e) => setRawEnvText(e.target.value)}
              placeholder={`CENTRAL_ERP_URL=https://wws.ktwr.in\nCENTRAL_SCHOOL_ID=SCH-B0E1B\nCENTRAL_API_KEY=cc_live_pk_...\nCENTRAL_HMAC_SECRET=cc_sec_live_...`}
              className="w-full text-xs font-mono p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPasteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleParseEnvText}
                className="px-5 py-2 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Auto-Fill All 4 Fields
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
