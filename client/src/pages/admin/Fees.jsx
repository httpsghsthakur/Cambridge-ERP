import { useState, useEffect, useCallback } from 'react';
import API from '../../utils/api';
import Modal from '../../components/common/Modal';
import StatCard from '../../components/common/StatCard';
import FeeForm from '../../components/forms/FeeForm';
import MultiMonthFeeForm from '../../components/forms/MultiMonthFeeForm';
import { formatCurrency, feeStatusColor } from '../../utils/helpers';
import { generateFeeReceipt } from '../../utils/pdfGenerator';
import { useSettings } from '../../context/SettingsContext';
import { CLASSES, SECTIONS } from '../../constants/roles';
import toast from 'react-hot-toast';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const statusColor = {
  paid:          'bg-green-100 text-green-700',
  unpaid:        'bg-red-100 text-red-700',
  partial:       'bg-yellow-100 text-yellow-700',
  not_generated: 'bg-gray-100 text-gray-500',
  waived:        'bg-purple-100 text-purple-600',
};

export default function Fees() {
  const { settings } = useSettings() || {};
  const now = new Date();
  const [month, setMonth]         = useState(MONTHS[now.getMonth()]);
  const [year, setYear]           = useState(now.getFullYear());
  const [classFilter, setClass]   = useState('');
  const [sectionFilter, setSection] = useState('');
  const [statusFilter, setStatus] = useState('');
  const [students, setStudents]   = useState([]);
  const [summary, setSummary]     = useState({});
  const [loading, setLoading]     = useState(true);
  const [collectModal, setCollect] = useState(null);
  const [multiModal, setMultiModal] = useState(null);
  const [collecting, setCollecting] = useState(false);
  const [sending, setSending]       = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ month, year });
    if (classFilter)   params.append('class',   classFilter);
    if (sectionFilter) params.append('section', sectionFilter);
    if (statusFilter)  params.append('fee_status', statusFilter);

    API.get(`/fees/overview?${params}`)
      .then(r => {
        setStudents(r.data.students || []);
        setSummary(r.data.summary   || {});
      })
      .catch(() => toast.error('Failed to load fee data'))
      .finally(() => setLoading(false));
  }, [month, year, classFilter, sectionFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);



  const handleCollect = async (data) => {
    setCollecting(true);
    try {
      const payload = collectModal.fee_record && collectModal.fee_record.id
        ? { fee_id: collectModal.fee_record.id, amount: parseFloat(data.amount), payment_mode: data.payment_mode, remarks: data.remarks }
        : { student_id: collectModal.id, month, year: parseInt(year), amount: parseFloat(data.amount), payment_mode: data.payment_mode, remarks: data.remarks };

      const r = await API.post('/fees/collect', payload);
      toast.success('Payment collected!');
      if (r.data.receipt) generateFeeReceipt(r.data.fee, collectModal, settings);
      setCollect(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.');
    } finally { setCollecting(false); }
  };

  const handleMultiCollect = async (data) => {
    setCollecting(true);
    try {
      const r = await API.post('/fees/collect-multiple-months', {
        student_id:   multiModal.id,
        months:       data.months,
        year:         parseInt(year),
        payment_mode: data.payment_mode,
        remarks:      data.remarks,
      });
      toast.success(`Fees collected for ${data.months.length} months!`);
      if (r.data.receipt) generateFeeReceipt(r.data.fee, multiModal, settings);
      setMultiModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.');
    } finally { setCollecting(false); }
  };

  const handleSendReminders = async () => {
    if (!window.confirm('Send reminders to all students with pending fees?')) return;
    setSending(true);
    try {
      const res = await API.post('/fees/send-reminders');
      toast.success(`Successfully sent ${res.data.sentCount} reminders!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reminders.');
    } finally {
      setSending(false);
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  const f = 'border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white';

  return (
    <div className="space-y-5">
      {/* Header + controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Fees Management</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            All students appear here — including newly added ones
          </p>
        </div>
        <button
          onClick={handleSendReminders}
          disabled={sending}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
        >
          {sending ? (
            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
          )}
          Send Auto-Reminders
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Month */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Month</label>
            <select value={month} onChange={e => setMonth(e.target.value)} className={f}>
              {MONTHS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          {/* Year */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
            <select value={year} onChange={e => setYear(parseInt(e.target.value))} className={f}>
              {years.map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
          {/* Class */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
            <select value={classFilter} onChange={e => setClass(e.target.value)} className={f}>
              <option value="">All Classes</option>
              {CLASSES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          {/* Section */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Section</label>
            <select value={sectionFilter} onChange={e => setSection(e.target.value)} className={f}>
              <option value="">All</option>
              {SECTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select value={statusFilter} onChange={e => setStatus(e.target.value)} className={f}>
              <option value="">All</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
              <option value="not_generated">Not Generated</option>
            </select>
          </div>
          {/* Search */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Search Student</label>
            <input
              type="text"
              placeholder="Name or ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={f}
            />
          </div>
          {/* Reset */}
          <div className="flex items-end">
            <button
              onClick={() => { setClass(''); setSection(''); setStatus(''); setSearchQuery(''); }}
              className="w-full border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs px-3 py-2 rounded-xl transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Students',  val: summary.total         || 0,                      color: '' },
          { label: 'Paid',            val: summary.paid          || 0,                      color: 'text-green-600' },
          { label: 'Unpaid',          val: summary.unpaid        || 0,                      color: 'text-red-500' },
          { label: 'Partial',         val: summary.partial       || 0,                      color: 'text-yellow-600' },
          { label: 'Not Generated',   val: summary.not_generated || 0,                      color: 'text-gray-400' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <p className="text-xs text-gray-400 mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Collection summary */}
      {(summary.total_due > 0 || summary.total_paid > 0) && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-6">
          <div><p className="text-xs text-gray-400">Total Due</p><p className="text-lg font-bold">{formatCurrency(summary.total_due || 0)}</p></div>
          <div><p className="text-xs text-gray-400">Collected</p><p className="text-lg font-bold text-green-600">{formatCurrency(summary.total_paid || 0)}</p></div>
          <div><p className="text-xs text-gray-400">Pending</p><p className="text-lg font-bold text-red-500">{formatCurrency((summary.total_due || 0) - (summary.total_paid || 0))}</p></div>
          <div><p className="text-xs text-gray-400">Collection Rate</p>
            <p className={`text-lg font-bold ${summary.total_due > 0 && (summary.total_paid/summary.total_due) >= 0.8 ? 'text-green-600' : 'text-yellow-600'}`}>
              {summary.total_due > 0 ? Math.round((summary.total_paid / summary.total_due) * 100) : 0}%
            </p>
          </div>
        </div>
      )}

      {/* Students table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">
            {month} {year} — Fee Records
            <span className="ml-2 text-xs text-gray-400 font-normal">
              ({students.length} students)
            </span>
          </h3>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">Loading fee records...</div>
        ) : (() => {
            const filteredStudents = students.filter(s => {
              if (!searchQuery) return true;
              const q = searchQuery.toLowerCase();
              const name = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
              const sid = (s.student_id || '').toLowerCase();
              return name.includes(q) || sid.includes(q);
            });
            
            return filteredStudents.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">No records found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase tracking-wide text-xs">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Student</th>
                      <th className="py-3 px-4 font-semibold">Class</th>
                      <th className="py-3 px-4 font-semibold">Due</th>
                      <th className="py-3 px-4 font-semibold">Paid</th>
                      <th className="py-3 px-4 font-semibold">Balance</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map(s => {
                      const feeRec = s.fee_record;
                      const totalAmt = feeRec ? parseFloat(feeRec.total_amount) : 0;
                      const paidAmt  = feeRec ? parseFloat(feeRec.paid_amount)  : 0;
                      const balance  = totalAmt - paidAmt;

                      return (
                        <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                                {s.first_name?.[0]}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-gray-800 truncate">{s.first_name} {s.last_name}</p>
                                <p className="text-xs text-gray-400 font-mono">{s.student_id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-500 text-xs whitespace-nowrap">{s.class} - {s.section}</td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {feeRec ? formatCurrency(totalAmt) : <span className="text-gray-400">—</span>}
                          </td>
                          <td className="py-3 px-4 text-green-600 whitespace-nowrap">
                            {feeRec ? formatCurrency(paidAmt) : <span className="text-gray-400">—</span>}
                          </td>
                          <td className="py-3 px-4 text-red-500 whitespace-nowrap">
                            {feeRec && balance > 0 ? formatCurrency(balance) : <span className="text-gray-400">—</span>}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[s.fee_status] || statusColor.not_generated}`}>
                              {s.fee_status?.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex gap-2">
                              {s.fee_status === 'paid' ? (
                                <button
                                   onClick={() => generateFeeReceipt(feeRec, s, settings)}
                                   className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 font-medium"
                                 >
                                   Receipt
                                </button>
                              ) : (
                                <button
                                  onClick={() => setCollect(s)}
                                  className="text-xs bg-blue-500 text-white px-2.5 py-1 rounded-lg hover:bg-blue-600 font-medium"
                                >
                                  Collect
                                </button>
                              )}
                              <button
                                onClick={() => setMultiModal(s)}
                                className="text-xs border border-indigo-200 text-indigo-600 px-2.5 py-1 rounded-lg hover:bg-indigo-50 font-medium"
                              >
                                Multi-Month
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
        })()}
      </div>

      {/* Single month collect modal */}
      <Modal
        isOpen={!!collectModal}
        onClose={() => setCollect(null)}
        title={`Collect Fee — ${collectModal?.first_name} ${collectModal?.last_name || ''}`}
      >
        {collectModal && (
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-xl p-3 text-sm">
              <p className="text-gray-500">Month: <span className="font-medium text-gray-800">{month} {year}</span></p>
              <p className="text-gray-500 mt-1">Class: <span className="font-medium text-gray-800">{collectModal.class} - {collectModal.section}</span></p>
              {collectModal.fee_record && (
                <>
                  <div className="flex justify-between mt-2 pt-2 border-t border-gray-200">
                    <span className="text-gray-500">Total</span>
                    <span>{formatCurrency(collectModal.fee_record.total_amount)}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Paid</span>
                    <span>{formatCurrency(collectModal.fee_record.paid_amount)}</span>
                  </div>
                  <div className="flex justify-between text-red-500 font-semibold">
                    <span>Balance</span>
                    <span>{formatCurrency(collectModal.fee_record.total_amount - collectModal.fee_record.paid_amount)}</span>
                  </div>
                </>
              )}
              {!collectModal.fee_record && (
                <p className="text-yellow-600 text-xs mt-2">⚠️ No fee record yet — will be auto-created on collection.</p>
              )}
            </div>
            <FeeForm
              fee={collectModal.fee_record}
              onSubmit={handleCollect}
              loading={collecting}
            />
          </div>
        )}
      </Modal>

      {/* Multi-month collect modal */}
      <Modal
        isOpen={!!multiModal}
        onClose={() => setMultiModal(null)}
        title={`Multi-Month Payment — ${multiModal?.first_name} ${multiModal?.last_name || ''}`}
      >
        {multiModal && (
          <MultiMonthFeeForm
            student={multiModal}
            year={year}
            onSubmit={handleMultiCollect}
            loading={collecting}
          />
        )}
      </Modal>
    </div>
  );
}
