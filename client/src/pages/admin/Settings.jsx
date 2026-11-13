import { useState, useEffect } from 'react';
import API from '../../utils/api';
import toast from 'react-hot-toast';

export default function Settings() {
  const [settings, setSettings] = useState({
    school_name: '',
    school_subtitle: '',
    school_address: '',
    school_phone: '',
    school_email: '',
    school_logo_url: '',
    receipt_footer: '',
    dise_code: '',
    school_established: '',
    school_medium: 'ENGLISH MEDIUM',
    academic_session: '2024 - 2025',
    school_reopen_date: '01 APRIL 2025',
    school_motto_1: 'Play',
    school_motto_2: 'Learn',
    school_motto_3: 'Grow',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    API.get('/settings')
      .then(res => {
        setSettings(prev => ({ ...prev, ...res.data }));
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    setSettings(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await API.put('/settings', settings);
      toast.success('Settings and School ID saved successfully!');
      // Force reload to apply settings everywhere immediately
      window.location.reload();
    } catch (err) {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading settings...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">School Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Manage school profile, receipts, and centralized platform connection</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1 sm:col-span-1">
              <label className="text-sm font-semibold text-gray-700">School Name</label>
              <input
                type="text"
                name="school_name"
                value={settings.school_name || ''}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors"
                placeholder="e.g. International Cambridge School Kishtwar"
                required
              />
            </div>

            <div className="space-y-1 sm:col-span-1">
              <label className="text-sm font-semibold text-gray-700">School Subtitle</label>
              <input
                type="text"
                name="school_subtitle"
                value={settings.school_subtitle || ''}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors"
                placeholder="e.g. Kishtwar, Jammu & Kashmir"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-sm font-semibold text-gray-700">School Address</label>
              <textarea
                name="school_address"
                value={settings.school_address || ''}
                onChange={handleChange}
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors"
                placeholder="Full address to display on receipts and certificates"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Phone Number</label>
              <input
                type="text"
                name="school_phone"
                value={settings.school_phone || ''}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors"
                placeholder="+1 234 567 890"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Email Address</label>
              <input
                type="email"
                name="school_email"
                value={settings.school_email || ''}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors"
                placeholder="info@school.com"
              />
            </div>

            {/* Logo Image Upload */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-sm font-semibold text-gray-700">School Logo</label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                {settings.school_logo_url && (
                  <img 
                    src={settings.school_logo_url} 
                    alt="Logo preview" 
                    className="h-12 w-12 object-contain rounded border border-gray-200 bg-white"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const img = new Image();
                      img.onload = () => {
                        const canvas = document.createElement('canvas');
                        let width = img.width;
                        let height = img.height;
                        const MAX_SIZE = 200; // Resize to max 200px to ensure tiny base64 string
                        
                        if (width > height) {
                          if (width > MAX_SIZE) {
                            height = Math.round(height * (MAX_SIZE / width));
                            width = MAX_SIZE;
                          }
                        } else {
                          if (height > MAX_SIZE) {
                            width = Math.round(width * (MAX_SIZE / height));
                            height = MAX_SIZE;
                          }
                        }
                        
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        
                        const base64Str = canvas.toDataURL('image/webp', 0.8);
                        setSettings(prev => ({ ...prev, school_logo_url: base64Str }));
                        toast.success('Logo preview loaded! Click Save Settings to apply.');
                      };
                      img.src = event.target.result;
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-sm font-semibold text-gray-700">Receipt Footer Note</label>
              <input
                type="text"
                name="receipt_footer"
                value={settings.receipt_footer || ''}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors"
                placeholder="This is a computer-generated receipt."
              />
            </div>
            {/* Official Report Card & Certificate Settings */}
            <div className="space-y-4 sm:col-span-2 pt-4 border-t border-gray-200">
              <div>
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Official Report Card & Marksheet Customization
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Customize marksheet headers, DICE code, estd year, motto, and academic session</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">DICE / UDISE No.</label>
                  <input
                    type="text"
                    name="dise_code"
                    value={settings.dise_code || ''}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                    placeholder="e.g. 23320400828"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Actual School Estd. Date / Year</label>
                  <input
                    type="text"
                    name="school_established"
                    value={settings.school_established || ''}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                    placeholder="e.g. 2012 or 15 August 2012"
                  />
                  <p className="text-[10px] text-gray-400">Printed as ESTD. on official marksheets & seals</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Medium of Instruction</label>
                  <input
                    type="text"
                    name="school_medium"
                    value={settings.school_medium || ''}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                    placeholder="e.g. ENGLISH MEDIUM"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Academic Session</label>
                  <input
                    type="text"
                    name="academic_session"
                    value={settings.academic_session || ''}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                    placeholder="e.g. 2024 - 2025"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">School Reopen Date</label>
                  <input
                    type="text"
                    name="school_reopen_date"
                    value={settings.school_reopen_date || ''}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                    placeholder="e.g. 01 APRIL 2025"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Badge Motto (3 Words)</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <input
                      type="text"
                      name="school_motto_1"
                      value={settings.school_motto_1 || ''}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs outline-none focus:border-blue-500 text-center"
                      placeholder="Play"
                    />
                    <input
                      type="text"
                      name="school_motto_2"
                      value={settings.school_motto_2 || ''}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs outline-none focus:border-blue-500 text-center"
                      placeholder="Learn"
                    />
                    <input
                      type="text"
                      name="school_motto_3"
                      value={settings.school_motto_3 || ''}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs outline-none focus:border-blue-500 text-center"
                      placeholder="Grow"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
