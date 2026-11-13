import { getAttendanceBarColor } from '../../utils/helpers';

export default function ProgressBar({ value = 0, max = 100, color, showLabel = false, height = 'h-1.5' }) {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  const barColor = color || getAttendanceBarColor(pct);

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 bg-gray-100 rounded-full overflow-hidden ${height}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-gray-500 w-8 text-right">{pct}%</span>
      )}
    </div>
  );
}