import { useState, useEffect } from 'react';
import API from '../../utils/api';
import Modal from '../../components/common/Modal';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import Avatar from '../../components/common/Avatar';
import StaffForm from '../../components/forms/StaffForm';
import { useAuth } from '../../context/AuthContext';
import { can, isSuperAdmin } from '../../utils/roleUtils';
import toast from 'react-hot-toast';

export default function Staff() {
  const { user }  = useAuth();
  const [staff, setStaff]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [saving, setSaving]       = useState(false);
  const [viewing, setViewing]     = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  //  Both admin and admin2 can view teachers
  const canView    = can(user, 'VIEW_TEACHERS');
  //  Only super admin can edit/delete
  const canManage  = isSuperAdmin(user);

  const load = (q = '') => {
    setLoading(true);
    API.get(`/teachers?search=${q}`)
      .then(r => setStaff(r.data))
      .catch(() => toast.error('Failed to load staff'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd  = () => { setEditing(null); setShowModal(true); };
  const openEdit = (t) => { setEditing(t); setShowModal(true); };
  const openView = (t) => { setViewing(t); setShowViewModal(true); };

  const handleSubmit = async (data) => {
    setSaving(true);
    try {
      const payload = {
        ...data,
        assigned_classes: Array.isArray(data.assigned_classes_arr)
          ? data.assigned_classes_arr.join(',')
          : data.assigned_classes || '',
      };

      if (editing) {
        await API.put(`/teachers/${editing.id}`, payload);
        toast.success('Staff updated!');
      } else {
        await API.post('/teachers', payload);
        toast.success('Staff added!');
      }
      setShowModal(false);
      load(search);
    } catch (err) {
      let errMsg = err.response?.data?.message || 'Failed to save.';
      if (err.response?.data?.errors && err.response.data.errors.length > 0) {
        errMsg = err.response.data.errors[0].msg;
      }
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this staff member?')) return;
    try {
      await API.delete(`/teachers/${id}`);
      toast.success('Staff deactivated.');
      load(search);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.');
    }
  };

  const columns = [
    {
      key: 'name', label: 'Staff',
      render: (val, row) => {
        const photoUrl = row.teacherUser?.profile_photo
          ? `${process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : ''}${row.teacherUser.profile_photo}`
          : undefined;
        return (
          <div className="flex items-center gap-2.5">
            <Avatar name={val} size="sm" src={photoUrl} />
            <div>
              <p className="font-medium text-gray-800 text-sm">{val}</p>
              <p className="text-xs text-gray-400 font-mono">{row.teacher_id}</p>
            </div>
          </div>
        );
      }
    },
    {
      key: 'staff_type', label: 'Type',
      render: val => <span className="text-xs text-gray-700 font-semibold">{val || 'Teacher'}</span>
    },
    {
      key: 'subject', label: 'Subject(s)',
      render: val => {
        if (!val) return <span className="text-gray-400 text-xs">—</span>;
        const subs = val.split(',').map(s => s.trim()).filter(Boolean);
        return (
          <div className="flex flex-wrap gap-1 max-w-[220px]">
            {subs.map(s => (
              <span key={s} className="bg-blue-50 text-blue-700 border border-blue-200 text-[11px] px-2 py-0.5 rounded-full font-medium">
                {s}
              </span>
            ))}
          </div>
        );
      }
    },
    {
      key: 'email', label: 'Email',
      render: val => <span className="text-xs text-gray-500 font-medium">{val || '—'}</span>
    },
    {
      key: 'assigned_classes', label: 'Classes',
      render: val => <span className="text-xs text-gray-500">{val || '—'}</span>
    },
    {
      key: 'phone', label: 'Phone',
      render: val => <span className="text-xs text-gray-500 font-medium">{val || '—'}</span>
    },
    {
      key: 'status', label: 'Status',
      render: val => (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          val === 'active'   ? 'bg-green-100 text-green-700' :
          val === 'leave'    ? 'bg-yellow-100 text-yellow-700' :
          'bg-gray-100 text-gray-500'
        }`}>{val}</span>
      )
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
          placeholder="Search staff..."
          onChange={q => { setSearch(q); load(q); }}
          className="flex-1"
        />
        {/*  Only super admin sees Add button */}
        {canManage && (
          <button
            onClick={openAdd}
            className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap"
          >
            + Add Staff
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={staff}
        loading={loading}
        emptyText="No staff found."
        actions={(row) => (
          <div className="flex gap-3">
            <button onClick={() => openView(row)} className="text-xs text-blue-500 hover:text-blue-700 font-medium">View</button>
            {/*  Only super admin gets Edit/Remove */}
            {canManage && (
              <>
                <button onClick={() => openEdit(row)} className="text-xs text-blue-500 hover:text-blue-700 font-medium">Edit</button>
                <button onClick={() => handleDelete(row.id)} className="text-xs text-red-400 hover:text-red-600 font-medium">Remove</button>
              </>
            )}
          </div>
        )}
      />

      {canManage && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editing ? 'Edit Staff' : 'Add New Staff'}
        >
          <StaffForm
            onSubmit={handleSubmit}
            loading={saving}
            defaultValues={editing ? {
              ...editing,
              assigned_classes_arr: editing.assigned_classes?.split(',').map(s => s.trim()) || [],
            } : {}}
          />
        </Modal>
      )}

      {/* View Staff Details Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Staff Details"
      >
        {viewing && (
          <div className="space-y-4">
             <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
               <Avatar name={viewing.name} size="lg" src={viewing.teacherUser?.profile_photo ? `${process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : ''}${viewing.teacherUser.profile_photo}` : undefined} />
               <div>
                 <h3 className="text-lg font-bold text-gray-800">{viewing.name}</h3>
                 <p className="text-sm text-gray-500">{viewing.staff_type || 'Teacher'} &bull; {viewing.teacher_id}</p>
               </div>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
               <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                 <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Subject(s)</span>
                 {viewing.subject ? (
                   <div className="flex flex-wrap gap-1 mt-1">
                     {viewing.subject.split(',').map(s => s.trim()).filter(Boolean).map(sub => (
                       <span key={sub} className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                         {sub}
                       </span>
                     ))}
                   </div>
                 ) : (
                   <p className="font-semibold text-gray-800">N/A</p>
                 )}
               </div>
               <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                 <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Email</span>
                 <p className="font-semibold text-gray-800">{viewing.email || 'N/A'}</p>
               </div>
               <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                 <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Phone</span>
                 <p className="font-semibold text-gray-800">{viewing.phone || 'N/A'}</p>
               </div>
               <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                 <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Qualification</span>
                 <p className="font-semibold text-gray-800">{viewing.qualification || 'N/A'}</p>
               </div>
               <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                 <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Join Date</span>
                 <p className="font-semibold text-gray-800">{viewing.join_date ? new Date(viewing.join_date).toLocaleDateString() : 'N/A'}</p>
               </div>
               <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                 <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Status</span>
                 <p className="font-semibold text-gray-800 capitalize">{viewing.status}</p>
               </div>
               <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                 <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Document</span>
                 <p className="font-semibold text-gray-800">
                    {viewing.document_type ? `${viewing.document_type} (${viewing.document_number || 'N/A'})` : 'N/A'}
                 </p>
               </div>
               <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                 <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Assigned Classes</span>
                 <p className="font-semibold text-gray-800">{viewing.assigned_classes || 'N/A'}</p>
               </div>
             </div>
          </div>
        )}
      </Modal>
    </div>
  );
}