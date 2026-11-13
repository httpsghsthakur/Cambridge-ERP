import { useState, useEffect, useRef } from 'react';
import API from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { can } from '../../utils/roleUtils';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const typeStyle = {
  fee_reminder:     { icon: '', badge: 'bg-yellow-100 text-yellow-700' },
  attendance_alert: { icon: '', badge: 'bg-red-100 text-red-700' },
  result:           { icon: '', badge: 'bg-blue-100 text-blue-700' },
  holiday:          { icon: '', badge: 'bg-green-100 text-green-700' },
  general:          { icon: 'ℹ️', badge: 'bg-gray-100 text-gray-600' },
  admission:        { icon: '', badge: 'bg-purple-100 text-purple-700' },
  promotion:        { icon: '', badge: 'bg-orange-100 text-orange-700' },
  exam_datesheet:   { icon: '', badge: 'bg-indigo-100 text-indigo-700' },
  achievement:      { icon: '', badge: 'bg-amber-100 text-amber-700' },
};

export default function Notifications() {
  const { user }  = useAuth();
  const canSend   = can(user, 'SEND_NOTIFICATIONS');

  const [notifs, setNotifs]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [sending, setSending]         = useState(false);

  // Form state
  const [title, setTitle]             = useState('');
  const [message, setMessage]         = useState('');
  const [type, setType]               = useState('general');
  const [recipientType, setRecipType] = useState('all');
  const [recipientRole, setRecipRole] = useState('students');
  const [recipientUserId, setRecipId] = useState('');

  // Individual user search
  const [userQuery, setUserQuery]     = useState('');
  const [userResults, setUserResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const searchTimer = useRef(null);

  const load = () => {
    setLoading(true);
    API.get('/notifications')
      .then(r => setNotifs(r.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const searchUsers = (q) => {
    clearTimeout(searchTimer.current);
    if (!q || q.length < 2) { setUserResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      try {
        const r = await API.get(`/notifications/users/search?q=${q}`);
        setUserResults(r.data || []);
      } catch {}
    }, 400);
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return toast.error('Title and message are required.');
    if (recipientType === 'individual' && !selectedUser) return toast.error('Select a user for individual notification.');

    setSending(true);
    try {
      await API.post('/notifications', {
        title,
        message,
        type,
        recipient_type:    recipientType,
        recipient_role:    recipientType === 'role' ? recipientRole : undefined,
        recipient_user_id: recipientType === 'individual' ? selectedUser?.id : undefined,
      });
      toast.success('Notification sent!');
      setTitle(''); setMessage(''); setSelectedUser(null); setUserQuery(''); setUserResults([]);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.');
    } finally { setSending(false); }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/notifications/${id}`);
      load();
    } catch { toast.error('Failed.'); }
  };

  const ROLE_OPTIONS = ['students','parents','teachers','fee_collector','admin2'];
  const f = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 bg-white';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Send form */}
      {canSend && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700"> Send Notification</h3>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className={f} placeholder="e.g. Fee Due Reminder" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Message *</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} className={f}
              placeholder="Write your message..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Type</label>
              <select value={type} onChange={e => setType(e.target.value)} className={f}>
                {Object.keys(typeStyle).map(t => <option key={t} value={t}>{t.replace('_',' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Send To</label>
              <select value={recipientType} onChange={e => setRecipType(e.target.value)} className={f}>
                <option value="all">Everyone</option>
                <option value="role">By Role</option>
                <option value="individual">Individual User</option>
              </select>
            </div>
          </div>

          {/* Role selector */}
          {recipientType === 'role' && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Role</label>
              <select value={recipientRole} onChange={e => setRecipRole(e.target.value)} className={f}>
                {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          )}

          {/* Individual user search */}
          {recipientType === 'individual' && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Search User</label>

              {selectedUser ? (
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div>
                    <p className="font-medium text-sm text-gray-800">{selectedUser.name}</p>
                    <p className="text-xs text-gray-500">{selectedUser.email} · {selectedUser.role}</p>
                  </div>
                  <button
                    onClick={() => { setSelectedUser(null); setUserQuery(''); }}
                    className="text-gray-400 hover:text-red-400 text-sm"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    value={userQuery}
                    onChange={e => { setUserQuery(e.target.value); searchUsers(e.target.value); }}
                    className={f}
                    placeholder="Search by name or email..."
                  />
                  {userResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg mt-1 z-10 max-h-48 overflow-y-auto">
                      {userResults.map(u => (
                        <div
                          key={u.id}
                          onClick={() => { setSelectedUser(u); setRecipId(u.id); setUserResults([]); setUserQuery(''); }}
                          className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer"
                        >
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {u.name?.[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{u.name}</p>
                            <p className="text-xs text-gray-400">{u.email} · {u.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleSend}
            disabled={sending}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            {sending ? 'Sending...' : ' Send Notification'}
          </button>
        </div>
      )}

      {/* Notification list */}
      <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${!canSend ? 'lg:col-span-2' : ''}`}>
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Notifications</h3>
          <span className="text-xs text-gray-400">{notifs.filter(n => !n.is_read).length} unread</span>
        </div>

        {loading ? (
          <p className="text-center py-10 text-gray-400 text-sm">Loading...</p>
        ) : notifs.length === 0 ? (
          <p className="text-center py-10 text-gray-400 text-sm">No notifications.</p>
        ) : (
          <div className="divide-y divide-gray-50 max-h-[520px] overflow-y-auto">
            {notifs.map(n => {
              const style = typeStyle[n.type] || typeStyle.general;
              return (
                <div key={n.id} className={`flex gap-3 px-4 sm:px-5 py-3.5 hover:bg-gray-50 transition-colors border-l-2 ${n.is_read ? 'border-transparent' : 'border-blue-400 bg-blue-50/30'}`}>
                  <span className="text-lg mt-0.5 flex-shrink-0">{style.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-gray-800">{n.title}</span>
                      <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${style.badge}`}>
                        {n.type?.replace('_',' ')}
                      </span>
                      {/* Recipient badge */}
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">
                        {n.recipient_type === 'individual' ? ' Individual'
                          : n.recipient_type === 'role' ? ` ${n.recipient_role}`
                          : ' All'}
                      </span>
                      <span className="text-xs text-gray-400 ml-auto">
                        {formatDate(n.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                  </div>
                  {canSend && (
                    <button onClick={() => handleDelete(n.id)}
                      className="text-gray-300 hover:text-red-400 text-xs self-start mt-0.5 flex-shrink-0">✕</button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}