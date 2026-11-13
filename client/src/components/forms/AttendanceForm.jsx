export default function AttendanceForm({
  students = [],
  attendance,
  onChange,
  onSave,
  onFinalize,
  loading,
  isFinalized,
  readOnly = false,
  readOnlyMessage
}) {
  const presentCount = Object.values(attendance).filter(v => v === 'present').length;
  const absentCount  = Object.values(attendance).filter(v => v === 'absent').length;

  const markAll = (status) => {
    if (readOnly || isFinalized) return;
    const updated = {};
    students.forEach(s => { updated[s.id] = status; });
    onChange(updated);
  };

  const mark = (id, status) => {
    if (readOnly || isFinalized) return;
    onChange(prev => ({ ...prev, [id]: status }));
  };

  const statusConfig = {
    present: { label: 'P', bg: 'bg-green-100 border-green-300 text-green-700', active: 'ring-2 ring-green-400' },
    absent:  { label: 'A', bg: 'bg-red-100 border-red-300 text-red-700',     active: 'ring-2 ring-red-400' },
    late:    { label: 'L', bg: 'bg-yellow-100 border-yellow-300 text-yellow-700', active: 'ring-2 ring-yellow-400' },
  };

  return (
    <div>
      {/* Quick actions + summary */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => markAll('present')}
            disabled={isFinalized || readOnly}
            className="text-xs bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ✓ All Present
          </button>
          <button
            onClick={() => markAll('absent')}
            disabled={isFinalized || readOnly}
            className="text-xs bg-red-50 border border-red-200 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ✗ All Absent
          </button>
          {readOnly && (
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
              View Only
            </span>
          )}
        </div>
        <div className="flex gap-3 text-xs text-gray-500">
          <span className="text-green-600 font-medium">{presentCount} Present</span>
          <span className="text-red-500 font-medium">{absentCount} Absent</span>
          <span className="text-yellow-600 font-medium">{Object.values(attendance).filter(v => v === 'late').length} Late</span>
        </div>
      </div>

      {/* Student list */}
      <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
        {students.map(s => {
          const current = attendance[s.id] || 'present';
          return (
            <div key={s.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors
              ${current === 'absent' ? 'bg-red-50 border-red-100' :
                current === 'late'  ? 'bg-yellow-50 border-yellow-100' :
                'bg-gray-50 border-gray-100'}`}>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-5">{s.roll_number}</span>
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center">
                  {s.first_name?.[0]}
                </div>
                <span className="text-sm font-medium text-gray-700">{s.first_name} {s.last_name}</span>
              </div>
              <div className="flex gap-1">
                {Object.entries(statusConfig).map(([status, cfg]) => (
                  <button
                    key={status}
                    disabled={isFinalized || readOnly}
                    onClick={() => mark(s.id, status)}
                    className={`w-8 h-8 rounded-lg border text-xs font-bold transition-all ${cfg.bg} ${current === status ? cfg.active : 'opacity-40 hover:opacity-70'} disabled:cursor-not-allowed`}
                    title={readOnly ? 'View Only: Class Incharge permission required' : undefined}
                  >
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4">
        {readOnly ? (
          <div className="w-full text-center py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 flex items-center justify-center gap-2 shadow-sm">
            <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>{readOnlyMessage || 'View-Only Mode: Only the assigned Class Incharge can mark or submit attendance.'}</span>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={onSave}
              disabled={loading || students.length === 0 || isFinalized}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors shadow-sm"
            >
              {loading ? 'Saving...' : `Save Draft`}
            </button>
            <button
              onClick={onFinalize}
              disabled={loading || students.length === 0 || isFinalized}
              className="flex-1 bg-gray-800 hover:bg-gray-900 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors shadow-sm"
            >
              {loading ? 'Processing...' : `Finalize`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}