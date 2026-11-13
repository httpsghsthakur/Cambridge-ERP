import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';
import { formatCurrency, feeStatusColor, formatDate } from '../../utils/helpers';
import { generateFeeReceipt } from '../../utils/pdfGenerator';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';
import Receipt from '../../components/Receipt';
import { useSettings } from '../../context/SettingsContext';

const FEE_TYPE_LABELS = {
  monthly:       'Monthly Tuition',
  annual:        'Annual Fee',
  session_start: 'Session & Promotion Fee',
  admission:     'Admission Fee',
  exam:          'Examination Fee',
  promotion:     'Promotion Fee',
  quarterly:     'Quarterly Fee',
  miscellaneous: 'Miscellaneous Fee',
};

const STATUS_LABELS = {
  paid:          'Paid',
  partial:       'Partial',
  unpaid:        'Unpaid',
  overdue:       'Overdue',
  waived:        'Waived',
  not_generated: 'Scheduled',
};

const formatModeLabel = (mode) => {
  if (!mode) return '—';
  const m = String(mode).toLowerCase();
  const map = { cash: 'Cash', upi: 'UPI', online: 'Online', cheque: 'Cheque', card: 'Card', bank: 'Bank Transfer' };
  return map[m] || m.toUpperCase();
};

const extractFeeComponents = (rawBreakdown) => {
  let breakdown = rawBreakdown;
  if (typeof breakdown === 'string') {
    try { breakdown = JSON.parse(breakdown); } catch { breakdown = null; }
  }
  if (!breakdown || typeof breakdown !== 'object') return [];
  return Object.entries(breakdown).filter(
    ([key, val]) =>
      key !== 'transactions' &&
      (typeof val === 'number' || (typeof val === 'string' && val.trim() !== '' && !Number.isNaN(Number(val))))
  );
};

function FeeLedgerTable({
  rows = [],
  emptyMessage,
  showScheduleIndex = false,
  onPreviewReceipt,
  onDownloadReceipt,
}) {
  if (!rows.length) {
    return (
      <div className="px-4 py-8 text-center text-xs text-slate-400">
        {emptyMessage || 'No fee records in this category.'}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs sm:text-sm text-left">
        <thead className="bg-slate-50 border-b border-gray-100 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            {showScheduleIndex && <th className="py-2.5 px-3 text-center w-10">#</th>}
            <th className="py-2.5 px-4">Fee / Period</th>
            <th className="py-2.5 px-3 text-right">Fee Amount</th>
            <th className="py-2.5 px-3 text-right">Cleared</th>
            <th className="py-2.5 px-3 text-right">Due</th>
            <th className="py-2.5 px-4">Mode &amp; Date of Payment</th>
            <th className="py-2.5 px-4">Receipt No.</th>
            <th className="py-2.5 px-3 text-center">Status</th>
            <th className="py-2.5 px-4 text-right">Receipt</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, idx) => {
            const isScheduledOnly = row.status === 'not_generated' && !row.bundled_with_admission;
            const canDownload = Number(row.cleared_amount || 0) > 0;
            const components = extractFeeComponents(row.fee_breakdown);

            return (
              <tr
                key={row.id || `${row.month}-${row.year}-${idx}`}
                className={isScheduledOnly ? 'bg-slate-50/40 text-slate-500' : 'hover:bg-slate-50/70 transition-colors'}
              >
                {showScheduleIndex && (
                  <td className="py-3 px-3 text-center text-xs font-semibold text-slate-400">
                    {row.schedule_index || idx + 1}
                  </td>
                )}

                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-800">
                    {row.fee_type === 'monthly'
                      ? `${row.month} ${row.year || ''}`.trim()
                      : `${FEE_TYPE_LABELS[row.fee_type] || row.fee_type}${row.month ? ` (${row.month} ${row.year || ''})` : ''}`}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-0.5 text-[11px] text-slate-400">
                    {row.due_date && <span>Due: {formatDate(row.due_date)}</span>}
                    {row.bundled_with_admission && (
                      <span className="text-purple-600 font-medium">· Bundled with Admission Fee</span>
                    )}
                    {row.fee_type !== 'monthly' && components.map(([k, v]) => (
                      <span key={k} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded capitalize">
                        {k.replace('_', ' ')}: {formatCurrency(v)}
                      </span>
                    ))}
                  </div>
                </td>

                <td className="py-3 px-3 text-right whitespace-nowrap">
                  <span className="font-semibold text-slate-700">
                    {formatCurrency(isScheduledOnly ? row.scheduled_amount : row.net_payable)}
                  </span>
                  {Number(row.late_fee_amount || 0) > 0 && (
                    <p className="text-[10px] text-amber-600 font-medium">
                      incl. {formatCurrency(row.late_fee_amount)} late fee
                    </p>
                  )}
                </td>

                <td className="py-3 px-3 text-right whitespace-nowrap font-semibold text-emerald-600">
                  {row.bundled_with_admission ? 'In Adm.' : formatCurrency(row.cleared_amount || 0)}
                </td>

                <td className={`py-3 px-3 text-right whitespace-nowrap font-semibold ${
                  Number(row.due_amount || 0) > 0 ? 'text-red-500' : 'text-slate-400'
                }`}>
                  {isScheduledOnly || row.bundled_with_admission
                    ? '—'
                    : formatCurrency(row.due_amount || 0)}
                </td>

                <td className="py-3 px-4 whitespace-nowrap text-xs">
                  {row.paid_date || row.payment_mode ? (
                    <div>
                      <span className="font-semibold text-slate-700">{formatModeLabel(row.payment_mode)}</span>
                      {row.paid_date && (
                        <p className="text-[11px] text-slate-400">{formatDate(row.paid_date)}</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>

                <td className="py-3 px-4 whitespace-nowrap text-xs font-mono text-slate-600">
                  {row.receipt_number || '—'}
                </td>

                <td className="py-3 px-3 text-center whitespace-nowrap">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                    row.bundled_with_admission
                      ? (feeStatusColor[row.status] || 'bg-purple-100 text-purple-700')
                      : (feeStatusColor[row.status] || 'bg-slate-100 text-slate-600')
                  }`}>
                    {row.bundled_with_admission
                      ? `In Adm (${STATUS_LABELS[row.status] || row.status})`
                      : (STATUS_LABELS[row.status] || row.status)}
                  </span>
                </td>

                <td className="py-3 px-4 text-right whitespace-nowrap">
                  {canDownload ? (
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onPreviewReceipt(row)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => onDownloadReceipt(row)}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 px-2 py-1 rounded-lg"
                      >
                        PDF
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function FeeStatus() {
  const { user } = useAuth();
  const { settings } = useSettings() || {};
  const studentId = user?.linkedStudent?.id;

  const [ledger, setLedger]                   = useState(null);
  const [selectedSession, setSelectedSession] = useState('');
  const [activeSection, setActiveSection]     = useState('all'); // all | annual | monthly | other | receipts
  const [loading, setLoading]                 = useState(true);
  const [receiptModal, setReceiptModal]       = useState(null);

  const loadLedger = useCallback(async (sessParam) => {
    if (!studentId) return;
    setLoading(true);
    try {
      const qs = sessParam !== undefined && sessParam !== ''
        ? `?session_id=${encodeURIComponent(sessParam)}`
        : '';
      const res = await API.get(`/fees/student/${studentId}/structured${qs}`);
      setLedger(res.data);
      if (sessParam === undefined || sessParam === '') {
        setSelectedSession(res.data?.selectedSessionId ? String(res.data.selectedSessionId) : 'all');
      }
    } catch {
      toast.error('Failed to load structured fees');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadLedger();
  }, [loadLedger]);

  const handleSessionChange = (nextSess) => {
    setSelectedSession(nextSess);
    loadLedger(nextSess);
  };

  const studentObj = ledger?.student || user?.linkedStudent || {};

  const withSchoolSettings = (receiptPayload, fallbackRow) => {
    const base = Number(fallbackRow?.base_amount ?? fallbackRow?.total_amount ?? receiptPayload?.total_amount ?? 0);
    const late = Number(fallbackRow?.late_fee_amount ?? receiptPayload?.late_fee_amount ?? 0);
    const paid = Number(fallbackRow?.cleared_amount ?? fallbackRow?.amount ?? fallbackRow?.paid_amount ?? receiptPayload?.paid_amount ?? 0);
    const net  = Number(fallbackRow?.net_payable ?? receiptPayload?.net_payable ?? (base + late));
    const bal  = Math.max(0, Number(fallbackRow?.due_amount ?? receiptPayload?.balance ?? (net - paid)));

    return {
      ...(receiptPayload || {}),
      student_name:   receiptPayload?.student_name || `${studentObj.first_name || ''} ${studentObj.last_name || ''}`.trim(),
      class:          receiptPayload?.class || studentObj.class || '',
      section:        receiptPayload?.section || studentObj.section || '',
      fee_type:       fallbackRow?.fee_type || receiptPayload?.fee_type || 'monthly',
      total_amount:   base,
      late_fee_amount: late,
      net_payable:    net,
      paid_amount:    paid,
      balance:        bal,
      payment_mode:   fallbackRow?.payment_mode || receiptPayload?.payment_mode || '',
      receipt_number: fallbackRow?.receipt_number || receiptPayload?.receipt_number || '',
      date:           fallbackRow?.paid_date || receiptPayload?.date || new Date().toISOString().split('T')[0],
      collected_by:   fallbackRow?.collected_by_name || fallbackRow?.collectedByUser?.name || receiptPayload?.collected_by || 'System',
      school: {
        name:    settings?.school_name || receiptPayload?.school?.name || 'International Cambridge School Kishtwar',
        address: settings?.school_address || receiptPayload?.school?.address || '',
        phone:   settings?.school_phone || receiptPayload?.school?.phone || '',
        email:   settings?.school_email || receiptPayload?.school?.email || '',
      },
      student: {
        name:        `${studentObj.first_name || ''} ${studentObj.last_name || ''}`.trim(),
        class:       `${studentObj.class || '—'} - ${studentObj.section || '—'}`,
        parent_name: studentObj.parent_name || user?.linkedStudent?.parent_name || '',
        phone:       studentObj.parent_phone || user?.linkedStudent?.parent_phone || '',
      },
      payment: {
        ...(receiptPayload?.payment || {}),
        fee_type:        fallbackRow?.fee_type || receiptPayload?.fee_type || 'monthly',
        total_amount:    base,
        late_fee_amount: late,
        net_payable:     net,
        paid_amount:     paid,
        balance:         bal,
        payment_mode:    fallbackRow?.payment_mode || receiptPayload?.payment_mode || '',
        status:          fallbackRow?.status || receiptPayload?.payment?.status || 'paid',
      },
      fee_breakdown: fallbackRow?.fee_breakdown || receiptPayload?.fee_breakdown || {},
    };
  };

  const handlePreviewRow = (row) => {
    setReceiptModal(withSchoolSettings(row.receipt_data, row));
  };

  const handleDownloadRow = (row) => {
    const feePdfPayload = {
      receipt_number:  row.receipt_number,
      paid_date:       row.paid_date,
      month:           row.month,
      year:            row.year,
      fee_type:        row.fee_type,
      payment_mode:    row.payment_mode,
      total_amount:    row.base_amount ?? row.total_amount ?? row.amount ?? 0,
      late_fee_amount: row.late_fee_amount ?? 0,
      net_payable:     row.net_payable ?? row.total_amount ?? row.amount ?? 0,
      paid_amount:     row.cleared_amount ?? row.amount ?? row.paid_amount ?? 0,
      due_amount:      row.due_amount ?? 0,
    };
    generateFeeReceipt(feePdfPayload, user?.linkedStudent || studentObj, settings);
  };

  if (loading && !ledger) return <LoadingSpinner />;

  const summary = ledger?.summary || {};
  const classStructure = ledger?.classStructure;
  const sessions = ledger?.sessions || [];
  const annualFees = ledger?.annualFees || [];
  const monthlySchedule = ledger?.monthlySchedule || [];
  const otherFees = ledger?.otherFees || [];
  const transactionsLedger = ledger?.transactionsLedger || [];

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header + Session Filter */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-800">Student Fee Structure &amp; Ledger</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {studentObj.first_name} {studentObj.last_name}
            {studentObj.student_id ? ` (${studentObj.student_id})` : ''}
            {studentObj.class ? ` · Class ${studentObj.class}${studentObj.section ? `-${studentObj.section}` : ''}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Academic Session:</label>
          <select
            value={selectedSession}
            onChange={(e) => handleSessionChange(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 bg-white"
          >
            {sessions.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.name}{String(s.id) === String(ledger?.currentSessionId) ? ' (Current)' : ''}
              </option>
            ))}
            <option value="all">All Sessions Combined</option>
          </select>
        </div>
      </div>

      {/* Published Class Fee Structure Reference */}
      {classStructure && (
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">
                Applicable Fee Structure — Class {classStructure.class}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Monthly Due Date: {classStructure.monthly_due_date || 10}th of each month
                {Number(classStructure.late_fee_per_day || 0) > 0
                  ? ` · Late Fee: ${formatCurrency(classStructure.late_fee_per_day)}/day`
                  : ''}
              </p>
            </div>
            {classStructure.is_published && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Published Schedule
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {[
              { label: 'Monthly Tuition', val: classStructure.monthly_fee },
              { label: 'Annual / Session', val: classStructure.annual_fee },
              { label: 'Admission Fee', val: classStructure.admission_fee },
              { label: 'Promotion Fee', val: classStructure.promotion_fee },
              { label: 'Exam Fee', val: classStructure.exam_fee },
            ].map((item, idx) => (
              <div key={item.label} className={`bg-white/10 rounded-xl px-3 py-2.5 ${idx === 4 ? 'col-span-2 sm:col-span-1' : ''}`}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-300">{item.label}</p>
                <p className="text-base font-extrabold text-white mt-0.5">{formatCurrency(item.val || 0)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reconciled Financial KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-xs font-medium text-slate-400">Total Billed Payable</p>
          <p className="text-xl font-extrabold text-slate-800 mt-1">{formatCurrency(summary.total_billed || 0)}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Base: {formatCurrency(summary.total_base_fees || 0)}
            {Number(summary.total_late_fees || 0) > 0 ? ` + Late: ${formatCurrency(summary.total_late_fees)}` : ''}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-xs font-medium text-slate-400">Total Cleared (Paid)</p>
          <p className="text-xl font-extrabold text-emerald-600 mt-1">{formatCurrency(summary.total_cleared || 0)}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Annual {formatCurrency(summary.annual_cleared || 0)} · Tuition {formatCurrency(summary.monthly_cleared || 0)}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-xs font-medium text-slate-400">Total Due (Balance)</p>
          <p className={`text-xl font-extrabold mt-1 ${Number(summary.total_due || 0) > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
            {formatCurrency(summary.total_due || 0)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {Number(summary.total_waived || 0) > 0
              ? `Waived: ${formatCurrency(summary.total_waived)}`
              : `${summary.unpaid_count || 0} unpaid · ${summary.partial_count || 0} partial`}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-xs font-medium text-slate-400">Payment Receipts</p>
          <p className="text-xl font-extrabold text-blue-600 mt-1">{summary.receipts_count || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            12-Mo Tuition Plan: {formatCurrency(summary.scheduled_12m_tuition || 0)}
          </p>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all',      label: 'All Fee Sections' },
          { id: 'annual',   label: `Annual & Session (${annualFees.length})` },
          { id: 'monthly',  label: `12-Month Schedule (${monthlySchedule.length})` },
          { id: 'other',    label: `Other Fees (${otherFees.length})` },
          { id: 'receipts', label: `Receipts & Transactions (${transactionsLedger.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSection(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeSection === tab.id
                ? 'bg-slate-800 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Section 1: Annual & Session Fees */}
      {(activeSection === 'all' || activeSection === 'annual') && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-5 py-3.5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-800">1. Annual &amp; Session Fees</h3>
              <p className="text-xs text-slate-400">Once-per-session charges including annual &amp; promotion start fees</p>
            </div>
            <div className="flex gap-3 text-xs font-semibold">
              <span className="text-emerald-600">Cleared: {formatCurrency(summary.annual_cleared || 0)}</span>
              <span className={Number(summary.annual_due || 0) > 0 ? 'text-red-500' : 'text-slate-400'}>
                Due: {formatCurrency(summary.annual_due || 0)}
              </span>
            </div>
          </div>
          <FeeLedgerTable
            rows={annualFees}
            emptyMessage="No annual or session fees billed for the selected session."
            onPreviewReceipt={handlePreviewRow}
            onDownloadReceipt={handleDownloadRow}
          />
        </div>
      )}

      {/* Section 2: 12-Month Tuition Schedule */}
      {(activeSection === 'all' || activeSection === 'monthly') && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-5 py-3.5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-800">2. 12-Month Tuition Fee Schedule</h3>
              <p className="text-xs text-slate-400">Month-by-month tuition breakdown with payment receipts, cleared &amp; due balances</p>
            </div>
            <div className="flex gap-3 text-xs font-semibold">
              <span className="text-emerald-600">Cleared: {formatCurrency(summary.monthly_cleared || 0)}</span>
              <span className={Number(summary.monthly_due || 0) > 0 ? 'text-red-500' : 'text-slate-400'}>
                Due: {formatCurrency(summary.monthly_due || 0)}
              </span>
            </div>
          </div>
          <FeeLedgerTable
            rows={monthlySchedule}
            showScheduleIndex
            emptyMessage="No monthly tuition schedule records found."
            onPreviewReceipt={handlePreviewRow}
            onDownloadReceipt={handleDownloadRow}
          />
        </div>
      )}

      {/* Section 3: Other Fees */}
      {(activeSection === 'all' || activeSection === 'other') && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-5 py-3.5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-800">3. Other Fees (Admission, Exam, Promotion &amp; Misc)</h3>
              <p className="text-xs text-slate-400">One-time, examination, and miscellaneous fee charges</p>
            </div>
            <div className="flex gap-3 text-xs font-semibold">
              <span className="text-emerald-600">Cleared: {formatCurrency(summary.other_cleared || 0)}</span>
              <span className={Number(summary.other_due || 0) > 0 ? 'text-red-500' : 'text-slate-400'}>
                Due: {formatCurrency(summary.other_due || 0)}
              </span>
            </div>
          </div>
          <FeeLedgerTable
            rows={otherFees}
            emptyMessage="No admission, exam, promotion, or miscellaneous fees billed for this session."
            onPreviewReceipt={handlePreviewRow}
            onDownloadReceipt={handleDownloadRow}
          />
        </div>
      )}

      {/* Section 4: Payment Receipts & Transactions Log */}
      {(activeSection === 'all' || activeSection === 'receipts') && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-800">4. Payment Receipts &amp; Transaction History</h3>
              <p className="text-xs text-slate-400">Individual installment and full payment receipts with mode, date &amp; collector</p>
            </div>
            <span className="text-xs font-bold text-slate-600">{transactionsLedger.length} Receipt(s)</span>
          </div>

          {transactionsLedger.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-slate-400">
              No payment transactions recorded for this selection yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-left">
                <thead className="bg-slate-50 border-b border-gray-100 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="py-2.5 px-4">Receipt No.</th>
                    <th className="py-2.5 px-4">Fee Category</th>
                    <th className="py-2.5 px-3">Date of Payment</th>
                    <th className="py-2.5 px-3">Mode</th>
                    <th className="py-2.5 px-3 text-right">Amount Paid</th>
                    <th className="py-2.5 px-3">Collected By</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactionsLedger.map((tx) => (
                    <tr key={tx.tx_key} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-blue-700 whitespace-nowrap">
                        {tx.receipt_number}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">
                          {FEE_TYPE_LABELS[tx.fee_type] || tx.fee_type}
                        </span>
                        <span className="text-xs text-slate-400 ml-1">
                          ({tx.month} {tx.year})
                        </span>
                        {tx.remarks && (
                          <p className="text-[11px] text-slate-400 mt-0.5">{tx.remarks}</p>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                        {formatDate(tx.paid_date)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                          {formatModeLabel(tx.payment_mode)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-600 whitespace-nowrap">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-xs whitespace-nowrap">
                        {tx.collected_by_name || 'System'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handlePreviewRow({
                              ...tx,
                              cleared_amount: tx.amount,
                              base_amount: tx.receipt_data?.total_amount ?? tx.amount,
                              late_fee_amount: tx.receipt_data?.late_fee_amount ?? 0,
                              net_payable: tx.receipt_data?.net_payable ?? tx.amount,
                              due_amount: tx.receipt_data?.balance ?? 0,
                              status: tx.receipt_data?.payment?.status || 'paid',
                            })}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadRow({
                              ...tx,
                              cleared_amount: tx.amount,
                              base_amount: tx.receipt_data?.total_amount ?? tx.amount,
                              late_fee_amount: tx.receipt_data?.late_fee_amount ?? 0,
                              net_payable: tx.receipt_data?.net_payable ?? tx.amount,
                              due_amount: tx.receipt_data?.balance ?? 0,
                            })}
                            className="text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 px-2 py-1 rounded-lg"
                          >
                            PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={!!receiptModal}
        onClose={() => setReceiptModal(null)}
        title="Receipt Preview"
        size="xl"
      >
        <Receipt
          receipt={receiptModal}
          onClose={() => setReceiptModal(null)}
          onPrint={() => window.print()}
        />
      </Modal>
    </div>
  );
}
