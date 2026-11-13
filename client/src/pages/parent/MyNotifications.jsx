import { useState, useEffect } from 'react';
import API from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const typeStyle = {
  fee_reminder:     { icon: '', badge: 'bg-yellow-100 text-yellow-700' },
  attendance_alert: { icon: '', badge: 'bg-red-100 text-red-700' },
  result:           { icon: '', badge: 'bg-blue-100 text-blue-700' },
  holiday:          { icon: '', badge: 'bg-green-100 text-green-700' },
  general:          { icon: 'ℹ️', badge: 'bg-gray-100 text-gray-600' },
  exam_datesheet:   { icon: '', badge: 'bg-purple-100 text-purple-700' },
  achievement:      { icon: '', badge: 'bg-amber-100 text-amber-700' },
};

export default function MyNotifications() {
  const [notifs, setNotifs]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/notifications')
      .then(r => setNotifs(r.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const markRead = async (id) => {
    try {
      await API.post(`/notifications/${id}/read`);
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {}
  };

  const markAllRead = () => {
    notifs.filter(n => !n.is_read).forEach(n => markRead(n.id));
  };

  const unread = notifs.filter(n => !n.is_read).length;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {unread > 0
            ? <><span className="text-blue-600 font-semibold">{unread}</span> unread</>
            : 'All caught up ✓'
          }
        </p>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs text-blue-500 hover:text-blue-700 font-medium"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications */}
      {notifs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
          No notifications yet.
        </div>
      ) : (
        <div className="space-y-2">
          {notifs.map(n => {
            const style = typeStyle[n.type] || typeStyle.general;
            return (
              <div
                key={n.id}
                onClick={() => !n.is_read && markRead(n.id)}
                className={`flex gap-3 sm:gap-4 p-4 rounded-xl border transition-all cursor-pointer active:scale-[0.99]
                  ${n.is_read
                    ? 'bg-white border-gray-200 hover:bg-gray-50'
                    : 'bg-blue-50 border-blue-100'
                  }`}
              >
                <span className="text-xl sm:text-2xl mt-0.5 flex-shrink-0">{style.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`font-semibold text-sm ${n.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                      {n.title}
                    </span>
                    <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${style.badge}`}>
                      {n.type?.replace('_', ' ')}
                    </span>
                    {!n.is_read && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1.5">
                    {formatDate(n.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}