import { useState, useEffect } from 'react';
import { getGrade, getGradeBg } from '../../utils/helpers';
import { SUBJECTS, EXAM_TYPES } from '../../constants/roles';

export default function MarksForm({ students = [], onSubmit, loading = false, availableSubjects = [] }) {
  const [examName, setExamName]   = useState('');
  const [examType, setExamType]   = useState('half_yearly');
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [subject, setSubject]     = useState('Mathematics');
  const [maxMarks, setMaxMarks]   = useState(100);
  const [marks, setMarks]         = useState({});

  useEffect(() => {
    const init = {};
    students.forEach(s => { init[s.id] = ''; });
    setMarks(init);
  }, [students.length]);

  const setMark = (id, val) => {
    const clamped = Math.min(Math.max(0, parseInt(val) || 0), maxMarks);
    setMarks(prev => ({ ...prev, [id]: clamped }));
  };

  const handleSubmit = () => {
    const trimmedSubject = subject.trim();
    if (!trimmedSubject) return;

    const subjects = [{
      subject: trimmedSubject,
      max_marks: parseInt(maxMarks),
      entries: students.map(s => ({ student_id: s.id, obtained_marks: parseInt(marks[s.id]) || 0 }))
    }];
    onSubmit({ exam_name: examName, exam_type: examType, subjects });
  };

  const f = 'border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 transition-all';

  const customSubjects = (availableSubjects || []).filter(s => s && !SUBJECTS.includes(s));

  return (
    <div className="space-y-4">
      {/* Exam details */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Exam Name *</label>
          <input value={examName} onChange={e => setExamName(e.target.value)}
            className={`${f} w-full`} placeholder="Half Yearly 2024-25" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Exam Type</label>
          <select value={examType} onChange={e => setExamType(e.target.value)} className={`${f} w-full`}>
            {EXAM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-gray-500">Subject *</label>
            <button
              type="button"
              onClick={() => {
                setIsCustomSubject(p => !p);
                if (!isCustomSubject) setSubject('');
                else setSubject(SUBJECTS[0]);
              }}
              className="text-[11px] text-blue-600 hover:underline font-medium"
            >
              {isCustomSubject ? '← Choose from list' : '+ Custom subject'}
            </button>
          </div>
          {isCustomSubject ? (
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Robotics, French..."
              className={`${f} w-full`}
              required
              autoFocus
            />
          ) : (
            <select
              value={subject}
              onChange={e => {
                if (e.target.value === '__custom__') {
                  setIsCustomSubject(true);
                  setSubject('');
                } else {
                  setSubject(e.target.value);
                }
              }}
              className={`${f} w-full`}
            >
              <optgroup label="Standard Subjects">
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </optgroup>
              {customSubjects.length > 0 && (
                <optgroup label="Assigned Class Subjects">
                  {customSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                </optgroup>
              )}
              <option value="__custom__">+ Enter custom subject...</option>
            </select>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Max Marks</label>
          <input type="number" value={maxMarks} onChange={e => setMaxMarks(e.target.value)}
            className={`${f} w-full`} min={1} max={200} />
        </div>
      </div>

      {/* Marks entry */}
      <div className="space-y-1.5 max-h-72 overflow-y-auto">
        {students.map(s => {
          const obtained = parseInt(marks[s.id]) || 0;
          const grade    = marks[s.id] !== '' ? getGrade(obtained, maxMarks) : '';
          return (
            <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
              <span className="text-xs text-gray-400 w-5">{s.roll_number}</span>
              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center">
                {s.first_name?.[0]}
              </div>
              <span className="text-sm flex-1 text-gray-700">{s.first_name} {s.last_name}</span>
              <input
                type="number"
                min={0}
                max={maxMarks}
                value={marks[s.id]}
                onChange={e => setMark(s.id, e.target.value)}
                className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center outline-none focus:border-blue-500"
                placeholder="—"
              />
              {grade && (
                <span className={`text-xs font-bold px-2 py-1 rounded-md w-10 text-center ${getGradeBg(grade)}`}>
                  {grade}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || !examName || !subject.trim() || students.length === 0}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
      >
        {loading ? 'Saving...' : 'Save Marks'}
      </button>
    </div>
  );
}
