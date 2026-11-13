import { useState, useEffect } from 'react';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/helpers';

export default function MultiMonthFeeForm({ student, year, onSubmit, loading }) {
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [mode, setMode]                     = useState('cash');
  const [remarks, setRemarks]               = useState('');
  const [feeAmount, setFeeAmount]           = useState(2500);
  const [studentFees, setStudentFees]       = useState([]);
  const [fetchingFees, setFetchingFees]     = useState(true);

  useEffect(() => {
    // Fetch fee structure
    API.get(`/fees/structure/${student.class}`)
      .then(r => setFeeAmount(parseFloat(r.data?.monthly_fee || 2500)))
      .catch(() => {});

    // Fetch existing fees to determine paid/unpaid status
    setFetchingFees(true);
    API.get(`/fees/student/${student.id}`)
      .then(r => {
        // Filter fees for the current year
        const currentYearFees = r.data.filter(f => parseInt(f.year) === parseInt(year) && (f.fee_type === 'monthly' || f.fee_type === 'admission'));
        setStudentFees(currentYearFees);
      })
      .catch(() => toast.error('Failed to load student fee records.'))
      .finally(() => setFetchingFees(false));
  }, [student.id, student.class, year]);

  const MONTHS_LIST = ['January','February','March','April','May','June',
                       'July','August','September','October','November','December'];

  // Map month status: paid, unpaid, or lock (not allowed to select yet)
  const getMonthStatus = () => {
    const statuses = {};
    
    let lastPaidIndex = -1;
    let firstRecordIndex = -1;

    MONTHS_LIST.forEach((m, idx) => {
      const record = studentFees.find(f => f.month === m);
      if (record) {
        if (firstRecordIndex === -1) firstRecordIndex = idx;
        if (record.status === 'paid') lastPaidIndex = idx;
      }
    });

    MONTHS_LIST.forEach((m, idx) => {
      const record = studentFees.find(f => f.month === m);

      if (record && record.status === 'paid') {
        statuses[m] = 'paid';
      } else {
        const prevMonth = idx > 0 ? MONTHS_LIST[idx - 1] : null;

        if (lastPaidIndex !== -1) {
          // If there's a paid month, start unlocking right after the last paid month
          if (idx <= lastPaidIndex) {
            statuses[m] = 'locked';
          } else if (idx === lastPaidIndex + 1) {
            statuses[m] = 'unpaid';
          } else {
            if (prevMonth && selectedMonths.includes(prevMonth)) {
              statuses[m] = 'unpaid';
            } else {
              statuses[m] = 'locked';
            }
          }
        } else {
          // No paid months yet. Start from the very first month that has a record.
          const startIndex = firstRecordIndex !== -1 ? firstRecordIndex : 0;
          
          if (idx < startIndex) {
            statuses[m] = 'locked';
          } else if (idx === startIndex) {
            statuses[m] = 'unpaid';
          } else {
            if (prevMonth && selectedMonths.includes(prevMonth)) {
              statuses[m] = 'unpaid';
            } else {
              statuses[m] = 'locked';
            }
          }
        }
      }
    });

    return statuses;
  };

  const monthStatuses = getMonthStatus();

  const toggleMonth = (m) => {
    if (monthStatuses[m] === 'paid' || monthStatuses[m] === 'locked') return;

    setSelectedMonths(prev => {
      if (prev.includes(m)) {
        // Deselecting: we must also deselect any months AFTER this one
        const mIdx = MONTHS_LIST.indexOf(m);
        return prev.filter(x => MONTHS_LIST.indexOf(x) < mIdx);
      } else {
        // Selecting: ensure we are selecting the earliest available unpaid month
        return [...prev, m];
      }
    });
  };

  const handleSubmit = () => {
    if (!selectedMonths.length) return toast.error('Select at least one month.');
    onSubmit({
      months:       selectedMonths.map(m => ({ month: m, amount: feeAmount })),
      payment_mode: mode,
      remarks,
    });
  };

  const f = 'border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 bg-white w-full';

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
        Monthly fee for {student.class}: <strong>{formatCurrency(feeAmount)}</strong>
      </div>

      {fetchingFees ? (
        <p className="text-center text-gray-400 text-xs py-4">Checking fee records...</p>
      ) : (
        <>
          {/* Month selection grid */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              Select Months for {year} (Sequential Payment Required)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {MONTHS_LIST.map(m => {
                const status = monthStatuses[m];
                let btnStyle = '';
                
                if (status === 'paid') {
                  btnStyle = 'bg-green-100 text-green-700 border-green-200 cursor-not-allowed opacity-70';
                } else if (status === 'locked') {
                  btnStyle = 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50';
                } else if (selectedMonths.includes(m)) {
                  btnStyle = 'bg-blue-500 text-white border-blue-500';
                } else {
                  btnStyle = 'border-gray-200 text-gray-600 hover:bg-blue-50 cursor-pointer';
                }

                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleMonth(m)}
                    disabled={status === 'paid' || status === 'locked'}
                    className={`py-2 px-2 rounded-xl text-xs font-medium border transition-all flex flex-col items-center justify-center gap-0.5 ${btnStyle}`}
                  >
                    <span>{m.slice(0, 3)}</span>
                    {status === 'paid' && <span className="text-[9px] uppercase font-bold tracking-widest">Paid</span>}
                    {status === 'locked' && (
                      <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedMonths.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-3 text-sm border border-gray-200">
              <div className="flex justify-between font-semibold text-gray-800">
                <span>Total Due ({selectedMonths.length} months)</span>
                <span className="text-blue-600 text-lg">{formatCurrency(selectedMonths.length * feeAmount)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 font-medium">{selectedMonths.join(', ')}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Payment Mode</label>
            <select value={mode} onChange={e => setMode(e.target.value)} className={f}>
              <option value="cash">Cash</option>
              <option value="online">Online / UPI</option>
              <option value="cheque">Cheque</option>
              <option value="dd">Demand Draft</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Remarks (Optional)</label>
            <input value={remarks} onChange={e => setRemarks(e.target.value)}
              className={f} placeholder="Enter transaction ID or remarks" />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || selectedMonths.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-colors mt-2"
          >
            {loading ? 'Processing...' : `Collect ${formatCurrency(selectedMonths.length * feeAmount)}`}
          </button>
        </>
      )}
    </div>
  );
}
