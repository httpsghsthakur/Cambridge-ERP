import { useState, useEffect } from 'react';
import API from '../../utils/api';
import { formatCurrency } from '../../utils/helpers';

export default function StudentFeeWidget({ studentId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    API.get(`/fc/students/${studentId}/details`)
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return <p className="text-xs text-gray-500">Loading fee details...</p>;
  if (!data) return <p className="text-xs text-red-500">Could not load fee details.</p>;

  const { summary, fees } = data;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Total Due</p>
          <p className="font-bold text-gray-800">{formatCurrency(summary.total_due)}</p>
        </div>
        <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-200">
          <p className="text-[10px] text-emerald-600 uppercase tracking-wider mb-0.5">Paid</p>
          <p className="font-bold text-emerald-700">{formatCurrency(summary.total_collected)}</p>
        </div>
        <div className="bg-red-50 p-2 rounded-lg border border-red-200">
          <p className="text-[10px] text-red-600 uppercase tracking-wider mb-0.5">Pending</p>
          <p className="font-bold text-red-700">{formatCurrency(summary.total_pending)}</p>
        </div>
      </div>
      {fees && fees.length > 0 && (
        <div className="mt-2 text-xs">
          <p className="text-gray-500 mb-1 font-semibold uppercase text-[10px] tracking-wider">Fee Records:</p>
          <ul className="space-y-1.5">
            {fees.map(f => (
              <li key={f.id} className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                <span className="text-gray-600 font-medium">{f.fee_type === 'admission' ? 'Admission Fee' : `${f.month} ${f.year}`}</span>
                <span className={`font-bold ${f.status === 'paid' ? 'text-green-600' : 'text-red-500'}`}>
                  {f.status.toUpperCase()} ({formatCurrency(f.total_amount)})
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
