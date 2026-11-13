import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS  = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];
const LABELS  = ['A / A+', 'B', 'C', 'D / F'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
        <p className="font-semibold">{payload[0].name}</p>
        <p className="text-gray-600">{payload[0].value} students</p>
      </div>
    );
  }
  return null;
};

export default function PerformancePieChart({ data = [] }) {
  const pieData = data.length > 0 ? data : LABELS.map((name, i) => ({ name, value: [12, 8, 5, 3][i] }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="45%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {pieData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => <span style={{ fontSize: 11, color: '#64748b' }}>{value}</span>}
          iconSize={10}
          iconType="circle"
        />
      </PieChart>
    </ResponsiveContainer>
  );
}