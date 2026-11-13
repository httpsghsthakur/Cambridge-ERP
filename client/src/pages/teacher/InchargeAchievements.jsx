import { useState, useEffect, useMemo, useCallback } from 'react';
import API from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const CATEGORY_PRESETS = [
  'Painting',
  'Quiz',
  'Sports',
  'Debate',
  'Music',
  'Dance',
  'Science Exhibition',
  'Art & Craft',
  'Coding',
  'General',
];

const POSITION_PRESETS = [
  '1st Prize',
  '2nd Prize',
  '3rd Prize',
  'Winner',
  'Runner Up',
  'Participated',
  'Special Mention',
];

const LEVEL_OPTIONS = ['School', 'Inter-House', 'Inter-School', 'District', 'State', 'National'];

export default function InchargeAchievements() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [assignedClasses, setAssignedClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [achievements, setAchievements] = useState([]);

  // Filter & Form state
  const [selectedPairKey, setSelectedPairKey] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);

  const [studentId, setStudentId] = useState('');
  const [category, setCategory] = useState('Painting');
  const [title, setTitle] = useState('');
  const [position, setPosition] = useState('1st Prize');
  const [level, setLevel] = useState('School');
  const [eventDate, setEventDate] = useState('');
  const [description, setDescription] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get('/achievements/incharge');
      const ac = Array.isArray(res.data?.assignedClasses) ? res.data.assignedClasses : [];
      const stu = Array.isArray(res.data?.students) ? res.data.students : [];
      const ach = Array.isArray(res.data?.achievements) ? res.data.achievements : [];
      setAssignedClasses(ac);
      setStudents(stu);
      setAchievements(ach);
      if (ac.length === 1) {
        setSelectedPairKey(`${ac[0].class}::${ac[0].section}`);
      }
      if (stu.length > 0) {
        setStudentId((prev) => prev || String(stu[0].id));
      }
    } catch {
      toast.error('Failed to load student achievements workspace.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredStudents = useMemo(() => {
    if (selectedPairKey === 'all') return students;
    const [cls, sec] = selectedPairKey.split('::');
    return students.filter((s) => s.class === cls && s.section === sec);
  }, [students, selectedPairKey]);

  const filteredAchievements = useMemo(() => {
    return achievements.filter((a) => {
      if (selectedPairKey !== 'all') {
        const [cls, sec] = selectedPairKey.split('::');
        if (a.class !== cls || a.section !== sec) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const studentName = `${a.student?.first_name || ''} ${a.student?.last_name || ''}`.toLowerCase();
        return (
          studentName.includes(q) ||
          String(a.title || '').toLowerCase().includes(q) ||
          String(a.category || '').toLowerCase().includes(q) ||
          String(a.position || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [achievements, selectedPairKey, searchQuery]);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setEventDate('');
    setCategory('Painting');
    setPosition('1st Prize');
    setLevel('School');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentId || !category.trim() || !title.trim() || !position.trim()) {
      return toast.error('Student, Category, Competition Title, and Position/Prize are required.');
    }

    setSaving(true);
    try {
      const payload = {
        student_id: Number(studentId),
        category: category.trim(),
        title: title.trim(),
        position: position.trim(),
        level: level.trim() || null,
        event_date: eventDate || null,
        description: description.trim() || null,
      };

      if (editingId) {
        await API.put(`/achievements/${editingId}`, payload);
        toast.success('Achievement updated!');
      } else {
        await API.post('/achievements', payload);
        toast.success('Achievement added and student notified!');
      }
      resetForm();
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save achievement.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (ach) => {
    setEditingId(ach.id);
    setStudentId(String(ach.student_id));
    setCategory(ach.category || 'General');
    setTitle(ach.title || '');
    setPosition(ach.position || 'Participated');
    setLevel(ach.level || 'School');
    setEventDate(ach.event_date || '');
    setDescription(ach.description || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this achievement record?')) return;
    try {
      await API.delete(`/achievements/${id}`);
      toast.success('Achievement deleted.');
      if (editingId === id) resetForm();
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete achievement.');
    }
  };

  if (loading) return <LoadingSpinner />;

  if (user?.role === 'teacher' && assignedClasses.length === 0) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-100 shadow-card p-10 text-center mt-6">
        <h2 className="text-xl font-extrabold text-slate-800">Class Incharge Access Required</h2>
        <p className="text-sm text-slate-500 mt-2">
          Only a designated Class Incharge can record competition &amp; co-curricular achievements for their assigned class students.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            Student Recognition
          </span>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight mt-2">
            Competition &amp; Co-Curricular Achievements
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Add student participation and awards (1st/2nd/3rd Prize, Participated) in Painting, Quiz, Sports, Debate, etc.
          </p>
        </div>

        {assignedClasses.length > 1 && (
          <select
            value={selectedPairKey}
            onChange={(e) => setSelectedPairKey(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700"
          >
            <option value="all">All Assigned Classes</option>
            {assignedClasses.map((ac) => (
              <option key={`${ac.class}::${ac.section}`} value={`${ac.class}::${ac.section}`}>
                {ac.class} — Section {ac.section}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Add / Edit Achievement Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-base font-extrabold text-slate-800">
            {editingId ? 'Edit Student Achievement' : 'Record New Student Achievement'}
          </h2>
          {editingId && (
            <button type="button" onClick={resetForm} className="text-xs font-bold text-slate-500 underline">
              Cancel Edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Student *
            </label>
            <select
              value={studentId}
              disabled={Boolean(editingId)}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 disabled:bg-slate-50"
            >
              <option value="">Select Student...</option>
              {filteredStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.roll_number ? `Roll ${s.roll_number} · ` : ''}{s.first_name} {s.last_name || ''} ({s.class}-{s.section})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Competition / Event Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Annual Inter-House Painting Competition"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Category Picker */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Category * (Select or enter custom)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {CATEGORY_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCategory(preset)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                    category === preset
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Or type custom category (e.g. Robotics)"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
            />
          </div>

          {/* Position / Result Picker */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Prize / Result * (Select or enter custom)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {POSITION_PRESETS.map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setPosition(pos)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                    position === pos
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-amber-50/50 text-amber-800 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Or type custom position (e.g. Gold Medal)"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Competition Level
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700"
            >
              {LEVEL_OPTIONS.map((lvl) => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Event Date
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Remarks / Details
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional appreciation note or achievement details"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : editingId ? 'Update Achievement' : 'Add Achievement'}
          </button>
        </div>
      </form>

      {/* Recorded Achievements Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold text-slate-800">
            Recorded Class Achievements ({filteredAchievements.length})
          </h2>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student, category, title..."
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium w-full sm:w-64"
          />
        </div>

        {filteredAchievements.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-6 text-center">
            No competition achievements recorded for the selected class yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Competition / Activity</th>
                  <th className="py-3 px-4">Prize / Position</th>
                  <th className="py-3 px-4">Level &amp; Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAchievements.map((ach) => (
                  <tr key={ach.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold text-slate-800 whitespace-nowrap">
                      {ach.student ? `${ach.student.first_name} ${ach.student.last_name || ''}` : `Student #${ach.student_id}`}
                      <span className="block text-[10px] font-medium text-slate-400">
                        {ach.class} — Sec {ach.section} {ach.student?.roll_number ? `· Roll ${ach.student.roll_number}` : ''}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                        {ach.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-800">{ach.title}</p>
                      {ach.description && <p className="text-[11px] text-slate-500 mt-0.5">{ach.description}</p>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-extrabold text-[11px]">
                        {ach.position}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {[ach.level, ach.event_date].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(ach)}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(ach.id)}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

