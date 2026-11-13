import { useState, useEffect } from 'react';
import API from '../../utils/api';
import Modal from '../../components/common/Modal';
import { CLASSES, SECTIONS } from '../../constants/roles';
import { useAuth } from '../../context/AuthContext';
import { can } from '../../utils/roleUtils';
import toast from 'react-hot-toast';

export default function ClassInchargeManager() {
  const { user }  = useAuth();
  const [incharges, setIncharges] = useState([]);
  const [teachers, setTeachers]   = useState([]);
  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState({ id: '', teacher_id: '', class: 'Class 8', section: 'A' });
  const [saving, setSaving]       = useState(false);
  const [loading, setLoading]     = useState(true);

  //  Both admin and admin2 can manage incharge
  const canAssign = can(user, 'ASSIGN_INCHARGE');

  const load = () => {
    setLoading(true);
    Promise.all([
      API.get('/class-incharge'),
      API.get('/teachers'),
    ]).then(([ic, tc]) => {
      setIncharges(ic.data || []);
      setTeachers(tc.data || []);
    }).catch(err => {
      //  Better error message showing what failed
      toast.error(`Failed to load: ${err.response?.data?.message || err.message}`);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.teacher_id) return toast.error('Please select a teacher.');
    setSaving(true);
    try {
      let res;
      if (form.id) {
        res = await API.put(`/class-incharge/${form.id}`, form);
      } else {
        res = await API.post('/class-incharge', form);
      }
      toast.success(form.id ? 'Class incharge updated!' : (res.data.message || 'Class incharge assigned!'));
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign incharge.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Remove this incharge assignment?')) return;
    try {
      await API.delete(`/class-incharge/${id}`);
      toast.success('Incharge assignment removed.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.');
    }
  };

  const f = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 bg-white';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Class Incharge</h2>
          <p className="text-gray-400 text-sm mt-0.5">Assign teachers as class incharge for each section</p>
        </div>
        {canAssign && (
          <button
            onClick={() => { setForm({ id: '', teacher_id: '', class: 'Class 8', section: 'A' }); setModal(true); }}
            className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            + Assign Incharge
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <p className="text-center py-10 text-gray-400 text-sm">Loading...</p>
        ) : incharges.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-2"></p>
            <p className="text-gray-500 font-medium">No incharge assignments yet.</p>
            {canAssign && <p className="text-gray-400 text-sm mt-1">Click "Assign Incharge" to get started.</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 420 }}>
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Class', 'Section', 'Teacher', 'Subject', ...(canAssign ? ['Action'] : [])].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {incharges.map(ic => (
                  <tr key={ic.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-800">{ic.class}</td>
                    <td className="py-3 px-4 text-gray-600">{ic.section}</td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-800">{ic.teacher?.name}</p>
                      <p className="text-xs text-gray-400">{ic.teacher?.teacher_id}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        {ic.teacher?.subject}
                      </span>
                    </td>
                    {canAssign && (
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setForm({ id: ic.id, teacher_id: ic.teacher_id, class: ic.class, section: ic.section }); setModal(true); }}
                            className="text-xs text-blue-500 hover:text-blue-700 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleRemove(ic.id)}
                            className="text-xs text-red-400 hover:text-red-600 font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {canAssign && (
        <Modal isOpen={modal} onClose={() => setModal(false)} title={form.id ? "Edit Class Incharge" : "Assign Class Incharge"}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Teacher *</label>
              <select
                value={form.teacher_id}
                onChange={e => setForm(p => ({ ...p, teacher_id: e.target.value }))}
                className={f}
              >
                <option value="">Select a teacher</option>
                {teachers.filter(t => t.status === 'active').map(t => (
                  <option key={t.id} value={t.id}>{t.name} — {t.subject}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Class</label>
                <select value={form.class} onChange={e => setForm(p => ({ ...p, class: e.target.value }))} className={f}>
                  {CLASSES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Section</label>
                <select value={form.section} onChange={e => setForm(p => ({ ...p, section: e.target.value }))} className={f}>
                  {SECTIONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {form.teacher_id && form.class && !form.id && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
                Assigning <strong>{teachers.find(t => t.id === parseInt(form.teacher_id))?.name}</strong> as
                incharge for <strong>{form.class} - {form.section}</strong>.
                If this class already has an incharge, they will be replaced. (A teacher can be incharge of multiple classes).
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving || !form.teacher_id}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                {saving ? 'Saving...' : (form.id ? 'Save Changes' : 'Assign Incharge')}
              </button>
              <button
                onClick={() => setModal(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}