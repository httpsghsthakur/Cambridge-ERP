import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { formatCurrency } from '../../utils/helpers';

export default function FeeForm({ fee, onSubmit, loading = false }) {
  const balance = parseFloat(fee?.total_amount || 0) - parseFloat(fee?.paid_amount || 0);
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { amount: balance, payment_mode: 'cash', remarks: '' }
  });

  useEffect(() => { reset({ amount: balance, payment_mode: 'cash', remarks: '' }); }, [fee?.id]);

  const f = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 text-sm">
        <div className="flex justify-between text-gray-500"><span>Total Fee</span><span className="font-medium text-gray-700">{formatCurrency(fee?.total_amount)}</span></div>
        <div className="flex justify-between text-green-600"><span>Already Paid</span><span>{formatCurrency(fee?.paid_amount)}</span></div>
        <div className="flex justify-between text-red-500 font-semibold border-t border-gray-200 pt-1.5">
          <span>Balance Due</span><span>{formatCurrency(balance)}</span>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Amount to Collect *</label>
        <input type="number" step="0.01" max={balance} {...register('amount', { required: true, min: 1 })}
          className={f} />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Payment Mode</label>
        <select {...register('payment_mode')} className={f}>
          <option value="cash">Cash</option>
          <option value="online">Online Transfer / UPI</option>
          <option value="cheque">Cheque</option>
          <option value="dd">Demand Draft</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Remarks (optional)</label>
        <input {...register('remarks')} className={f} placeholder="e.g. Partial payment for April" />
      </div>

      <div className="flex gap-2">
        <button type="submit" disabled={loading}
          className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
          {loading ? 'Processing...' : '✓ Collect & Print Receipt'}
        </button>
      </div>
    </form>
  );
}