import { useEffect, useMemo, useState } from 'react';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';
import { CLASSES } from '../../constants/roles';
import Receipt from '../../components/Receipt';
import FeeForm from '../../components/forms/FeeForm';
import MultiMonthFeeForm from '../../components/forms/MultiMonthFeeForm';
import { generateFeeReceipt } from '../../utils/pdfGenerator';
import { formatCurrency, feeStatusColor } from '../../utils/helpers';
import { useSettings } from '../../context/SettingsContext';

export default function FCCollect() {
  const { settings } = useSettings() || {};
  const [query, setQuery]         = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [students, setStudents]   = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected]   = useState(null);   // student details
  const [detailModal, setDetailModal] = useState(false);
  const [feeModal, setFeeModal]   = useState(null);   // fee record to collect
  const [collecting, setCollecting] = useState(false);
  const [whatsappLoading, setWaLoading] = useState(false);
  const [receiptModal, setReceiptModal] = useState(null);
  const [multiModal, setMultiModal] = useState(null);

  const classes = useMemo(() => CLASSES, []);
  const sections = ['A', 'B', 'C'];

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      if (!query.trim() && !classFilter && !sectionFilter) {
        setStudents([]);
        return;
      }

      setSearching(true);
      try {
        const params = new URLSearchParams({ limit: '20' });
        if (query.trim()) params.append('search', query.trim());
        if (classFilter) params.append('class', classFilter);
        if (sectionFilter) params.append('section', sectionFilter);

        const response = await API.get(`/fc/students?${params.toString()}`, { signal: controller.signal });
        setStudents(response.data || []);
      } catch (err) {
        if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
          toast.error('Search failed.');
        }
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [query, classFilter, sectionFilter]);

  const buildReceiptPayload = (fee, student) => ({
    student_name: `${student?.first_name || ''} ${student?.last_name || ''}`.trim(),
    class: student?.class || '',
    section: student?.section || '',
    fee_type: fee?.fee_type || 'monthly',
    total_amount: Number(fee?.total_amount || 0),
    paid_amount: Number(fee?.paid_amount || 0),
    payment_mode: fee?.payment_mode || '',
    receipt_number: fee?.receipt_number || '',
    date: fee?.paid_date || new Date().toISOString().split('T')[0],
    collected_by: fee?.collectedByUser?.name || 'System',
    school: {
      name: 'EduSmart Public School',
      address: '123 Education Lane, Knowledge City',
      phone: '+91 9999999999',
      email: 'info@edusmartschool.com',
    },
    student: {
      name: `${student?.first_name || ''} ${student?.last_name || ''}`.trim(),
      class: `${student?.class || '—'} - ${student?.section || '—'}`,
      parent_name: student?.parent_name || '',
      phone: student?.parent_phone || '',
    },
    payment: {
      fee_type: fee?.fee_type || 'monthly',
      total_amount: Number(fee?.total_amount || 0),
      paid_amount: Number(fee?.paid_amount || 0),
      payment_mode: fee?.payment_mode || '',
      status: fee?.status || 'paid',
    },
    fee_breakdown: fee?.fee_breakdown || { [fee?.fee_type || 'fee']: Number(fee?.paid_amount || fee?.total_amount || 0) },
  });

  const loadDetails = async (student) => {
    try {
      const r = await API.get(`/fc/students/${student.id}/details`);
      setSelected(r.data);
      setDetailModal(true);
    } catch { toast.error('Failed to load student details.'); }
  };

  const handleCollect = async (data) => {
    setCollecting(true);
    try {
      const r = await API.post('/fc/collect', {
        fee_id:       feeModal.id,
        student_id:   feeModal.student_id,
        month:        feeModal.month,
        year:         feeModal.year,
        amount:       parseFloat(data.amount),
        payment_mode: data.payment_mode,
        remarks:      data.remarks,
      });
      toast.success('Fee collected!');
      setReceiptModal(r.data.receipt);
      generateFeeReceipt(r.data.fee, feeModal.student, settings);
      setFeeModal(null);
      if (selected?.student) {
        const updated = await API.get(`/fc/students/${selected.student.id}/details`);
        setSelected(updated.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.');
    } finally { setCollecting(false); }
  };

  const handleMultiCollect = async (data) => {
    setCollecting(true);
    try {
      const r = await API.post('/fc/collect-multiple-months', {
        student_id:   multiModal.id,
        months:       data.months,
        year:         new Date().getFullYear(),
        payment_mode: data.payment_mode,
        remarks:      data.remarks,
      });
      toast.success(`Fees collected for ${data.months.length} months!`);
      if (r.data.receipt) {
        setReceiptModal(r.data.receipt);
        generateFeeReceipt(r.data.fee, multiModal, settings);
      }
      setMultiModal(null);
      if (selected?.student) {
        const updated = await API.get(`/fc/students/${selected.student.id}/details`);
        setSelected(updated.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.');
    } finally { setCollecting(false); }
  };

  const sendWhatsApp = async (studentId, type) => {
    setWaLoading(true);
    try {
      const r = await API.post('/fc/notify-whatsapp', { student_id: studentId, message_type: type });
      toast.success('WhatsApp message sent!');
      alert(` WhatsApp Preview:\n\nTo: ${r.data.phone}\n\n${r.data.preview}`);
    } catch { toast.error('Failed to send WhatsApp.'); }
    finally { setWaLoading(false); }
  };

  const statusBadge = (status) => {
    const map = {
      paid:      'bg-green-100 text-green-700',
      unpaid:    'bg-red-100 text-red-700',
      partial:   'bg-yellow-100 text-yellow-700',
      no_record: 'bg-gray-100 text-gray-500',
    };
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] || map.no_record}`}>{status.replace('_', ' ')}</span>;
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h2 className="text-lg font-bold text-gray-800">Collect Fees</h2>
        <p className="text-gray-400 text-sm mt-0.5">Search a student to view fee status and collect payment</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="md:col-span-1">
            <label className="mb-1 block text-xs font-medium text-gray-500">Class</label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Section</label>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All Sections</option>
              {sections.map((section) => (
                <option key={section} value={section}>
                  {section}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <label className="mb-1 block text-xs font-medium text-gray-500">Search Student</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
              </div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Name, ID or phone..."
                className="w-full rounded-xl border border-gray-200 py-3 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              {searching && (
                <div className="absolute inset-y-0 right-3 flex items-center">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        {students.length > 0 && (
          <div className="mt-3 space-y-2 max-h-72 overflow-y-auto">
            {students.map(s => (
              <div
                key={s.id}
                onClick={() => loadDetails(s)}
                className="flex items-center justify-between p-3 bg-gray-50 hover:bg-blue-50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-blue-200"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 text-sm font-bold flex items-center justify-center flex-shrink-0">
                    {s.first_name?.[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">{s.first_name} {s.last_name}</p>
                    <p className="text-xs text-gray-400">{s.student_id} · {s.class} {s.section} · {s.parent_phone}</p>
                  </div>
                </div>
                {statusBadge(s.fee_status_now)}
              </div>
            ))}
          </div>
        )}

        {(query.length >= 2 || classFilter || sectionFilter) && students.length === 0 && !searching && (
          <p className="text-center text-gray-400 text-sm py-6">No students found.</p>
        )}
      </div>

      {/* Student detail modal */}
      <Modal isOpen={detailModal} onClose={() => setDetailModal(false)} title="Student Fee Details" size="lg">
        {selected && (
          <div className="space-y-4">
            {/* Student info */}
            <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 text-xl font-bold flex items-center justify-center flex-shrink-0">
                {selected.student.first_name?.[0]}
              </div>
              <div className="flex-1 space-y-1">
                <p className="font-bold text-gray-800 text-base">{selected.student.first_name} {selected.student.last_name}</p>
                <div className="grid grid-cols-2 gap-1 text-xs text-gray-500">
                  <span>ID: <span className="text-gray-700 font-mono">{selected.student.student_id}</span></span>
                  <span>Class: <span className="text-gray-700">{selected.student.class} - {selected.student.section}</span></span>
                  <span>Parent: <span className="text-gray-700">{selected.student.parent_name}</span></span>
                  <span>Phone: <span className="text-gray-700 font-medium">{selected.student.parent_phone}</span></span>
                </div>
              </div>
              {/* WhatsApp buttons */}
              <div className="flex sm:flex-col gap-2">
                <button
                  onClick={() => sendWhatsApp(selected.student.id, 'fee_reminder')}
                  disabled={whatsappLoading}
                  className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
                >
                   Reminder
                </button>
                <button
                  onClick={() => sendWhatsApp(selected.student.id, 'payment_confirm')}
                  disabled={whatsappLoading}
                  className="flex items-center gap-1.5 border border-green-500 text-green-600 hover:bg-green-50 text-xs font-medium px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
                >
                   Confirm
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total Due',  val: formatCurrency(selected.summary.total_due),       color: 'text-gray-800' },
                { label: 'Paid',       val: formatCurrency(selected.summary.total_collected), color: 'text-green-600' },
                { label: 'Pending',    val: formatCurrency(selected.summary.total_pending),   color: 'text-red-500' },
              ].map(s => (
                <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-3 text-center">
                  <p className="text-[11px] text-gray-400">{s.label}</p>
                  <p className={`font-bold text-sm mt-0.5 ${s.color}`}>{s.val}</p>
                </div>
              ))}
            </div>

            {/* Fee records */}
            <div className="flex justify-between items-end mb-2 mt-4">
              <h4 className="font-semibold text-gray-700 text-sm">Fee Records</h4>
              <button
                onClick={() => setMultiModal(selected.student)}
                className="text-xs bg-indigo-500 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-600 font-medium transition-colors"
              >
                Multi-Month Payment
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: 400 }}>
                <thead className="bg-gray-50">
                  <tr>
                    {['Month', 'Total', 'Paid', 'Status', 'Action'].map(h => (
                      <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selected.fees.map(f => (
                    <tr key={f.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 px-3 font-medium">
                        {f.fee_type === 'admission' ? `Admission + ${f.month}` : 
                         f.fee_type === 'session_start' ? `Session Fee + ${f.month}` : 
                         f.month}
                      </td>
                      <td className="py-2.5 px-3">₹{Number(f.total_amount).toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-green-600">₹{Number(f.paid_amount).toLocaleString()}</td>
                      <td className="py-2.5 px-3">{statusBadge(f.status)}</td>
                      <td className="py-2.5 px-3">
                        {f.status !== 'paid' ? (
                          <button
                            onClick={() => { setFeeModal({ ...f, student: selected.student }); }}
                            className="text-xs bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600"
                          >
                            Collect
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setReceiptModal(buildReceiptPayload(f, selected.student));
                              generateFeeReceipt(f, selected.student, settings);
                            }}
                            className="text-xs text-blue-500 hover:text-blue-700 font-medium"
                          >
                            Receipt
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {/* Fee collection modal */}
      <Modal
        isOpen={!!feeModal}
        onClose={() => setFeeModal(null)}
        title={`Collect Payment — ${feeModal?.fee_type === 'admission' ? 'Admission + ' + feeModal?.month : feeModal?.fee_type === 'session_start' ? 'Session Fee + ' + feeModal?.month : feeModal?.month}`}
      >
        <FeeForm fee={feeModal} onSubmit={handleCollect} loading={collecting} />
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
            year={new Date().getFullYear()}
            onSubmit={handleMultiCollect}
            loading={collecting}
          />
        )}
      </Modal>

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
