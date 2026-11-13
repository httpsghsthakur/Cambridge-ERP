import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';
import toast from 'react-hot-toast';

export default function MyProfilePage() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [showPwModal, setShowPwModal] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const fileRef = useRef(null);

  // Fetch profile data
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data } = await API.get('/profile/me');
      setProfile(data);
      setForm({ name: data.name || '', phone: data.phone || '' });
    } catch (err) {
      toast.error('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  // Handle avatar upload
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 5 MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const { data } = await API.post('/profile/avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Profile photo updated!');
      setProfile((prev) => ({ ...prev, profile_photo: data.profile_photo }));
      // Update global user state so TopBar/Sidebar reflect the change immediately
      setUser((prev) => ({ ...prev, profile_photo: data.profile_photo }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload photo.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  // Handle profile update
  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      const { data } = await API.put('/profile/update', form);
      toast.success('Profile updated!');
      setProfile(data.user);
      setForm({ name: data.user.name || '', phone: data.user.phone || '' });
      setUser((prev) => ({ ...prev, name: data.user.name, phone: data.user.phone }));
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }
    setPwSaving(true);
    try {
      const { data } = await API.put('/auth/change-password', pwForm);
      toast.success('Password changed successfully.');
      setShowPwModal(false);
      setPwForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setPwSaving(false);
    }
  };

  // Build avatar URL
  const avatarUrl = profile?.profile_photo
    ? `${process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : ''}${profile.profile_photo}`
    : null;

  // Determine role info
  const roleLabel = {
    admin: 'Super Admin',
    admin2: 'Admin Level 2',
    teacher: 'Teacher',
    fee_collector: 'Fee Collector',
    parent: 'Parent',
    student: 'Student',
  };

  const roleColor = {
    admin: 'from-red-500 to-orange-500',
    admin2: 'from-purple-500 to-indigo-500',
    teacher: 'from-blue-500 to-cyan-500',
    fee_collector: 'from-emerald-500 to-teal-500',
    parent: 'from-amber-500 to-yellow-500',
    student: 'from-blue-500 to-indigo-500',
  };

  const roleBadgeColor = {
    admin: 'bg-red-50 text-red-600 border-red-100',
    admin2: 'bg-purple-50 text-purple-600 border-purple-100',
    teacher: 'bg-blue-50 text-blue-600 border-blue-100',
    fee_collector: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    parent: 'bg-amber-50 text-amber-600 border-amber-100',
    student: 'bg-blue-50 text-blue-600 border-blue-100',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm font-bold text-slate-500">Unable to load profile data.</p>
      </div>
    );
  }

  const student = profile.linkedStudent;
  const teacher = profile.linkedTeacher;
  const isStudentPortal = ['parent', 'student'].includes(profile.role);

  return (
    <div className="space-y-6">

      {/* ── 1. Main Profile Banner Card ──────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-card relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row gap-8 items-start relative z-10">

          {/* Avatar with Upload */}
          <div className="flex flex-col items-center flex-shrink-0 self-center lg:self-start">
            <div
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden shadow-premium border-4 border-slate-50 relative group cursor-pointer"
              onClick={() => !uploading && fileRef.current?.click()}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-tr ${roleColor[profile.role] || 'from-blue-500 to-indigo-500'} text-white font-extrabold text-3xl flex items-center justify-center group-hover:scale-105 transition-all duration-300`}>
                  {profile.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-300">
                {uploading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-[10px] font-bold text-white mt-1">Change Photo</span>
                  </>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <p className="text-[10px] text-slate-400 font-semibold mt-2 text-center">Click to upload</p>
          </div>

          {/* User Details Panel */}
          <div className="flex-1 w-full space-y-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">{profile.name}</h2>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border tracking-wider uppercase ${roleBadgeColor[profile.role] || 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                    {roleLabel[profile.role] || profile.role}
                  </span>
                  {profile.is_active && (
                    <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-100 tracking-wider uppercase">Active</span>
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-400 mt-1.5 flex flex-wrap gap-x-2 gap-y-1 items-center">
                  <span>{profile.email}</span>
                  {profile.phone && (
                    <>
                      <span className="text-slate-200">•</span>
                      <span>{profile.phone}</span>
                    </>
                  )}
                  {student && (
                    <>
                      <span className="text-slate-200">•</span>
                      <span>Class {student.class}-{student.section}</span>
                    </>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white px-4 py-2.5 shadow-lg shadow-blue-500/10 active:scale-95 transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => { setEditing(false); setForm({ name: profile.name || '', phone: profile.phone || '' }); }}
                      className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500 border border-slate-200 hover:bg-slate-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/10 disabled:opacity-60 transition-all"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowPwModal(true)}
                  className="rounded-xl border border-slate-200 hover:border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                   Password
                </button>
              </div>
            </div>

            {/* Editable Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-6 pt-4 border-t border-slate-100">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</p>
                {editing ? (
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full text-xs font-bold text-slate-700 mt-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-500 transition-colors"
                  />
                ) : (
                  <p className="text-xs font-extrabold text-slate-700 mt-1.5 flex items-center gap-1.5">
                    <span className="text-blue-500"></span> {profile.name}
                  </p>
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
                <p className="text-xs font-extrabold text-blue-600 mt-1.5 truncate">
                   {profile.email}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</p>
                {editing ? (
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="Enter phone number"
                    className="w-full text-xs font-bold text-slate-700 mt-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-500 transition-colors"
                  />
                ) : (
                  <p className="text-xs font-extrabold text-slate-700 mt-1.5 whitespace-nowrap">
                     {profile.phone || 'Not set'}
                  </p>
                )}
              </div>
            </div>

            {/* Account Info */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6 pt-4 border-t border-slate-100">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">User ID</p>
                <p className="text-xs font-extrabold text-slate-700 mt-1.5">#{profile.id}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role</p>
                <p className="text-xs font-extrabold text-slate-700 mt-1.5 capitalize">{profile.role?.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</p>
                <p className={`text-xs font-extrabold mt-1.5 ${profile.is_active ? 'text-emerald-600' : 'text-red-600'}`}>
                  {profile.is_active ? ' Active' : ' Inactive'}
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── 2. Role-Specific Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Student / Parent: Student Information */}
        {isStudentPortal && student && (
          <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-card">
            <div className="pb-4 border-b border-slate-100 flex items-center gap-2.5 mb-5">
              <span className="text-xl"></span>
              <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Academic Information</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {[
                ['Student ID', student.student_id],
                ['Class', student.class],
                ['Section', student.section],
                ['Roll Number', student.roll_number || 'N/A'],
                ['Gender', student.gender || 'N/A'],
                ['Date of Birth', student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'],
                ['Session', student.session?.name || 'N/A'],
                ['Status', student.student_status || 'active'],
                ['Admission Date', student.admission_date ? new Date(student.admission_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'],
              ].map(([label, value]) => (
                <div key={label} className="py-2.5 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">{label}</span>
                  <span className="font-extrabold text-slate-700">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Student / Parent: Parent Details */}
        {isStudentPortal && student && (
          <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-card">
            <div className="pb-4 border-b border-slate-100 flex items-center gap-2.5 mb-5">
              <span className="text-xl"></span>
              <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Parent / Guardian Details</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3.5 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg flex-shrink-0">
                  
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-slate-800">{student.parent_name || 'N/A'} <span className="text-[10px] font-bold text-blue-500 ml-1.5">(Guardian)</span></p>
                  <p className="text-[11px] font-semibold text-slate-400 mt-1"> {student.parent_phone || 'N/A'}</p>
                  <p className="text-[11px] font-semibold text-slate-400 mt-0.5 truncate"> {student.parent_email || 'N/A'}</p>
                  {student.parent_occupation && (
                    <p className="text-[10px] font-bold text-slate-500 mt-1.5 uppercase tracking-wider flex items-center gap-1"><span className="text-xs"></span> {student.parent_occupation}</p>
                  )}
                </div>
              </div>
              {student.parent_address && (
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Address</p>
                  <p className="text-xs font-bold text-slate-600 mt-1.5 leading-relaxed"> {student.parent_address}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Teacher: Teacher Information */}
        {profile.role === 'teacher' && teacher && (
          <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-card">
            <div className="pb-4 border-b border-slate-100 flex items-center gap-2.5 mb-5">
              <span className="text-xl"></span>
              <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Teacher Information</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {[
                ['Teacher ID', teacher.teacher_id],
                ['Subject', teacher.subject],
                ['Phone', teacher.phone || 'N/A'],
                ['Email', teacher.email || 'N/A'],
                ['Qualification', teacher.qualification || 'N/A'],
                ['Status', teacher.status || 'active'],
                ['Assigned Classes', teacher.assigned_classes || 'N/A'],
                ['Join Date', teacher.join_date ? new Date(teacher.join_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'],
              ].map(([label, value]) => (
                <div key={label} className="py-2.5 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">{label}</span>
                  <span className="font-extrabold text-slate-700 text-right max-w-[180px] truncate">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quote Card — shown for all roles */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-card flex flex-col justify-between">
          <div className="pb-4 border-b border-slate-100 flex items-center gap-2.5 mb-5">
            <span className="text-xl"></span>
            <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Inspiration</h3>
          </div>
          <div className="bg-[#f0f4ff]/80 border border-blue-500/5 rounded-2xl p-5 relative overflow-hidden flex-1 flex flex-col justify-center">
            <span className="absolute -left-1.5 -top-3 text-[100px] text-blue-500/5 font-extrabold leading-none pointer-events-none select-none">"</span>
            <p className="text-xs font-bold text-slate-600 leading-relaxed relative z-10 italic">
              "The beautiful thing about learning is that no one can take it away from you."
            </p>
            <p className="text-[10px] font-extrabold text-blue-600 mt-2.5 self-end tracking-wider">— B.B. King</p>
          </div>

          {/* Profile stats capsules */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">User ID</p>
              <p className="text-xs font-extrabold text-slate-700 mt-1">#{profile.id}</p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Role</p>
              <p className="text-xs font-extrabold text-blue-600 mt-1 capitalize">{profile.role?.replace('_', ' ')}</p>
            </div>
            {student && (
              <>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Class</p>
                  <p className="text-[10px] font-extrabold text-slate-700 mt-1">{student.class}-{student.section}</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Roll No.</p>
                  <p className="text-[10px] font-extrabold text-slate-700 mt-1">{student.roll_number || 'N/A'}</p>
                </div>
              </>
            )}
            {teacher && (
              <>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Subject</p>
                  <p className="text-[10px] font-extrabold text-slate-700 mt-1">{teacher.subject}</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Status</p>
                  <p className="text-[10px] font-extrabold text-emerald-600 mt-1 capitalize">{teacher.status}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Admin/Admin2/FC: Account Security Card */}
        {['admin', 'admin2', 'fee_collector'].includes(profile.role) && (
          <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-card">
            <div className="pb-4 border-b border-slate-100 flex items-center gap-2.5 mb-5">
              <span className="text-xl"></span>
              <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Account & Security</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {[
                ['Account Email', profile.email],
                ['Role', roleLabel[profile.role] || profile.role],
                ['Account Status', profile.is_active ? 'Active' : 'Inactive'],
                ['Last Password Change', profile.password_changed_at ? new Date(profile.password_changed_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never'],
                ['Account Created', profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'],
              ].map(([label, value]) => (
                <div key={label} className="py-2.5 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">{label}</span>
                  <span className="font-extrabold text-slate-700 text-right max-w-[200px] truncate">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ── 3. Change Password Modal ─────────────────────────────────── */}
      {showPwModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form
            onSubmit={handlePasswordChange}
            className="w-full max-w-sm rounded-2xl bg-[#0b1021] border border-white/5 p-6 shadow-2xl backdrop-blur-xl"
          >
            <h2 className="text-base font-extrabold text-white">Change Password</h2>
            <p className="text-slate-400 text-xs mt-1">Enter your current password and choose a new one.</p>

            <div className="mt-5 space-y-4">
              <input
                type="password"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                placeholder="Current password"
                className="w-full bg-[#070b19]/60 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                required
              />
              <input
                type="password"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                placeholder="New password"
                className="w-full bg-[#070b19]/60 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowPwModal(false)}
                className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-400 hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pwSaving}
                className="rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 px-5 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-blue-600/15 disabled:opacity-60 transition-all"
              >
                {pwSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
