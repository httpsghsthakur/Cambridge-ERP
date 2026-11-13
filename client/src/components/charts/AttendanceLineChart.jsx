import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    const val = payload[0].value;
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
        <p className="font-semibold text-gray-700">{label}</p>
        <p className={val >= 85 ? 'text-green-600' : val >= 75 ? 'text-yellow-600' : 'text-red-500'}>
          {val}% attendance
        </p>
      </div>
    );
  }
  return null;
};

export default function AttendanceLineChart({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
          tickFormatter={v => `${v}%`} width={36} />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={75} stroke="#fbbf24" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: '75%', fill: '#fbbf24', fontSize: 10, position: 'right' }} />
        <Line type="monotone" dataKey="pct" stroke="#22c55e" strokeWidth={2.5}
          dot={{ r: 4, fill: '#22c55e', strokeWidth: 2, stroke: '#fff' }}
          activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}