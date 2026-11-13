export default function StatCard({ label, value, sub, icon, color = 'text-gray-800' }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-gray-500 leading-tight">{label}</p>
        {icon && (
          <span className="text-xl opacity-70 flex-shrink-0">{icon}</span>
        )}
      </div>
      <p className={`text-xl sm:text-2xl font-bold mt-2 ${color} leading-tight`}>
        {value}
      </p>
      {sub && (
        <p className="text-xs text-gray-400 mt-1 leading-tight">{sub}</p>
      )}
    </div>
  );
}