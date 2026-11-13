import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../utils/api';
import Modal from '../../components/common/Modal';
import SearchBar from '../../components/common/SearchBar';
import Avatar from '../../components/common/Avatar';
import StudentForm from '../../components/forms/StudentForm';
import StudentFeeWidget from '../../components/common/StudentFeeWidget';
import { feeStatusColor } from '../../utils/helpers';
import { CLASSES, SECTIONS } from '../../constants/roles';
import toast from 'react-hot-toast';

export default function Students() {
  const navigate = useNavigate();
  const [students, setStudents]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [viewing, setViewing]     = useState(null);
  const [saving, setSaving]       = useState(false);
  const [credentials, setCredentials] = useState(null);

  const [filterClass, setFilterClass] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterFeeStatus, setFilterFeeStatus] = useState('');

  const load = (q = '', c = filterClass, s = filterSection, f = filterFeeStatus) => {
    setLoading(true);
    let url = `/students?search=${q}`;
    if (c) url += `&class=${c}`;
    if (s) url += `&section=${s}`;
    if (f && f !== 'all') url += `&fee_status=${f}`;
    
    API.get(url)
      .then(r => setStudents(r.data.students || []))
      .catch(() => toast.error('Failed to load students'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleFilterChange = (c, s, f) => {
    setFilterClass(c);
    setFilterSection(s);
    setFilterFeeStatus(f);
    load(search, c, s, f);
  };

  const openAdd  = () => { setEditing(null); setShowModal(true); };
  const openEdit = (s) => { setEditing(s); setShowModal(true); };

  const handleSubmit = async (data) => {
    setSaving(true);
    try {
      if (editing) {
        await API.put(`/students/${editing.id}`, data);
        toast.success('Student updated!');
      } else {
        const res = await API.post('/students', data);
        setCredentials(res.data.credentials || null);
        toast.success('Student added and credentials generated!');
      }
      setShowModal(false);
      load(search, filterClass, filterSection, filterFeeStatus);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this student?')) return;
    try {
      await API.delete(`/students/${id}`);
      toast.success('Student deactivated.');
      load(search, filterClass, filterSection, filterFeeStatus);
    } catch {
      toast.error('Failed.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 w-full sm:w-auto">
          <select 
            value={filterClass}
            onChange={(e) => handleFilterChange(e.target.value, filterSection, filterFeeStatus)}
            className="flex-1 sm:w-32 bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block px-3 py-2.5"
          >
            <option value="">All Classes</option>
            {CLASSES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select 
            value={filterSection}
            onChange={(e) => handleFilterChange(filterClass, e.target.value, filterFeeStatus)}
            className="flex-1 sm:w-28 bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block px-3 py-2.5"
          >
            <option value="">All Sections</option>
            {SECTIONS.map(s => (
              <option key={s} value={s}>Sec {s}</option>
            ))}
          </select>
          <select 
            value={filterFeeStatus}
            onChange={(e) => handleFilterChange(filterClass, filterSection, e.target.value)}
            className="flex-1 sm:w-32 bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block px-3 py-2.5"
          >
            <option value="all">All Fee Status</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
            <option value="not_generated">Not Generated</option>
          </select>
        </div>
        <SearchBar
          placeholder="Search by name, ID or class..."
          onChange={q => { setSearch(q); load(q, filterClass, filterSection, filterFeeStatus); }}
          className="flex-1"
        />
        <button
          onClick={openAdd}
          className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap"
        >
          + Add Student
        </button>
      </div>

      {/* Table — horizontally scrollable on mobile */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">Loading...</div>
        ) : students.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">No students found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: '600px' }}>
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Student', 'Class', 'Parent', 'Phone', 'Fee', 'Actions'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={`${s.first_name} ${s.last_name}`} size="sm" />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 text-sm truncate max-w-[120px] sm:max-w-none">
                            {s.first_name} {s.last_name}
                          </p>
                          <p className="text-xs text-gray-400 font-mono">{s.student_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-gray-600 text-xs">
                      {s.class} - {s.section}
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-xs max-w-[100px] truncate">
                      {s.parent_name}
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs whitespace-nowrap">
                      {s.parent_phone}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${feeStatusColor[s.fee_status] || 'bg-gray-100 text-gray-500'}`}>
                        {s.fee_status || 'unpaid'}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex gap-3">
                        <button
                          onClick={() => { setViewing(s); setShowViewModal(true); }}
                          className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
                        >
                          Review
                        </button>
                        <button
                          onClick={() => openEdit(s)}
                          className="text-xs text-blue-500 hover:text-blue-700 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="text-xs text-red-400 hover:text-red-600 font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setCredentials(null); }}
        title={editing ? 'Edit Student' : 'Add New Student'}
      >
        {credentials && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            <p className="font-semibold">Student login credentials</p>
            <p>Email: <span className="font-mono">{credentials.email}</span></p>
            <p>Password: <span className="font-mono">{credentials.password}</span></p>
          </div>
        )}
        <StudentForm
          onSubmit={handleSubmit}
          loading={saving}
          defaultValues={editing || {}}
        />
      </Modal>

      <Modal
        isOpen={showViewModal}
        onClose={() => { setShowViewModal(false); setViewing(null); }}
        title="Student Details"
      >
        {viewing && (
          <div className="space-y-4 text-sm text-gray-700">
            <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
              <Avatar name={`${viewing.first_name} ${viewing.last_name}`} size="lg" />
              <div>
                <h3 className="text-lg font-bold text-gray-900">{viewing.first_name} {viewing.last_name}</h3>
                <p className="text-gray-500 font-mono text-xs">{viewing.student_id}</p>
                <span className={`mt-1 inline-block text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${viewing.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {viewing.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Class</p>
                <p className="font-semibold">{viewing.class} - {viewing.section}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Roll No.</p>
                <p className="font-semibold">{viewing.roll_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Gender</p>
                <p className="font-semibold">{viewing.gender || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Date of Birth</p>
                <p className="font-semibold">{viewing.date_of_birth ? new Date(viewing.date_of_birth).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 mt-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Parent Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Name</p>
                  <p className="font-semibold">{viewing.parent_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Phone</p>
                  <p className="font-semibold">{viewing.parent_phone || 'N/A'}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Email</p>
                  <p className="font-semibold">{viewing.parent_email || 'N/A'}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Address</p>
                  <p className="font-semibold">{viewing.parent_address || 'N/A'}</p>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-100 pt-4 mt-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Fee Status & Details</h4>
              <StudentFeeWidget studentId={viewing.id} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
