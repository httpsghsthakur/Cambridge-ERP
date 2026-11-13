import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CLASSES, SUBJECTS } from '../../constants/roles';

export default function StaffForm({ onSubmit, defaultValues = {}, loading = false }) {
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({ defaultValues });

  const parseInitialSubjects = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    return val.split(',').map(s => s.trim()).filter(Boolean);
  };

  const [selectedSubjects, setSelectedSubjects] = useState(() => parseInitialSubjects(defaultValues?.subject));
  const [customSubjectInput, setCustomSubjectInput] = useState('');
  const [subjectError, setSubjectError] = useState('');

  useEffect(() => {
    reset(defaultValues);
    setSelectedSubjects(parseInitialSubjects(defaultValues?.subject));
    setSubjectError('');
    setCustomSubjectInput('');
  }, [JSON.stringify(defaultValues)]);

  const selectedStaffType = watch('staff_type', defaultValues?.staff_type || 'Teacher');
  const isTeacher = selectedStaffType === 'Teacher';

  const handleAddSubject = (subjectName) => {
    const trimmed = (subjectName || '').trim();
    if (!trimmed) return;
    
    // Check if already in selectedSubjects (case-insensitive)
    const exists = selectedSubjects.some(s => s.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setSubjectError(`"${trimmed}" is already assigned.`);
      return;
    }

    setSelectedSubjects(prev => [...prev, trimmed]);
    setSubjectError('');
  };

  const handleRemoveSubject = (subjectName) => {
    setSelectedSubjects(prev => prev.filter(s => s !== subjectName));
    setSubjectError('');
  };

  const handleCustomSubjectAdd = () => {
    if (!customSubjectInput.trim()) return;
    handleAddSubject(customSubjectInput);
    setCustomSubjectInput('');
  };

  const handleFormSubmit = (data) => {
    if (isTeacher) {
      if (selectedSubjects.length === 0) {
        setSubjectError('At least one subject is required for teachers.');
        return;
      }
      data.subject = selectedSubjects.join(', ');
    } else {
      data.subject = '';
    }
    onSubmit(data);
  };

  const f = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all';
  const e = 'text-red-500 text-xs mt-0.5';
  const l = 'block text-xs font-medium text-gray-500 mb-1';

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label className={l}>Full Name *</label>
        <input {...register('name', { required: 'Required' })} className={f} placeholder="Mrs. Sunita Verma" />
        {errors.name && <p className={e}>{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={l}>Staff Type *</label>
          <select {...register('staff_type', { required: 'Required' })} className={f}>
            <option value="Teacher">Teacher</option>
            <option value="Principal">Principal</option>
            <option value="Vice Principal">Vice Principal</option>
            <option value="Accountant">Accountant</option>
            <option value="Fee Collector">Fee Collector</option>
            <option value="Receptionist">Receptionist</option>
            <option value="Clerk">Clerk</option>
            <option value="Librarian">Librarian</option>
            <option value="Lab Assistant">Lab Assistant</option>
            <option value="Sports Teacher">Sports Teacher</option>
            <option value="Driver">Driver</option>
            <option value="Helper">Helper</option>
            <option value="Security Guard">Security Guard</option>
            <option value="Office Staff">Office Staff</option>
            <option value="Other">Other</option>
          </select>
          {errors.staff_type && <p className={e}>{errors.staff_type.message}</p>}
        </div>
        <div>
          <label className={l}>Qualification</label>
          <input {...register('qualification')} className={f} placeholder="M.Sc, B.Ed" />
        </div>
      </div>

      {/* Multiple Subjects & Custom Subject Entry for Teachers */}
      {isTeacher && (
        <div className="bg-gray-50/80 border border-gray-200 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <span>Assigned Subjects *</span>
              <span className="text-[10px] font-normal text-gray-500">(Can teach multiple subjects)</span>
            </label>
            {selectedSubjects.length > 0 && (
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                {selectedSubjects.length} {selectedSubjects.length === 1 ? 'subject' : 'subjects'}
              </span>
            )}
          </div>

          {/* Current Selected Subjects Badges */}
          <div className="flex flex-wrap gap-1.5 min-h-[38px] items-center p-2 bg-white rounded-lg border border-gray-200">
            {selectedSubjects.length === 0 ? (
              <span className="text-xs text-gray-400 italic">
                No subjects assigned yet. Select from predefined subjects below or enter a custom subject.
              </span>
            ) : (
              selectedSubjects.map(sub => (
                <span
                  key={sub}
                  className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2.5 py-1 rounded-lg font-semibold shadow-xs"
                >
                  <span>{sub}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubject(sub)}
                    className="text-blue-400 hover:text-red-500 hover:bg-blue-100 rounded-full w-4 h-4 flex items-center justify-center transition-colors text-xs font-bold"
                    title={`Remove ${sub}`}
                  >
                    ×
                  </button>
                </span>
              ))
            )}
          </div>
          {subjectError && <p className="text-red-500 text-xs font-medium">{subjectError}</p>}

          {/* Predefined & Custom Subject Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">
                Select from Predefined Subjects
              </label>
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddSubject(e.target.value);
                  }
                }}
                className={f}
              >
                <option value="">-- Choose predefined subject --</option>
                {SUBJECTS.map(s => {
                  const isAdded = selectedSubjects.some(sub => sub.toLowerCase() === s.toLowerCase());
                  return (
                    <option key={s} value={s} disabled={isAdded}>
                      {s} {isAdded ? '✓ (Already assigned)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">
                Enter Custom Subject Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSubjectInput}
                  onChange={(e) => setCustomSubjectInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCustomSubjectAdd();
                    }
                  }}
                  placeholder="e.g. Sanskrit, Robotics, French..."
                  className={f}
                />
                <button
                  type="button"
                  onClick={handleCustomSubjectAdd}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap shadow-xs"
                  title="Add custom subject"
                >
                  + Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={l}>Phone *</label>
          <input {...register('phone', { required: 'Required' })} className={f} placeholder="9901234567" />
          {errors.phone && <p className={e}>{errors.phone.message}</p>}
        </div>
        <div>
          <label className={l}>Email</label>
          <input type="email" {...register('email')} className={f} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={l}>Join Date</label>
          <input type="date" {...register('join_date')} className={f} />
        </div>
        <div>
          <label className={l}>Status</label>
          <select {...register('status')} className={f}>
            <option value="active">Active</option>
            <option value="leave">On Leave</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={l}>Document Type</label>
          <select {...register('document_type')} className={f}>
            <option value="">Select Document</option>
            <option value="Aadhaar Card">Aadhaar Card</option>
            <option value="PAN Card">PAN Card</option>
            <option value="Driving License">Driving License</option>
            <option value="Passport">Passport</option>
            <option value="Voter ID">Voter ID</option>
            <option value="Employee ID">Employee ID</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className={l}>Document Number</label>
          <input {...register('document_number')} className={f} placeholder="Enter document number" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={l}>Login Password</label>
          <input type="text" {...register('password', { minLength: { value: 6, message: 'Minimum 6 characters' }})} className={f} placeholder="Leave blank to auto-generate" />
          {errors.password && <p className={e}>{errors.password.message}</p>}
        </div>
      </div>

      {isTeacher && (
        <div>
          <label className={l}>Assigned Classes</label>
          <div className="grid grid-cols-3 gap-2 mt-1">
            {CLASSES.map(c => (
              <label key={c} className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                <input type="checkbox" value={c} {...register('assigned_classes_arr')}
                  className="accent-blue-500" />
                {c}
              </label>
            ))}
          </div>
        </div>
      )}

      <button type="submit" disabled={loading}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
        {loading ? 'Saving...' : (defaultValues?.id ? 'Update Staff' : 'Add Staff')}
      </button>
    </form>
  );
}