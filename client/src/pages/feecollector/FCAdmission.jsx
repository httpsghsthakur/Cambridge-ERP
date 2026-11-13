import { useForm } from 'react-hook-form';
import API from '../../utils/api';
import { CLASSES } from '../../constants/roles';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function FCAdmission() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [saving, setSaving] = useState(false);
  const [credentials, setCredentials] = useState(null);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const payload = {
        first_name: data.first_name,
        last_name: data.last_name,
        date_of_birth: data.date_of_birth,
        gender: data.gender,
        applying_class: data.applying_class,
        parent_name: data.parent_name,
        parent_phone: data.parent_phone,
        parent_email: data.parent_email,
        parent_address: data.parent_address,
        previous_school: data.previous_school,
        admission_fee_paid: parseFloat(data.admission_fee_paid || 0),
      };
      await API.post('/fc/admission-request', payload);
      setCredentials(null);
      toast.success('Admission request submitted successfully!');
      reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit.');
    } finally { setSaving(false); }
  };

  const f = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all';
  const l = 'block text-xs font-medium text-gray-500 mb-1.5';
  const e = 'text-red-500 text-xs mt-1';

  return (
    <div className="max-w-2xl">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-gray-800">New Admission Request</h2>
        <p className="text-gray-400 text-sm mt-0.5">Fill in student details. Admin will approve and create the student account.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
        {credentials && (
          <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
            <p className="font-semibold">Generated login credentials</p>
            <p>Email: <span className="font-mono">{credentials.email}</span></p>
            <p>Password: <span className="font-mono">{credentials.password}</span></p>
            <p className="text-xs mt-1">Login activates only after admin approval.</p>
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Student details */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Student Details</p>

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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={l}>Applying for Class *</label>
              <select {...register('applying_class', { required: 'Required' })} className={f}>
                <option value="">Select</option>
                {CLASSES.map(c => <option key={c}>{c}</option>)}
              </select>
              {errors.applying_class && <p className={e}>{errors.applying_class.message}</p>}
            </div>
            <div>
              <label className={l}>Section</label>
              <select {...register('section')} className={f}>
                <option>A</option><option>B</option><option>C</option>
              </select>
            </div>
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

          <div>
            <label className={l}>Previous School</label>
            <input {...register('previous_school')} className={f} placeholder="Previous school name (if any)" />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Parent / Guardian</p>

            <div>
              <label className={l}>Parent Name *</label>
              <input {...register('parent_name', { required: 'Required' })} className={f} />
              {errors.parent_name && <p className={e}>{errors.parent_name.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className={l}>Phone *</label>
                <input {...register('parent_phone', {
                  required: 'Required',
                  pattern: { value: /^[6-9]\d{9}$/, message: 'Invalid number' }
                })} className={f} placeholder="9812345678" />
                {errors.parent_phone && <p className={e}>{errors.parent_phone.message}</p>}
              </div>
              <div>
                <label className={l}>Email</label>
                <input type="email" {...register('parent_email')} className={f} />
              </div>
            </div>

            <div className="mt-3">
              <label className={l}>Address</label>
              <textarea {...register('parent_address')} rows={2} className={f} />
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
            {saving ? 'Submitting...' : ' Submit Admission Request'}
          </button>
        </form>
      </div>
    </div>
  );
}
