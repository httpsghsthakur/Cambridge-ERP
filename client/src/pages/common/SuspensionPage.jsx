import React, { useState, useEffect } from 'react';
import API from '../../utils/api';
import toast from 'react-hot-toast';

export default function SuspensionPage() {
  const [suspensionInfo, setSuspensionInfo] = useState(null);
  const [checking, setChecking] = useState(false);

  const fetchSuspensionStatus = async () => {
    try {
      setChecking(true);
      const res = await API.get('/central/suspension-info');
      if (res.data && res.data.success) {
        setSuspensionInfo(res.data);
        if (!res.data.is_suspended) {
          toast.success('Your subscription is active! Redirecting to ERP...');
          setTimeout(() => {
            window.location.href = '/login';
          }, 1500);
        }
      }
    } catch (err) {
      // Fallback to session cache if network fails
      const cached = sessionStorage.getItem('erp_suspension_info');
      if (cached) {
        try {
          setSuspensionInfo(JSON.parse(cached));
        } catch (e) {}
      }
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    fetchSuspensionStatus();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-red-50/40 to-white flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-red-100 text-center">
        {/* Glowing Red Warning Shield */}
        <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center border-4 border-red-200/60 shadow-inner">
          <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        {/* Headings */}
        <div className="space-y-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 tracking-wide uppercase">
            Service Temporarily Suspended
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Please complete your subscription payment first to resume your services.
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed pt-1">
            Your school's ERP access has been temporarily paused due to an outstanding subscription payment. Please contact our support team for assistance.
          </p>
        </div>

        {/* Suspension Reason (if provided) */}
        {suspensionInfo?.suspension_reason && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-left">
            <span className="text-xs font-bold text-red-800 uppercase tracking-wider block">Official Notice:</span>
            <p className="text-sm text-red-900 mt-1 font-medium">
              {suspensionInfo.suspension_reason}
            </p>
          </div>
        )}

        {/* Reassurance Note */}
        <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-4 text-xs text-gray-600 text-left flex items-start gap-3">
          <div className="text-emerald-600 text-base font-bold flex-shrink-0 mt-0.5">🛡️</div>
          <div>
            <span className="font-semibold text-gray-800">Data Preservation Guarantee:</span>
            <p className="mt-0.5 text-gray-600 leading-normal">
              All school academic records, student histories, grades, marks, and attendance records remain 100% safe, untouched, and preserved in our secure database. Normal access will be restored immediately once your subscription payment is confirmed.
            </p>
          </div>
        </div>

        {/* Support Contact Information */}
        <div className="border-t border-gray-100 pt-6 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Platform Support & Billing</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-left">
              <span className="text-xs text-gray-500 font-medium block">Support Email</span>
              <a
                href={`mailto:${suspensionInfo?.support_email || 'billing-support@schoolplatform.net'}`}
                className="font-semibold text-indigo-600 hover:text-indigo-800 break-all"
              >
                {suspensionInfo?.support_email || 'billing-support@schoolplatform.net'}
              </a>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-left">
              <span className="text-xs text-gray-500 font-medium block">Billing Hotline</span>
              <span className="font-semibold text-gray-800">
                {suspensionInfo?.support_phone || '+1 (800) 555-0199'}
              </span>
            </div>
          </div>
          {suspensionInfo?.school_id && (
            <p className="text-xs text-gray-500 font-mono pt-1">
              School Reference ID: <strong className="text-gray-700">{suspensionInfo.school_id}</strong>
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={fetchSuspensionStatus}
            disabled={checking}
            className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold rounded-xl text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-md transition disabled:opacity-50"
          >
            {checking ? 'Checking Status...' : 'Check Payment / Refresh Status'}
          </button>
          <a
            href="/login"
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold rounded-xl text-gray-700 bg-gray-100 hover:bg-gray-200 transition text-center"
          >
            Admin Sign In
          </a>
        </div>
      </div>
    </div>
  );
}
