import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import API from '../../utils/api';
import { CLASSES, SECTIONS } from '../../constants/roles';

export default function StudentForm({ onSubmit, defaultValues = {}, loading = false }) {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({ defaultValues });
  useEffect(() => { reset(defaultValues); }, [JSON.stringify(defaultValues)]);

  const [feeStructures, setFeeStructures] = useState([]);
  useEffect(() => {
    // Only fetch fee structures if we are adding a new student
    if (!defaultValues?.id) {
      API.get('/fees/structure')
        .then(res => setFeeStructures(res.data))
        .catch(() => {});
    }
  }, [defaultValues?.id]);

  const selectedClass = watch('class');
  const selectedFeeStruct = feeStructures.find(s => s.class === selectedClass);
  const admissionFee = selectedFeeStruct?.admission_fee || 0;

  const f = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all';
  const e = 'text-red-500 text-xs mt-1';
  const l = 'block text-xs font-medium text-gray-500 mb-1.5';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name — stacked on mobile, side-by-side on sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={l}>First Name *</label>
          <input {...register('first_name', { required: 'Required' })} className={f} placeholder="Aanya" />
          {errors.first_name && <p className={e}>{errors.first_name.message}</p>}
        </div>
        <div>
          <label className={l}>Last Name *</label>
          <input {...register('last_name', { required: 'Required' })} className={f} placeholder="Sharma" />
          {errors.last_name && <p className={e}>{errors.last_name.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div>
          <label className={l}>Class *</label>
          <select {...register('class', { required: 'Required' })} className={f}>
            <option value="">Select</option>
            {CLASSES.map(c => <option key={c}>{c}</option>)}
          </select>
          {errors.class && <p className={e}>{errors.class.message}</p>}
        </div>
        <div>
          <label className={l}>Section *</label>
          <select {...register('section', { required: 'Required' })} className={f}>
            <option value="">Select</option>
            {SECTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className={l}>Roll No.</label>
          <input type="number" {...register('roll_number')} className={f} placeholder="1" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={l}>Gender</label>
          <select {...register('gender')} className={f}>
            <option value="">Select</option>
            <option>Male</option><option>Female</option><option>Other</option>
          </select>
        </div>
        <div>
          <label className={l}>Date of Birth</label>
          <input type="date" {...register('date_of_birth')} className={f} />
        </div>
      </div>

      {!defaultValues?.id && selectedClass && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-2">
          <p className="text-sm font-medium text-blue-800">Admission Details</p>
          <div className="mt-2 flex justify-between items-center text-sm">
            <span className="text-blue-600">Admission Fee (One-time)</span>
            <span className="font-semibold text-blue-900">
              {admissionFee > 0 ? `₹${admissionFee}` : 'No Fee'}
            </span>
          </div>
          <p className="text-xs text-blue-500 mt-1">This fee is non-editable and set by the administrator for this class.</p>
        </div>
      )}

      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Parent / Guardian
        </p>
        <div className="space-y-3">
          <div>
            <label className={l}>Parent Name *</label>
            <input {...register('parent_name', { required: 'Required' })} className={f} placeholder="Rajesh Sharma" />
            {errors.parent_name && <p className={e}>{errors.parent_name.message}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={l}>Phone *</label>
              <input
                {...register('parent_phone', {
                  required: 'Required',
                  pattern: { value: /^[6-9]\d{9}$/, message: 'Invalid number' }
                })}
                className={f}
                placeholder="9812345678"
              />
              {errors.parent_phone && <p className={e}>{errors.parent_phone.message}</p>}
            </div>
            <div>
              <label className={l}>Email</label>
              <input type="email" {...register('parent_email')} className={f} placeholder="parent@email.com" />
            </div>
          </div>
          <div>
            <label className={l}>Address</label>
            <textarea {...register('parent_address')} rows={2} className={f} placeholder="Full address" />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors mt-2"
      >
        {loading ? 'Saving...' : (defaultValues?.id ? 'Update Student' : 'Add Student')}
      </button>
    </form>
  );
}