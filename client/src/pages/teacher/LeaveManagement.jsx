import React, { useState, useEffect } from 'react';
import API from '../../utils/api';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

export default function LeaveManagement() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm();
  
  const startDate = watch('start_date');
  const endDate = watch('end_date');

  useEffect(() => {
    loadLeaves();
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end >= start) {
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setValue('total_days', diffDays);
      } else {
        setValue('total_days', 0);
      }
    }
  }, [startDate, endDate, setValue]);

  const loadLeaves = async () => {
    setLoading(true);
    try {
      const res = await API.get('/staff-leaves/my-leaves');
      setLeaves(res.data);
    } catch (err) {
      toast.error('Failed to load leave history.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('leave_type', data.leave_type);
      formData.append('start_date', data.start_date);
      formData.append('end_date', data.end_date);
      formData.append('total_days', data.total_days);
      formData.append('reason', data.reason);
      if (data.attachment && data.attachment[0]) {
        formData.append('attachment', data.attachment[0]);
      }

      await API.post('/staff-leaves', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Leave application submitted!');
      setShowModal(false);
      reset();
      loadLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit leave application.');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'leave_type', label: 'Leave Type', render: val => <span className="font-medium text-gray-800">{val}</span> },
    { key: 'start_date', label: 'From Date' },
    { key: 'end_date', label: 'To Date' },
    { key: 'total_days', label: 'Days' },
    { 
      key: 'status', label: 'Status',
      render: val => (
        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
          val === 'approved' ? 'bg-green-100 text-green-700' :
          val === 'rejected' ? 'bg-red-100 text-red-700' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {val.toUpperCase()}
        </span>
      )
    },
    { 
      key: 'admin_remarks', label: 'Remarks', 
      render: (val, row) => val ? <span className="text-xs text-gray-500">{val}</span> : <span className="text-xs text-gray-400">—</span> 
    }
  ];

  const f = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 transition-all';
  const l = 'block text-xs font-medium text-gray-500 mb-1';

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">My Leave Applications</h1>
        <button 
          onClick={() => { reset(); setShowModal(true); }}
          className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          + Apply for Leave
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <DataTable columns={columns} data={leaves} loading={loading} emptyText="No leave applications found." />
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Apply for Leave">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className={l}>Leave Type *</label>
            <select {...register('leave_type', { required: 'Required' })} className={f}>
              <option value="">Select Type</option>
              <option value="Casual">Casual</option>
              <option value="Sick">Sick</option>
              <option value="Medical">Medical</option>
              <option value="Emergency">Emergency</option>
              <option value="Half Day">Half Day</option>
              <option value="Other">Other</option>
            </select>
            {errors.leave_type && <p className="text-red-500 text-xs mt-1">{errors.leave_type.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={l}>From Date *</label>
              <input type="date" {...register('start_date', { required: 'Required' })} className={f} />
              {errors.start_date && <p className="text-red-500 text-xs mt-1">{errors.start_date.message}</p>}
            </div>
            <div>
              <label className={l}>To Date *</label>
              <input type="date" {...register('end_date', { required: 'Required' })} className={f} />
              {errors.end_date && <p className="text-red-500 text-xs mt-1">{errors.end_date.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={l}>Total Days</label>
              <input type="number" step="0.5" {...register('total_days')} className={f} readOnly />
            </div>
            <div>
              <label className={l}>Attachment (Optional)</label>
              <input type="file" accept=".pdf,.jpg,.png" {...register('attachment')} className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            </div>
          </div>

          <div>
            <label className={l}>Reason *</label>
            <textarea {...register('reason', { required: 'Required' })} className={f} rows="3" placeholder="Explain your reason for leave..."></textarea>
            {errors.reason && <p className="text-red-500 text-xs mt-1">{errors.reason.message}</p>}
          </div>

          <button type="submit" disabled={saving} className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
            {saving ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
