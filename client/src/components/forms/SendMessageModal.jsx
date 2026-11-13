import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import API from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function SendMessageModal({ onClose }) {
  const { user } = useAuth();
  
  const [recipientType, setRecipientType] = useState('everyone');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  
  // Individual selection state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Initialize locked states based on role
  useEffect(() => {
    if (user?.role === 'student' || user?.role === 'parent') {
      setRecipientType('my_teachers');
    }
  }, [user]);

  // Fetch individual users based on filters
  useEffect(() => {
    if (recipientType === 'individual') {
      const delayDebounce = setTimeout(() => {
        fetchUsers();
      }, 500);
      return () => clearTimeout(delayDebounce);
    }
  }, [searchQuery, roleFilter, classFilter, recipientType]);

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (roleFilter) params.append('role', roleFilter);
      if (classFilter) params.append('class', classFilter);
      
      const { data } = await API.get(`/notifications/users/search?${params.toString()}`);
      setUsers(data.users || []);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleToggleUser = (userId) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      return toast.error('Subject and message are required');
    }
    
    if (recipientType === 'individual' && selectedUserIds.length === 0) {
      return toast.error('Please select at least one recipient');
    }

    try {
      setIsSubmitting(true);
      await API.post('/notifications/message', {
        recipientType,
        selectedUserIds,
        subject,
        message
      });
      toast.success('Message sent successfully! (Both in-app & Email)');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStudent = user?.role === 'student' || user?.role === 'parent';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">New Message</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <form id="message-form" onSubmit={handleSubmit} className="space-y-5">
            
            {/* Recipient Type */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">To</label>
              <select 
                value={recipientType}
                onChange={(e) => {
                  setRecipientType(e.target.value);
                  setSelectedUserIds([]);
                }}
                disabled={isStudent}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isStudent ? (
                  <option value="my_teachers">My Teachers</option>
                ) : (
                  <>
                    <option value="everyone">Everyone</option>
                    <option value="all_teachers">All Teachers</option>
                    <option value="all_students">All Students</option>
                    <option value="individual">Select Individuals...</option>
                  </>
                )}
              </select>
            </div>

            {/* Individual Selection (only if Admin/Teacher chooses Individual) */}
            {recipientType === 'individual' && !isStudent && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Search name or roll no..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="">All Roles</option>
                    <option value="student">Students</option>
                    <option value="teacher">Teachers</option>
                    <option value="admin">Admins</option>
                  </select>
                  {roleFilter === 'student' && (
                    <input
                      type="text"
                      placeholder="Class (e.g. 10)"
                      value={classFilter}
                      onChange={(e) => setClassFilter(e.target.value)}
                      className="w-32 px-4 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  )}
                </div>
                
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg bg-white">
                  {isLoadingUsers ? (
                    <div className="p-4 text-center text-sm text-slate-500">Searching...</div>
                  ) : users.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500">No users found</div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {users.map(u => (
                        <label key={u.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={selectedUserIds.includes(u.id)}
                            onChange={() => handleToggleUser(u.id)}
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                          />
                          <div>
                            <div className="text-sm font-bold text-slate-800">{u.name}</div>
                            <div className="text-xs text-slate-500 capitalize">{u.role} {u.class ? `| Class ${u.class}` : ''}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {selectedUserIds.length > 0 && (
                  <div className="text-xs font-bold text-blue-600">
                    {selectedUserIds.length} user(s) selected
                  </div>
                )}
              </div>
            )}

            {/* Subject */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Message Subject..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                required
              />
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                rows={6}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                required
              ></textarea>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 rounded-b-2xl">
          <button 
            type="button" 
            onClick={onClose}
            className="px-5 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="message-form"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full" viewBox="0 0 24 24"></svg>
                Sending...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Send Message
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
