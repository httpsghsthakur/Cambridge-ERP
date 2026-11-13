import { useForm } from 'react-hook-form';

export default function NotificationForm({ onSubmit, loading = false }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const submit = async (data) => {
    await onSubmit(data);
    reset();
  };

  const f = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all';
  const e = 'text-red-500 text-xs mt-0.5';
  const l = 'block text-xs font-medium text-gray-500 mb-1';

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div>
        <label className={l}>Title *</label>
        <input {...register('title', { required: 'Required' })} className={f} placeholder="e.g. Fee Reminder — April" />
        {errors.title && <p className={e}>{errors.title.message}</p>}
      </div>

      <div>
        <label className={l}>Message *</label>
        <textarea {...register('message', { required: 'Required' })} rows={4}
          className={f} placeholder="Write your announcement here..." />
        {errors.message && <p className={e}>{errors.message.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={l}>Type</label>
          <select {...register('type')} className={f}>
            <option value="general">General</option>
            <option value="fee_reminder">Fee Reminder</option>
            <option value="attendance_alert">Attendance Alert</option>
            <option value="result">Exam / Result</option>
            <option value="holiday">Holiday</option>
          </select>
        </div>
        <div>
          <label className={l}>Send To</label>
          <select {...register('recipient_role')} className={f}>
            <option value="all">Everyone</option>
            <option value="students">Students Only</option>
            <option value="parents">Parents Only</option>
            <option value="teachers">Teachers Only</option>
          </select>
        </div>
      </div>

      <button type="submit" disabled={loading}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
        {loading ? 'Sending...' : ' Send Notification'}
      </button>
    </form>
  );
}