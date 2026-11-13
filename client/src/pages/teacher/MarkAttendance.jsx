import { useState, useEffect } from 'react';
import API from '../../utils/api';
import AttendanceForm from '../../components/forms/AttendanceForm';
import { CLASSES, SECTIONS } from '../../constants/roles';
import { todayInput } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function MarkAttendance() {
  const [cls, setCls]           = useState('Class 8');
  const [section, setSection]   = useState('A');
  const [date, setDate]         = useState(todayInput());
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [canMark, setCanMark]   = useState(false);
  const [allowedClasses, setAllowedClasses] = useState([]);
  const [inchargeClasses, setInchargeClasses] = useState([]);

  useEffect(() => {
    API.get('/attendance/assigned-classes')
      .then(r => {
        const classes = r.data.classes || [];
        const incharges = r.data.incharge_classes || [];
        setAllowedClasses(classes);
        setInchargeClasses(incharges);
        // Prioritize jumping to teacher's incharge class if available
        if (incharges.length > 0) {
          setCls(incharges[0].class);
          setSection(incharges[0].section);
        } else if (classes.length > 0 && !classes.includes(cls)) {
          setCls(classes[0]);
        }
      })
      .catch(() => toast.error('Failed to load assigned classes'));
  }, []);

  useEffect(() => {
    setLoading(true);
    setSaved(false);
    API.get(`/students?class=${cls}&section=${section}`)
      .then(async r => {
        const list = r.data.students || [];
        setStudents(list);

        // Pre-fill existing attendance for selected date
        try {
          const existing = await API.get(`/attendance/class?class=${cls}&section=${section}&date=${date}`);
          const records = existing.data.records || [];
          setIsFinalized(existing.data.is_finalized || false);
          setCanMark(existing.data.can_mark ?? false);

          const init = {};
          list.forEach(s => { init[s.id] = 'present'; });
          records.forEach(record => {
            if (record.status !== 'not_marked') init[record.student.id] = record.status;
          });
          setAttendance(init);
        } catch {
          setIsFinalized(false);
          setCanMark(false);
          const init = {};
          list.forEach(s => { init[s.id] = 'present'; });
          setAttendance(init);
        }
      })
      .catch(() => toast.error('Failed to load students'))
      .finally(() => setLoading(false));
  }, [cls, section, date]);

  const handleSave = async (finalize = false) => {
    if (!canMark) {
      toast.error('Access denied. Only the assigned Class Incharge can mark attendance.');
      return;
    }
    if (finalize && !window.confirm('Are you sure you want to finalize? You cannot change this later!')) return;
    setSaving(true);
    try {
      const records = Object.entries(attendance).map(([student_id, status]) => ({
        student_id: parseInt(student_id), status
      }));
      await API.post('/attendance/bulk', { class: cls, section, date, records, is_finalized: finalize });
      toast.success(finalize ? 'Attendance finalized!' : 'Attendance saved!');
      setSaved(true);
      if (finalize) setIsFinalized(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(attendance).filter(v => v === 'present').length;
  const absentCount  = Object.values(attendance).filter(v => v === 'absent').length;

  const f = 'border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white';

  return (
    <div className="max-w-3xl space-y-5">
      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex gap-3 flex-wrap items-center">
          <select value={cls} onChange={e => setCls(e.target.value)} className={f}>
            {(allowedClasses.length > 0 ? allowedClasses : CLASSES).map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={section} onChange={e => setSection(e.target.value)} className={f}>
            {SECTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={f} max={todayInput()} />
        </div>

        {/* View-Only Alert when teacher is NOT class incharge */}
        {!canMark && !loading && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-800 text-xs shadow-sm">
            <div className="flex items-start sm:items-center gap-2.5">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5 sm:mt-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <span className="font-bold">View-Only Mode: </span>
                <span>You can view attendance for this assigned class. Only the official <strong>Class Incharge</strong> is authorized to mark or submit attendance.</span>
              </div>
            </div>
            {inchargeClasses.length > 0 && (
              <button
                onClick={() => {
                  setCls(inchargeClasses[0].class);
                  setSection(inchargeClasses[0].section);
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors self-start sm:self-auto shadow-sm"
              >
                Go to My Class ({inchargeClasses[0].class} - {inchargeClasses[0].section}) →
              </button>
            )}
          </div>
        )}

        {/* Summary pills */}
        {students.length > 0 && (
          <div className="flex gap-2 flex-wrap items-center mt-3 pt-2 border-t border-gray-100">
            {[
              { label: 'Total', val: students.length, color: 'bg-gray-100 text-gray-600' },
              { label: 'Present', val: presentCount, color: 'bg-green-100 text-green-700' },
              { label: 'Absent',  val: absentCount,  color: 'bg-red-100 text-red-700' },
              { label: 'Late',    val: Object.values(attendance).filter(v => v === 'late').length, color: 'bg-yellow-100 text-yellow-700' },
            ].map(item => (
              <div key={item.label} className={`${item.color} rounded-lg px-3 py-1.5 text-xs font-medium`}>
                {item.val} {item.label}
              </div>
            ))}
            {canMark ? (
              <div className="ml-auto bg-purple-50 text-purple-700 border border-purple-200 text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                Class Incharge (Authorized)
              </div>
            ) : (
              <div className="ml-auto bg-amber-50 text-amber-700 border border-amber-200 text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                View Only
              </div>
            )}
            {isFinalized && <div className="bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg font-medium">Finalized</div>}
            {saved && !isFinalized && <div className="bg-green-50 text-green-600 text-xs px-3 py-1.5 rounded-lg font-medium">✓ Saved Draft</div>}
          </div>
        )}
      </div>

      {/* Attendance form */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          {cls} — Section {section} &nbsp;·&nbsp;
          <span className="text-gray-400 font-normal">{new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long' })}</span>
        </h3>
        {loading ? (
          <p className="text-center text-gray-400 py-8 text-sm">Loading students...</p>
        ) : students.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">No students found for this class.</p>
        ) : (
          <AttendanceForm
            students={students}
            attendance={attendance}
            onChange={setAttendance}
            onSave={() => handleSave(false)}
            onFinalize={() => handleSave(true)}
            loading={saving}
            isFinalized={isFinalized}
            readOnly={!canMark}
            readOnlyMessage={`View-Only: You can view attendance for ${cls} (${section}), but only the assigned Class Incharge can mark or finalize attendance.`}
          />
        )}
      </div>
    </div>
  );
}