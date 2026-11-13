import { useState, useEffect, useRef } from 'react';
import API from '../../utils/api';
import AttendanceForm from '../../components/forms/AttendanceForm';
import { CLASSES, SECTIONS } from '../../constants/roles';
import { todayInput } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function Attendance() {
  const [cls, setCls]           = useState('Class 8');
  const [section, setSection]   = useState('A');
  const [date, setDate]         = useState(todayInput());
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    setLoading(true);
    API.get(`/students?class=${cls}&section=${section}`)
      .then(r => {
        const list = r.data.students || [];
        setStudents(list);
        const init = {};
        list.forEach(s => { init[s.id] = 'present'; });
        setAttendance(init);
      })
      .catch(() => toast.error('Failed to load students'))
      .finally(() => setLoading(false));
  }, [cls, section]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = Object.entries(attendance).map(([student_id, status]) => ({
        student_id: parseInt(student_id), status
      }));
      await API.post('/attendance/bulk', { class: cls, section, date, records });
      toast.success('Attendance saved!');
    } catch {
      toast.error('Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const f = 'border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 bg-white w-full';

  // --- Search Student Attendance State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedStudentAtt, setSelectedStudentAtt] = useState(null);
  const searchTimer = useRef(null);

  const handleSearch = (q) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    setShowResults(true);
    setSearching(true);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      API.get(`/students?search=${encodeURIComponent(q)}&limit=5`)
        .then(res => setSearchResults(res.data.students || []))
        .catch(err => console.error(err))
        .finally(() => setSearching(false));
    }, 500);
  };

  const fetchStudentAttendance = (student) => {
    setShowResults(false);
    setSelectedStudentAtt({ loading: true, student });
    API.get(`/dashboard/student-attendance/${student.id}`)
      .then(res => {
        setSelectedStudentAtt({ loading: false, data: res.data, student });
      })
      .catch(err => {
        toast.error('Failed to fetch attendance');
        setSelectedStudentAtt(null);
      });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Search & Check Attendance Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Check Student Attendance
        </h3>
        
        <div className="relative max-w-md mb-4">
          <input 
            type="text" 
            placeholder="Search by name or roll number..." 
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => { if (searchQuery.trim()) setShowResults(true); }}
            className={f + ' pl-10'}
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          
          {/* Dropdown Results */}
          {showResults && searchQuery.trim() !== '' && (
            <div className="absolute z-20 w-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden max-h-48 overflow-y-auto">
              {searchResults.length > 0 ? (
                searchResults.map(s => (
                  <div 
                    key={s.id} 
                    onClick={() => fetchStudentAttendance(s)}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                  >
                    <div className="font-bold text-gray-800 text-xs">{s.first_name} {s.last_name}</div>
                    <div className="text-[10px] text-gray-500 font-semibold mt-0.5">Roll: {s.roll_number} | Class: {s.class}-{s.section}</div>
                  </div>
                ))
              ) : (
                !searching && <div className="p-4 text-center text-xs text-gray-400 font-semibold">No students found.</div>
              )}
            </div>
          )}
        </div>

        {/* Selected Student Stats */}
        {selectedStudentAtt && !selectedStudentAtt.loading && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-gray-800 text-sm">{selectedStudentAtt.student.first_name} {selectedStudentAtt.student.last_name}</h4>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Roll No: {selectedStudentAtt.student.roll_number} &bull; {selectedStudentAtt.student.class} {selectedStudentAtt.student.section}</p>
              </div>
              <div className="flex gap-3">
                <div className="text-center bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">This Month</div>
                  <div className={`text-lg font-black ${selectedStudentAtt.data.monthly.percentage < 80 ? 'text-red-500' : 'text-green-500'}`}>
                    {selectedStudentAtt.data.monthly.percentage}%
                  </div>
                </div>
                <div className="text-center bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current Session</div>
                  <div className={`text-lg font-black ${selectedStudentAtt.data.yearly.percentage < 80 ? 'text-red-500' : 'text-green-500'}`}>
                    {selectedStudentAtt.data.yearly.percentage}%
                  </div>
                </div>
              </div>
            </div>

            {selectedStudentAtt.data.sessionComparison?.length > 0 && (
              <div className="pt-2 border-t border-slate-200/80">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Session-Wise &amp; Class-Wise Attendance Comparison
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {selectedStudentAtt.data.sessionComparison.map((item, idx) => (
                    <div
                      key={`${item.session_id || item.session_name}-${idx}`}
                      className={`rounded-lg border px-3 py-2 bg-white text-xs ${item.is_current ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200'}`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-slate-700 truncate">{item.session_name}</span>
                        <span className={`font-black ${item.total === 0 ? 'text-slate-400' : item.percentage < 80 ? 'text-red-500' : 'text-emerald-600'}`}>
                          {item.percentage}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Class: <span className="font-semibold text-slate-700">{item.class_name || '—'}</span>
                        {' · '}{item.present}P / {item.absent}A / {item.late}L ({item.total} days)
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <hr className="border-gray-200" />

      {/* Mark Class Attendance */}
      <h3 className="text-lg font-bold text-gray-800">Mark Class Attendance</h3>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
            <select value={cls} onChange={e => setCls(e.target.value)} className={f}>
              {CLASSES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Section</label>
            <select value={section} onChange={e => setSection(e.target.value)} className={f}>
              {SECTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
            <input
              type="date"
              value={date}
              max={todayInput()}
              onChange={e => setDate(e.target.value)}
              className={f}
            />
          </div>
        </div>

        {/* Summary pills */}
        {students.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {[
              { label: 'Total',   val: students.length,                                               color: 'bg-gray-100 text-gray-600' },
              { label: 'Present', val: Object.values(attendance).filter(v => v === 'present').length, color: 'bg-green-100 text-green-700' },
              { label: 'Absent',  val: Object.values(attendance).filter(v => v === 'absent').length,  color: 'bg-red-100 text-red-700' },
              { label: 'Late',    val: Object.values(attendance).filter(v => v === 'late').length,    color: 'bg-yellow-100 text-yellow-700' },
            ].map(item => (
              <span key={item.label} className={`${item.color} rounded-lg px-3 py-1 text-xs font-medium`}>
                {item.val} {item.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Attendance form */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          {cls} — Section {section} &nbsp;·&nbsp;
          <span className="text-gray-400 font-normal text-xs">
            {new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long' })}
          </span>
        </h3>
        {loading ? (
          <p className="text-center text-gray-400 py-8 text-sm">Loading students...</p>
        ) : students.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">No students found.</p>
        ) : (
          <AttendanceForm
            students={students}
            attendance={attendance}
            onChange={setAttendance}
            onSave={handleSave}
            loading={saving}
          />
        )}
      </div>
    </div>
  );
}