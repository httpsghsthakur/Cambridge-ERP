import { useState, useEffect } from 'react';
import API from '../utils/api';
import SearchBar from '../components/common/SearchBar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function CredentialManagement() {
  const { user } = useAuth();
  
  // Tab control based on role
  const isAdmin = user?.role === 'admin' || user?.role === 'admin2';
  const isFC = user?.role === 'fee_collector';
  
  const [activeTab, setActiveTab] = useState(isAdmin ? 'teachers' : 'students');
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [savingId, setSavingId] = useState(null);
  
  // Tracks email delivery status per row ID: 'idle' | 'success' | 'failed'
  const [mailStatuses, setMailStatuses] = useState({});

  // Fetch users based on active tab
  const fetchCredentials = async (query = '') => {
    setLoading(true);
    try {
      let endpoint = '';
      if (activeTab === 'teachers') endpoint = '/credentials/teachers';
      else if (activeTab === 'fee_collectors') endpoint = '/credentials/fee-collectors';
      else if (activeTab === 'students') endpoint = '/credentials/students';
      
      const res = await API.get(`${endpoint}?search=${query}`);
      setUsersList(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load credentials.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset edit state when tab changes
    cancelEdit();
    fetchCredentials(searchQuery);
  }, [activeTab]);

  const handleSearch = (q) => {
    setSearchQuery(q);
    fetchCredentials(q);
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setEditEmail(row.email);
    setEditPassword('');
    setShowPassword(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditEmail('');
    setEditPassword('');
    setShowPassword(false);
  };

  const saveCredentials = async (rowId) => {
    if (!editEmail.trim()) {
      toast.error('Login ID / Email cannot be empty.');
      return;
    }
    
    // Simple email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editEmail)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    if (editPassword && editPassword.trim().length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    setSavingId(rowId);
    try {
      const payload = { email: editEmail };
      if (editPassword.trim()) {
        payload.password = editPassword;
      }

      const res = await API.put(`/credentials/${rowId}`, payload);
      
      // Update local item
      setUsersList(prev => prev.map(u => u.id === rowId ? { ...u, email: editEmail } : u));
      
      // Handle response message & status badges
      if (res.data.emailSent) {
        toast.success(res.data.message || 'Credentials updated and email sent successfully.');
        setMailStatuses(prev => ({ ...prev, [rowId]: 'success' }));
      } else {
        toast.error(res.data.message || 'Credentials saved, but email could not be sent.');
        setMailStatuses(prev => ({ ...prev, [rowId]: 'failed' }));
      }
      
      cancelEdit();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save credentials.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      
      {/* Header section */}
      <div className="border-b border-gray-100 bg-gray-50/50 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Credential Management</h2>
          <p className="text-sm text-gray-500 mt-1">Manage system login IDs, set secure passwords, and trigger instant email alerts.</p>
        </div>

        {/* Tab Controls */}
        {isAdmin && (
          <div className="flex bg-gray-200/60 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('teachers')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'teachers' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Teachers
            </button>
            <button
              onClick={() => setActiveTab('fee_collectors')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'fee_collectors' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Fee Collectors
            </button>
          </div>
        )}

        {isFC && (
          <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-xs font-semibold">
            Students Tab Active
          </div>
        )}
      </div>

      <div className="p-6 space-y-6">
        
        {/* Search Controls */}
        <div className="max-w-md">
          <SearchBar
            placeholder={`Search by name or email...`}
            onChange={handleSearch}
          />
        </div>

        {/* Credentials Table */}
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="min-w-full divide-y divide-gray-100 text-left">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Actual Email</th>
                <th className="px-6 py-4">Login ID (Username)</th>
                <th className="px-6 py-4">Password</th>
                <th className="px-6 py-4 text-center">Email Delivery Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <LoadingSpinner />
                      <span className="text-xs text-gray-400">Loading credentials list...</span>
                    </div>
                  </td>
                </tr>
              ) : usersList.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-400 text-sm">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                usersList.map((row) => {
                  const isEditing = editingId === row.id;
                  const isSaving = savingId === row.id;
                  const mailStatus = mailStatuses[row.id] || 'idle';
                  
                  return (
                    <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                      
                      {/* Name */}
                      <td className="px-6 py-4 font-medium text-gray-800">{row.name}</td>
                      
                      {/* Role */}
                      <td className="px-6 py-4 capitalize">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium ${
                          row.role === 'teacher' ? 'bg-indigo-50 text-indigo-700' :
                          row.role === 'fee_collector' ? 'bg-orange-50 text-orange-700' :
                          'bg-emerald-50 text-emerald-700'
                        }`}>
                          {row.role?.replace('_', ' ')}
                        </span>
                      </td>
                      
                      {/* Actual Email */}
                      <td className="px-6 py-4 text-gray-500 font-mono text-xs">{row.phone || 'N/A'}</td>
                      
                      {/* Login ID Input / Display */}
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <input
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            placeholder="Enter login ID"
                          />
                        ) : (
                          <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                            {row.email}
                          </span>
                        )}
                      </td>
                      
                      {/* Password Input / Display */}
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={editPassword}
                              onChange={(e) => setEditPassword(e.target.value)}
                              className="w-full bg-white border border-gray-300 rounded-lg pl-3 pr-8 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                              placeholder="Type new password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                            >
                              {showPassword ? 'Hide' : 'Show'}
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 font-mono text-xs select-none">••••••••</span>
                        )}
                      </td>
                      
                      {/* Email Delivery Status Badge */}
                      <td className="px-6 py-4 text-center">
                        {mailStatus === 'success' && (
                          <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                            Email Sent Successfully
                          </span>
                        )}
                        {mailStatus === 'failed' && (
                          <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                            Email Failed
                          </span>
                        )}
                        {mailStatus === 'idle' && (
                          <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-500 px-2.5 py-1 rounded-full text-xs font-semibold">
                            <span className="h-1.5 w-1.5 rounded-full bg-gray-400"></span>
                            Not Sent Yet
                          </span>
                        )}
                      </td>
                      
                      {/* Actions */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => saveCredentials(row.id)}
                              disabled={isSaving}
                              className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                            >
                              {isSaving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={cancelEdit}
                              disabled={isSaving}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(row)}
                            className="text-blue-500 hover:text-blue-700 text-xs font-semibold bg-blue-50/50 px-3 py-1.5 rounded-lg transition-all"
                          >
                            Edit Credentials
                          </button>
                        )}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
