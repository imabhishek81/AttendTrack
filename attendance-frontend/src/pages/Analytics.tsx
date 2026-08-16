import { useMemo, useState, useEffect } from 'react';
import { useAppContext } from '../App';
import { mockSubjects } from '../data/mockData';
import { calculatePercentage, getStatus } from '../utils/attendance';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
  Area, AreaChart
} from 'recharts';
import { BarChart3, TrendingUp, PieChart as PieChartIcon, Calendar } from 'lucide-react';
import { api, ApiSubjectStats } from '../api/apiClient';

const CHART_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#06b6d4'];

export default function Analytics() {
  const { attendanceRecords, requiredAttendance, refreshTrigger } = useAppContext();
  const [liveSubjects, setLiveSubjects] = useState<ApiSubjectStats[] | null>(null);

  useEffect(() => {
    let isMounted = true;
    api.getSubjects(1, requiredAttendance)
      .then(data => {
        if (isMounted) setLiveSubjects(data);
      })
      .catch(err => console.warn('Could not fetch subjects for analytics from backend:', err));
    return () => { isMounted = false; };
  }, [requiredAttendance, refreshTrigger]);

  // Subject-wise data for bar chart
  const subjectData = useMemo(() => {
    if (liveSubjects && liveSubjects.length > 0) {
      return liveSubjects.map(s => ({
        name: s.subject.code,
        percentage: Math.round(s.percentage * 10) / 10,
        present: s.present,
        absent: s.absent,
        total: s.total,
        fill: s.subject.color,
      }));
    }

    return mockSubjects.map(subject => {
      const records = attendanceRecords.filter(r => r.subjectId === subject.id);
      const present = records.filter(r => r.status === 'PRESENT').length;
      const total = records.length;
      const percentage = calculatePercentage(present, total);
      return {
        name: subject.code,
        percentage: Math.round(percentage * 10) / 10,
        present,
        absent: total - present,
        total,
        fill: subject.color,
      };
    });
  }, [liveSubjects, attendanceRecords]);

  // Monthly trend data
  const monthlyData = useMemo(() => {
    const months: Record<string, { present: number; total: number }> = {};
    
    attendanceRecords.forEach(record => {
      const monthKey = record.date.substring(0, 7); // "2026-06"
      if (!months[monthKey]) months[monthKey] = { present: 0, total: 0 };
      months[monthKey].total++;
      if (record.status === 'PRESENT') months[monthKey].present++;
    });

    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, data]) => {
        const date = new Date(key + '-01');
        return {
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          percentage: Math.round(calculatePercentage(data.present, data.total) * 10) / 10,
          present: data.present,
          total: data.total,
        };
      });
  }, [attendanceRecords]);

  // Overall pie chart data
  const pieData = useMemo(() => {
    const present = attendanceRecords.filter(r => r.status === 'PRESENT').length;
    const absent = attendanceRecords.filter(r => r.status === 'ABSENT').length;
    return [
      { name: 'Present', value: present, color: '#10b981' },
      { name: 'Absent', value: absent, color: '#ef4444' },
    ];
  }, [attendanceRecords]);

  // Overall stats
  const overallPercentage = useMemo(() => {
    const present = attendanceRecords.filter(r => r.status === 'PRESENT').length;
    return calculatePercentage(present, attendanceRecords.length);
  }, [attendanceRecords]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-surface-900/95 backdrop-blur-xl border border-surface-700/50 rounded-xl p-3 shadow-xl">
        <p className="text-sm font-medium text-white mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs text-surface-400">
            {entry.name}: <span className="text-white font-medium">{entry.value}%</span>
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="page-container">
      <h1 className="text-2xl font-bold text-white mb-6">Analytics</h1>

      {/* ─── Monthly Trend ─────────────── */}
      <div className="glass-card p-6 mb-6 animate-slide-up">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-semibold text-white">Monthly Trend</h2>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorPct" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
              <XAxis 
                dataKey="month" 
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(148,163,184,0.2)' }}
              />
              <YAxis 
                domain={[0, 100]} 
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(148,163,184,0.2)' }}
              />
              <Tooltip content={<CustomTooltip />} />
              {/* Required line */}
              <CartesianGrid y={requiredAttendance} strokeDasharray="5 5" />
              <Area 
                type="monotone" 
                dataKey="percentage" 
                stroke="#6366f1" 
                strokeWidth={3}
                fill="url(#colorPct)"
                dot={{ fill: '#6366f1', strokeWidth: 2, r: 5 }}
                name="Attendance"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* ─── Subject Comparison ─────── */}
        <div className="glass-card p-6 animate-slide-up stagger-1">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">Subject Comparison</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectData} layout="vertical" barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                <XAxis 
                  type="number" 
                  domain={[0, 100]}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(148,163,184,0.2)' }}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fill: '#e2e8f0', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(148,163,184,0.2)' }}
                  width={50}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="percentage" radius={[0, 6, 6, 0]} name="Attendance">
                  {subjectData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ─── Attendance Breakdown ────── */}
        <div className="glass-card p-6 animate-slide-up stagger-2">
          <div className="flex items-center gap-2 mb-5">
            <PieChartIcon className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">Attendance Breakdown</h2>
          </div>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any, name: any) => [`${value} classes`, name]}
                  contentStyle={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(100, 116, 139, 0.3)',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex justify-center gap-6 mt-2">
            {pieData.map(item => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-surface-400">
                  {item.name}: {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── What-If Projection Simulator ─── */}
      <div className="glass-card gradient-border p-6 mb-6 animate-slide-up">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Interactive Attendance Simulator</h2>
              <p className="text-xs text-surface-400">Project your future percentage before taking leave</p>
            </div>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-surface-800 text-indigo-300 border border-indigo-500/20">
            Target: {requiredAttendance}%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Attend Scenario */}
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>📈</span> If you attend upcoming classes:
            </h3>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[1, 3, 5, 10].map(n => {
                const totalP = (liveSubjects ? liveSubjects.reduce((s, x) => s + x.present, 0) : 0) || attendanceRecords.filter(r => r.status === 'PRESENT').length;
                const totalC = (liveSubjects ? liveSubjects.reduce((s, x) => s + x.total, 0) : 0) || attendanceRecords.length;
                const projected = totalC + n > 0 ? ((totalP + n) / (totalC + n)) * 100 : 0;
                return (
                  <div key={n} className="p-2.5 rounded-lg bg-surface-900/60 border border-emerald-500/10">
                    <span className="text-[10px] text-surface-400 block font-medium">+{n} classes</span>
                    <span className="text-sm font-bold text-emerald-300">{projected.toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Miss Scenario */}
          <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
            <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>📉</span> If you miss upcoming classes:
            </h3>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[1, 2, 3, 5].map(n => {
                const totalP = (liveSubjects ? liveSubjects.reduce((s, x) => s + x.present, 0) : 0) || attendanceRecords.filter(r => r.status === 'PRESENT').length;
                const totalC = (liveSubjects ? liveSubjects.reduce((s, x) => s + x.total, 0) : 0) || attendanceRecords.length;
                const projected = totalC + n > 0 ? (totalP / (totalC + n)) * 100 : 0;
                const isSafe = projected >= requiredAttendance;
                return (
                  <div key={n} className="p-2.5 rounded-lg bg-surface-900/60 border border-rose-500/10">
                    <span className="text-[10px] text-surface-400 block font-medium">Miss {n}</span>
                    <span className={`text-sm font-bold ${isSafe ? 'text-amber-300' : 'text-rose-400'}`}>
                      {projected.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Monthly Breakdown Table ──── */}
      <div className="glass-card p-6 animate-slide-up stagger-3">
        <div className="flex items-center gap-2 mb-5">
          <Calendar className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-semibold text-white">Monthly Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-700/50">
                <th className="text-left py-3 px-4 text-sm font-medium text-surface-400">Month</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-surface-400">Present</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-surface-400">Total</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-surface-400">Percentage</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-surface-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((month, index) => {
                const status = getStatus(month.percentage, requiredAttendance);
                return (
                  <tr 
                    key={month.month} 
                    className={`border-b border-surface-800/50 ${index % 2 === 0 ? 'bg-surface-800/10' : ''}`}
                  >
                    <td className="py-3 px-4 text-sm font-medium text-white">{month.month}</td>
                    <td className="py-3 px-4 text-sm text-emerald-400 text-right">{month.present}</td>
                    <td className="py-3 px-4 text-sm text-surface-400 text-right">{month.total}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-white text-right">{month.percentage}%</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`text-xs ${
                        status === 'SAFE' ? 'text-emerald-400' :
                        status === 'WARNING' ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {status === 'SAFE' ? '🟢' : status === 'WARNING' ? '🟡' : '🔴'} {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
