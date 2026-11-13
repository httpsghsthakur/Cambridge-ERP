import { useState, useEffect, useMemo } from 'react';
import API from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function Events() {
  const { user } = useAuth();
  const isAdminOrAdmin2 = user?.role === 'admin' || user?.role === 'admin2';

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'upcoming' | 'past'

  // Form states
  const [editId, setEditId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [showModal, setShowModal] = useState(false);

  const loadEvents = () => {
    setLoading(true);
    const url = isAdminOrAdmin2 ? '/events?includePast=true' : '/events';
    API.get(url)
      .then((res) => setEvents(Array.isArray(res.data) ? res.data : []))
      .catch(() => toast.error('Failed to load events.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const startOfToday = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const { upcomingEvents, pastEvents, visibleEvents } = useMemo(() => {
    const upcoming = [];
    const past = [];
    for (const ev of events) {
      const d = new Date(ev.event_date);
      if (!Number.isNaN(d.getTime()) && d >= startOfToday) {
        upcoming.push(ev);
      } else {
        past.push(ev);
      }
    }
    upcoming.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
    past.sort((a, b) => new Date(b.event_date) - new Date(a.event_date));

    let list = [...upcoming, ...past];
    if (filterTab === 'upcoming') list = upcoming;
    if (filterTab === 'past') list = past;

    return { upcomingEvents: upcoming, pastEvents: past, visibleEvents: list };
  }, [events, filterTab, startOfToday]);

  const openCreateModal = () => {
    setEditId(null);
    setTitle('');
    setDescription('');
    setEventDate('');
    setLocation('');
    setShowModal(true);
  };

  const openEditModal = (event) => {
    setEditId(event.id);
    setTitle(event.title);
    setDescription(event.description || '');
    // Format date for datetime-local input in user's local timezone
    if (event.event_date) {
      const d = new Date(event.event_date);
      const tzOffset = d.getTimezoneOffset() * 60000;
      const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
      setEventDate(localISOTime);
    } else {
      setEventDate('');
    }
    setLocation(event.location || '');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim() || !eventDate) {
      return toast.error('Title and Date are required.');
    }

    const parsedLocal = new Date(eventDate);
    if (Number.isNaN(parsedLocal.getTime())) {
      return toast.error('Please enter a valid event date and time.');
    }

    setSaving(true);
    const payload = {
      title: title.trim(),
      description: description.trim(),
      event_date: parsedLocal.toISOString(),
      location: location.trim(),
    };

    try {
      if (editId) {
        await API.put(`/events/${editId}`, payload);
        toast.success('Event updated successfully!');
      } else {
        await API.post('/events', payload);
        toast.success('Event created successfully!');
      }
      setShowModal(false);
      loadEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save event.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await API.delete(`/events/${id}`);
      toast.success('Event deleted successfully.');
      loadEvents();
    } catch {
      toast.error('Failed to delete event.');
    }
  };

  const inputClass = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white transition-all';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Upcoming Events</h2>
          <p className="text-slate-400 text-sm font-semibold mt-1">
            {isAdminOrAdmin2
              ? 'Manage academic calendars, meetings, and school events.'
              : 'View upcoming academic calendars, meetings, and school events.'}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {isAdminOrAdmin2 && (
            <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200/70">
              {[
                { key: 'all', label: `All (${events.length})` },
                { key: 'upcoming', label: `Upcoming (${upcomingEvents.length})` },
                { key: 'past', label: `Past (${pastEvents.length})` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilterTab(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterTab === tab.key
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
          {isAdminOrAdmin2 && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-lg shadow-blue-500/10 active:scale-95 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354v15m7.5-7.5H4.5" />
              </svg>
              Add New Event
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-center text-slate-400 text-sm py-12">Loading events...</p>
      ) : visibleEvents.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center text-slate-400 text-sm shadow-card">
          <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {filterTab === 'past' ? 'No past events recorded.' : 'No upcoming events scheduled.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleEvents.map((event) => {
            const eventDateObj = new Date(event.event_date);
            const isPast = !Number.isNaN(eventDateObj.getTime()) && eventDateObj < startOfToday;
            const formattedDate = eventDateObj.toLocaleString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            });

            return (
              <div
                key={event.id}
                className="bg-white border border-slate-100 rounded-3xl p-5 shadow-card hover:shadow-premium transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${
                      isPast
                        ? 'text-slate-500 bg-slate-100 border-slate-200'
                        : 'text-blue-600 bg-blue-50 border-blue-100/60'
                    }`}>
                      {isPast ? 'Past Event' : 'Upcoming'}
                    </span>
                    {isAdminOrAdmin2 && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(event)}
                          className="p-1 text-slate-400 hover:text-blue-500 hover:bg-slate-50 rounded-lg transition-all"
                          title="Edit Event"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg transition-all"
                          title="Delete Event"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-lg mt-3.5 tracking-tight">{event.title}</h3>
                  <p className="text-slate-500 text-xs mt-2 leading-relaxed">{event.description || 'No description provided.'}</p>
                </div>
                <div className="mt-5 pt-4 border-t border-slate-50 space-y-2 text-slate-400 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-slate-500">
                    <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formattedDate}
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2 font-medium">
                      <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {event.location}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 w-full max-w-lg shadow-premium space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-lg">{editId ? 'Edit Event' : 'Create New Event'}</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-all"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Event Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Annual Science Exhibition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={inputClass}
                  rows={3}
                  placeholder="Provide brief details about the event..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className={inputClass}
                    placeholder="e.g. School Auditorium / Online"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-slate-200 text-slate-500 hover:bg-slate-50 text-sm font-semibold py-3 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-sm font-semibold py-3 rounded-xl shadow-lg shadow-blue-500/10 transition-all disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
