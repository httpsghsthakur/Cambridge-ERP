import { useSettings } from '../context/SettingsContext';

export default function Receipt({ receipt, onPrint, onClose }) {
  const { settings } = useSettings() || {};
  const schoolName = settings?.school_name || receipt?.school?.name || 'EduSmart Public School';
  const schoolAddress = settings?.school_address || receipt?.school?.address || '';
  const schoolPhone = settings?.school_phone || receipt?.school?.phone || '';
  const schoolEmail = settings?.school_email || receipt?.school?.email || '';
  const footerNote = settings?.receipt_footer || 'This is a computer-generated receipt. No signature required.';

  if (!receipt) return null;

  const isAdmission = receipt.fee_type === 'admission' || receipt.payment?.fee_type === 'admission';

  const isSessionStart = receipt.fee_type === 'session_start' || receipt.payment?.fee_type === 'session_start';

  const rawBreakdown = typeof receipt.fee_breakdown === 'string'
    ? (() => { try { return JSON.parse(receipt.fee_breakdown); } catch { return {}; } })()
    : (receipt.fee_breakdown || {});
  const breakdown = Object.entries(rawBreakdown || {}).filter(
    ([key, value]) =>
      key !== 'transactions' &&
      (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))))
  );

  const baseTotal = Number(receipt.total_amount ?? receipt.payment?.total_amount ?? 0);
  const lateFee = Number(receipt.late_fee_amount ?? receipt.payment?.late_fee_amount ?? 0);
  const netPayable = Number(receipt.net_payable ?? receipt.payment?.net_payable ?? (baseTotal + lateFee));
  const paidAmount = Number(receipt.paid_amount ?? receipt.payment?.paid_amount ?? 0);
  const balanceDue = Math.max(0, Number(receipt.balance ?? receipt.payment?.balance ?? (netPayable - paidAmount)));

  return (
    <div className="space-y-4 print:space-y-3">
      <div className="flex items-start justify-between gap-3 print:hidden">
        <div>
          <h3 className={`text-lg font-bold ${isAdmission ? 'text-purple-800' : isSessionStart ? 'text-blue-800' : 'text-gray-800'}`}>
            {isAdmission ? 'Admission Receipt' : isSessionStart ? 'Session Fee Receipt' : 'Fee Receipt'}
          </h3>
          <p className="text-sm text-gray-500">Printable receipt layout for fee collection.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onPrint}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Print
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-gray-300 bg-white p-6 print:border print:rounded-none print:p-4">
        <div className="border-b border-gray-200 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {settings?.school_logo_url && (
                <img 
                  src={settings.school_logo_url} 
                  alt="School Logo" 
                  className="h-16 w-16 object-contain"
                />
              )}
              <div>
                <p className="text-2xl font-bold tracking-wide text-gray-900">{schoolName}</p>
                <p className="mt-1 text-sm text-gray-500">{schoolAddress}</p>
                <p className="text-sm text-gray-500">
                  {schoolPhone} {schoolEmail ? `| ${schoolEmail}` : ''}
                </p>
              </div>
            </div>
            <div className={`rounded-xl border px-4 py-2 text-right ${isAdmission ? 'border-purple-200 bg-purple-50' : 'border-blue-200 bg-blue-50'}`}>
              <p className={`text-xs font-semibold uppercase tracking-wider ${isAdmission ? 'text-purple-700' : 'text-blue-700'}`}>Receipt No.</p>
              <p className={`text-sm font-bold ${isAdmission ? 'text-purple-900' : 'text-blue-900'}`}>{receipt.receipt_number || 'Pending'}</p>
              <p className={`mt-1 text-xs ${isAdmission ? 'text-purple-700' : 'text-blue-700'}`}>{receipt.date || receipt.receipt_date || '—'}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Student Details</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Name</span>
                <span className="font-medium text-gray-800">{receipt.student_name || receipt.student?.name || '—'}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Class</span>
                <span className="font-medium text-gray-800">
                  {receipt.class && receipt.section ? `${receipt.class} - ${receipt.section}` : receipt.student?.class || '—'}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Parent</span>
                <span className="font-medium text-gray-800">{receipt.student?.parent_name || '—'}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Phone</span>
                <span className="font-medium text-gray-800">{receipt.student?.phone || '—'}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Payment Details</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Fee Type</span>
                <span className="font-medium capitalize text-gray-800">{receipt.fee_type || receipt.payment?.fee_type || '—'}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Payment Mode</span>
                <span className="font-medium uppercase text-gray-800">{receipt.payment_mode || receipt.payment?.payment_mode || '—'}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Collected By</span>
                <span className="font-medium text-gray-800">{receipt.collected_by || '—'}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Status</span>
                <span className="font-medium capitalize text-gray-800">{receipt.payment?.status || 'paid'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">Particular</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.length > 0 ? (
                breakdown.map(([key, value]) => (
                  <tr key={key} className="border-t border-gray-100">
                    <td className="px-4 py-3 capitalize text-gray-700">{String(key).replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      Rs. {Number(value || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="border-t border-gray-100">
                  <td className="px-4 py-3 text-gray-700 capitalize">{receipt.fee_type || receipt.payment?.fee_type || 'fee'}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    Rs. {Number(receipt.total_amount || receipt.payment?.total_amount || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className={isAdmission ? 'bg-purple-50' : 'bg-blue-50'}>
              {lateFee > 0 && (
                <tr className="border-t border-gray-200/70 bg-white">
                  <td className="px-4 py-2 text-xs text-gray-600">Late Fee</td>
                  <td className="px-4 py-2 text-right text-xs font-semibold text-amber-700">
                    Rs. {lateFee.toLocaleString('en-IN')}
                  </td>
                </tr>
              )}
              <tr className="border-t border-gray-200/70">
                <td className="px-4 py-2 text-xs font-semibold text-gray-600">Total Payable</td>
                <td className="px-4 py-2 text-right text-sm font-semibold text-gray-800">
                  Rs. {netPayable.toLocaleString('en-IN')}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-semibold text-gray-800">Cleared / Paid Amount</td>
                <td className={`px-4 py-2.5 text-right text-lg font-bold ${isAdmission ? 'text-purple-900' : 'text-blue-900'}`}>
                  Rs. {paidAmount.toLocaleString('en-IN')}
                </td>
              </tr>
              <tr className="border-t border-gray-200/70 bg-white">
                <td className="px-4 py-2 text-xs font-semibold text-gray-600">Balance Due</td>
                <td className={`px-4 py-2 text-right text-sm font-bold ${balanceDue > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  Rs. {balanceDue.toLocaleString('en-IN')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="mt-5 text-center text-xs text-gray-500">
          {footerNote}
        </p>
      </div>
    </div>
  );
}
