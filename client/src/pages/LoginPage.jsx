import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { ROLE_HOME } from '../constants/routes';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [portal, setPortal]     = useState('student'); // 'student' or 'admin'
  const { login } = useAuth();
  const { settings } = useSettings() || {};
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please enter email and password.');
    setLoading(true);
    try {
      const trimmedEmail = email.trim().toLowerCase();
      const user = await login(trimmedEmail, password);
      
      const isStudentRole = ['student', 'parent'].includes(user.role);
      const isStudentTab = portal === 'student';
      
      if (isStudentTab && !isStudentRole) {
        toast.success(`Logged in as Staff: ${user.name}`);
      } else if (!isStudentTab && isStudentRole) {
        toast.success(`Logged in as Student/Parent: ${user.name}`);
      } else {
        toast.success(`Welcome back, ${user.name}!`);
      }

      navigate(ROLE_HOME[user.role] || '/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const schoolName = settings?.school_name || 'EduSmart ERP';
  const schoolSub = settings?.school_subtitle || 'School Management System';

  return (
    <div className="min-h-screen bg-[#070b19] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Glowing Blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-600/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-[120px] animate-pulse delay-700" />
      
      {/* Hexagon Mesh Pattern Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/40 via-[#070b19] to-[#040610] z-0" />

      <div className="w-full max-w-lg z-10">
        {/* Logo and Branding Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/20 mb-4 transform hover:rotate-12 transition-transform duration-300 overflow-hidden">
            {settings?.school_logo_url ? (
              <img src={settings.school_logo_url} alt="School Logo" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            )}
          </div>
          <h1 className="text-white text-3xl font-extrabold tracking-tight">{schoolName}</h1>
          <p className="text-slate-400 text-xs mt-1.5 uppercase tracking-widest font-semibold">{schoolSub}</p>
        </div>

        {/* Login Container (Glassmorphism card) */}
        <div className="bg-[#0b1021]/80 border border-white/5 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden transition-all duration-300">
          
          {/* Top subtle highlight bar depending on the active tab */}
          <div className={`absolute top-0 left-0 right-0 h-[3px] transition-all duration-500 ${
            portal === 'student' ? 'bg-gradient-to-r from-blue-600 to-blue-400' : 'bg-gradient-to-r from-indigo-600 to-indigo-400'
          }`} />

          {/* Portal Switcher Tabs */}
          <div className="flex bg-[#070b19] p-1 rounded-xl mb-8 border border-white/5">
            <button
              type="button"
              onClick={() => {
                setPortal('student');
                setEmail('');
                setPassword('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold rounded-lg transition-all duration-300 ${
                portal === 'student'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/15'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Student & Parent
            </button>
            <button
              type="button"
              onClick={() => {
                setPortal('admin');
                setEmail('');
                setPassword('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold rounded-lg transition-all duration-300 ${
                portal === 'admin'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Administration
            </button>
          </div>

          <h2 className="text-white font-extrabold text-2xl mb-1">
            {portal === 'student' ? 'Student / Parent Portal' : 'Staff & Admins'}
          </h2>
          <p className="text-slate-400 text-xs mb-6">
            {portal === 'student' 
              ? 'Access report cards, attendance logs, and pay monthly fees.' 
              : 'Authorized login for school administration, teachers, and cashiers.'
            }
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">
                User ID / Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder={portal === 'student' ? 'parent@school.com' : 'admin@school.com'}
                  className={`w-full bg-[#070b19]/60 border border-white/5 rounded-2xl pl-10 pr-4 py-3.5 text-sm text-white placeholder-slate-500 outline-none transition-all ${
                    portal === 'student' 
                      ? 'focus:border-blue-500 focus:ring-1 focus:ring-blue-500/25' 
                      : 'focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25'
                  }`}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Password
                </label>
                <span className="text-[10px] font-semibold text-slate-500 hover:text-slate-300 cursor-pointer">Forgot?</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className={`w-full bg-[#070b19]/60 border border-white/5 rounded-2xl pl-10 pr-10 py-3.5 text-sm text-white placeholder-slate-500 outline-none transition-all ${
                    portal === 'student' 
                      ? 'focus:border-blue-500 focus:ring-1 focus:ring-blue-500/25' 
                      : 'focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPass ? (
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white font-bold py-3.5 rounded-2xl transition-all duration-300 text-sm mt-3 shadow-lg disabled:opacity-60 transform active:scale-95 ${
                portal === 'student' 
                  ? 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 shadow-blue-600/10' 
                  : 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-indigo-600/10'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : 'Sign In'}
            </button>
          </form>
          
        </div>
      </div>
    </div>
  );
}
