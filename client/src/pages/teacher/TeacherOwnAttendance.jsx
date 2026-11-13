import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const statusBg = {
  present:  'bg-green-100 text-green-700',
  absent:   'bg-red-100 text-red-700',
  half_day: 'bg-yellow-100 text-yellow-700',
  leave:    'bg-orange-100 text-orange-700',
  holiday:  'bg-gray-100 text-gray-500',
};

const CHART_COLORS = {
  Present: '#22c55e', // green-500
  Absent: '#ef4444', // red-500
  'Half Day': '#eab308', // yellow-500
  Leave: '#f97316', // orange-500
  Holiday: '#94a3b8' // slate-400
};

export default function TeacherOwnAttendance() {
  const { user } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    API.get(`/teacher-attendance/my?month=${month}&year=${year}`)
      .then(r => { setRecords(r.data.records || []); setStats(r.data.stats || {}); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [month, year]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay    = new Date(year, month - 1, 1).getDay();
  const recordMap   = {};
  records.forEach(r => { recordMap[new Date(r.date).getDate()] = r.status; });

  const dayLabels = ['S','M','T','W','T','F','S'];

  // Prepare chart data
  const chartData = [
    { name: 'Present', value: stats.present || 0, color: CHART_COLORS.Present },
    { name: 'Absent', value: stats.absent || 0, color: CHART_COLORS.Absent },
    { name: 'Half Day', value: stats.half_day || 0, color: CHART_COLORS['Half Day'] },
    { name: 'Leave', value: stats.leave || 0, color: CHART_COLORS.Leave },
    { name: 'Holiday', value: stats.holiday || 0, color: CHART_COLORS.Holiday }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="font-bold text-gray-800 text-lg">My Attendance</h2>
        <select 
          value={month} 
          onChange={e => setMonth(Number(e.target.value))}
          className="border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-gray-50/50 transition-all cursor-pointer"
        >
          {MONTHS.map((m, i) => <option key={m} value={i+1}>{m} {year}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Side: Stats and Infographics */}
        <div className="space-y-6">
          {/* Stats Grid */}
          {!loading && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Present',  val: stats.present    || 0, color: 'text-green-600', bg: 'bg-green-50' },
                { label: 'Absent',   val: stats.absent     || 0, color: 'text-red-500', bg: 'bg-red-50' },
                { label: 'Leave',    val: stats.leave      || 0, color: 'text-orange-500', bg: 'bg-orange-50' },
                { label: '%',        val: `${stats.percentage || 0}%`,
                  color: (stats.percentage||0)>=85?'text-green-600':(stats.percentage||0)>=75?'text-yellow-600':'text-red-500',
                  bg: 'bg-gray-50'
                },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-xl border border-gray-100/50 p-4 text-center transition-transform hover:-translate-y-1`}>
                  <p className="text-xs font-semibold text-gray-500 mb-1">{s.label}</p>
                  <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
                </div>
              ))}
            </div>
          )}

          {/* Infographic Donut Chart */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
            <h3 className="text-sm font-bold text-gray-700 w-full text-left mb-2">Attendance Breakdown</h3>
            {loading ? (
              <LoadingSpinner />
            ) : chartData.length > 0 ? (
              <div className="w-full h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${value} Days`, 'Count']}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 500 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400 h-[250px]">
                <svg className="w-12 h-12 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-sm font-medium">No data for this month</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Calendar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm h-fit">
          <h3 className="text-sm font-bold text-gray-700 mb-5">{MONTHS[month-1]} {year} Calendar</h3>
          {loading ? <div className="h-64 flex items-center justify-center"><LoadingSpinner /></div> : (
            <>
              <div className="grid grid-cols-7 gap-2 mb-2">
                {dayLabels.map((d,i) => (
                  <div key={i} className="text-[11px] font-bold text-gray-400 text-center py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({length: firstDay}).map((_,i) => <div key={`e${i}`}/>)}
                {Array.from({length: daysInMonth},(_,i)=>i+1).map(day => {
                  const status = recordMap[day];
                  const isToday = day === now.getDate() && month === now.getMonth()+1;
                  return (
                    <div key={day}
                      className={`aspect-square flex flex-col items-center justify-center rounded-xl text-[12px] font-bold transition-all hover:scale-105
                        ${status ? statusBg[status] : 'bg-gray-50/50 text-gray-400'}
                        ${isToday ? 'ring-2 ring-blue-500 ring-offset-2 shadow-sm' : ''}`}>
                      <span>{day}</span>
                      {status && <span className="text-[9px] mt-0.5 uppercase tracking-wider font-extrabold opacity-70">{status[0]}</span>}
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap gap-4 justify-center">
                {[['present','Present'],['absent','Absent'],['half_day','Half Day'],['leave','Leave'],['holiday','Holiday']].map(([s,l])=>(
                  <span key={s} className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                    <span className={`w-3 h-3 rounded-md ${statusBg[s].split(' ')[0]}`}/>
                    {l}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
        
      </div>
    </div>
  );
}