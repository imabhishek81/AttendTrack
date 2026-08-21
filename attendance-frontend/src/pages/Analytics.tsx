import { useMemo, useState, useEffect } from 'react';
import { useAppContext } from '../App';
import { getDemoSubjectSummaries } from '../data/mockData';
import { calculatePercentage, getStatus } from '../utils/attendance';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, CartesianGrid, Area, AreaChart
} from 'recharts';
import { BarChart3, TrendingUp, PieChart as PieChartIcon, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { api, ApiSubjectStats, ApiAttendanceRecord } from '../api/apiClient';

export default function Analytics() {
  const { requiredAttendance, refreshTrigger, attendanceRecords, isDemoMode } = useAppContext();
  const [liveSubjects, setLiveSubjects] = useState<ApiSubjectStats[] | null>(null);
  const [liveCalendarRecords, setLiveCalendarRecords] = useState<ApiAttendanceRecord[] | null>(null);

  useEffect(() => {
    let isMounted = true;
    const now = new Date();
    const startDate = `${now.getFullYear()}-01-01`;
    const endDate = `${now.getFullYear()}-12-31`;

    if (isDemoMode) {
      setLiveCalendarRecords(null);
      setLiveSubjects(null);
      return () => { isMounted = false; };
    }

    api.getCalendar(1, startDate, endDate)
      .then(data => {
        if (isMounted) setLiveCalendarRecords(data);
      })
      .catch(err => console.warn('Could not fetch calendar for analytics:', err));

    api.getSubjects(1, requiredAttendance)
      .then(data => {
        if (isMounted) setLiveSubjects(data);
      })
      .catch(err => console.warn('Could not fetch subjects for analytics from backend:', err));
    return () => { isMounted = false; };
  }, [requiredAttendance, refreshTrigger, isDemoMode]);

  // Subject-wise data for bar chart
  const subjectData = useMemo(() => {
    if (liveSubjects) {
      return liveSubjects.map(s => ({
        name: s.subject.code,
        percentage: Math.round(s.percentage * 10) / 10,
        present: s.present,
        absent: s.absent,
        total: s.total,
        fill: s.subject.color,
      }));
    }
    return getDemoSubjectSummaries(attendanceRecords, requiredAttendance).map(s => ({
      name: s.subject.code,
      percentage: Math.round(s.percentage * 10) / 10,
      present: s.present,
      absent: s.absent,
      total: s.total,
      fill: s.subject.color,
    }));
  }, [liveSubjects, attendanceRecords, requiredAttendance]);

  // Monthly trend data
  const monthlyData = useMemo(() => {
    const records = liveCalendarRecords
      ? liveCalendarRecords.map(r => ({ date: r.date, status: r.status }))
      : attendanceRecords;
    const months: Record<string, { present: number; total: number }> = {};
    
    records.forEach(record => {
      const monthKey = record.date.substring(0, 7);
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
  }, [liveCalendarRecords, attendanceRecords]);

  // Overall pie chart data
  const pieData = useMemo(() => {
    const summaries = liveSubjects
      ? liveSubjects
      : getDemoSubjectSummaries(attendanceRecords, requiredAttendance);
    const present = summaries.reduce((sum, s) => sum + s.present, 0);
    const absent = summaries.reduce((sum, s) => sum + s.absent, 0);
    return [
      { name: 'Present', value: present, color: '#10b981' },
      { name: 'Absent', value: absent, color: '#f43f5e' },
    ];
  }, [liveSubjects, attendanceRecords, requiredAttendance]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-[#0c0f18]/95 backdrop-blur-xl border border-white/[0.08] rounded-xl p-3 shadow-2xl">
        <p className="text-xs font-bold text-white mb-1 font-mono">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs text-surface-300">
            {entry.name}: <span className="text-white font-bold font-mono">{entry.value}%</span>
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="page-container">
      {/* ─── Header ────────────────────── */}
      <div className="mb-7 animate-slide-up">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Analytics</h1>
        <p className="text-xs sm:text-sm text-surface-400 mt-0.5">Trends, comparative distribution, and what-if simulation engine</p>
      </div>

      {/* ─── Monthly Trend Area Chart ───── */}
      <div className="glass-card gradient-border p-6 sm:p-7 mb-7 animate-slide-up relative overflow-hidden">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/[0.08] border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Monthly Attendance Trend</h2>
              <p className="text-xs text-surface-400">Overall percentage progression across months</p>
            </div>
          </div>
          <span className="text-xs font-mono font-medium px-3 py-1 rounded-full bg-white/[0.03] text-indigo-300 border border-white/[0.06]">
            Target: {requiredAttendance}%
          </span>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorPct" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis 
                dataKey="month" 
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
              />
              <YAxis 
                domain={[0, 100]} 
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="percentage" 
                stroke="#6366f1" 
                strokeWidth={3}
                fill="url(#colorPct)"
                dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#818cf8', stroke: '#fff', strokeWidth: 2 }}
                name="Attendance"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-7">
        {/* ─── Subject Comparison Bar Chart ─ */}
        <div className="glass-card p-6 animate-slide-up stagger-1">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/[0.08] border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Subject Comparison</h2>
              <p className="text-xs text-surface-400">Percentage per enrolled subject</p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectData} layout="vertical" barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis 
                  type="number" 
                  domain={[0, 100]}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fill: '#cbd5e1', fontSize: 11, fontWeight: 600 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                  width={45}
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

        {/* ─── Attendance Breakdown Donut ─── */}
        <div className="glass-card p-6 animate-slide-up stagger-2">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/[0.08] border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <PieChartIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Attendance Ratio</h2>
              <p className="text-xs text-surface-400">Total present vs absent count</p>
            </div>
          </div>

          <div className="h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={88}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any, name: any) => [`${value} classes`, name]}
                  contentStyle={{
                    background: 'rgba(12, 15, 24, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-6 mt-2 pt-2 border-t border-white/[0.04]">
            {pieData.map(item => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-surface-300 font-medium">
                  {item.name}: <strong className="text-white font-mono">{item.value}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── What-If Projection Simulator ─── */}
      <div className="glass-card gradient-border p-6 sm:p-7 mb-7 animate-slide-up">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/[0.08] border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Interactive Attendance Simulator</h2>
              <p className="text-xs text-surface-400">Project your future percentage before taking upcoming leave</p>
            </div>
          </div>
          <span className="text-xs font-mono font-medium px-3 py-1 rounded-full bg-white/[0.03] text-indigo-300 border border-white/[0.06]">
            Target: {requiredAttendance}%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Attend Scenario */}
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/20">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5 font-mono">
              <span>📈</span> Attend Upcoming Classes
            </h3>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[1, 3, 5, 10].map(n => {
                const totalP = pieData.find(p => p.name === 'Present')?.value ?? 0;
                const totalC = pieData.reduce((s, x) => s + x.value, 0);
                const projected = totalC + n > 0 ? ((totalP + n) / (totalC + n)) * 100 : 0;
                return (
                  <div key={n} className="p-2.5 rounded-xl bg-white/[0.03] border border-emerald-500/15">
                    <span className="text-[10px] text-surface-400 block font-medium">+{n} classes</span>
                    <span className="text-sm font-bold text-emerald-300 font-mono mt-0.5 block">{projected.toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Miss Scenario */}
          <div className="p-4 sm:p-5 rounded-2xl bg-rose-500/[0.04] border border-rose-500/20">
            <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-1.5 font-mono">
              <span>📉</span> Miss Upcoming Classes
            </h3>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[1, 2, 3, 5].map(n => {
                const totalP = pieData.find(p => p.name === 'Present')?.value ?? 0;
                const totalC = pieData.reduce((s, x) => s + x.value, 0);
                const projected = totalC + n > 0 ? (totalP / (totalC + n)) * 100 : 0;
                const isSafe = projected >= requiredAttendance;
                return (
                  <div key={n} className="p-2.5 rounded-xl bg-white/[0.03] border border-rose-500/15">
                    <span className="text-[10px] text-surface-400 block font-medium">Miss {n}</span>
                    <span className={`text-sm font-bold font-mono mt-0.5 block ${isSafe ? 'text-amber-300' : 'text-rose-400'}`}>
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
      <div className="glass-card p-6 sm:p-7 animate-slide-up stagger-3">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/[0.08] border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Monthly Breakdown Summary</h2>
            <p className="text-xs text-surface-400">Tabular ledger of monthly classes</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left py-3 px-4 text-xs font-bold text-surface-400 uppercase tracking-wider font-mono">Month</th>
                <th className="text-right py-3 px-4 text-xs font-bold text-surface-400 uppercase tracking-wider font-mono">Present</th>
                <th className="text-right py-3 px-4 text-xs font-bold text-surface-400 uppercase tracking-wider font-mono">Total</th>
                <th className="text-right py-3 px-4 text-xs font-bold text-surface-400 uppercase tracking-wider font-mono">Percentage</th>
                <th className="text-right py-3 px-4 text-xs font-bold text-surface-400 uppercase tracking-wider font-mono">Status</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((month, index) => {
                const status = getStatus(month.percentage, requiredAttendance);
                return (
                  <tr 
                    key={month.month} 
                    className={`border-b border-white/[0.03] transition-colors hover:bg-white/[0.02] ${index % 2 === 0 ? 'bg-white/[0.01]' : ''}`}
                  >
                    <td className="py-3 px-4 text-sm font-semibold text-white">{month.month}</td>
                    <td className="py-3 px-4 text-sm text-emerald-400 text-right font-mono font-bold">{month.present}</td>
                    <td className="py-3 px-4 text-sm text-surface-400 text-right font-mono">{month.total}</td>
                    <td className="py-3 px-4 text-sm font-bold text-white text-right font-mono">{month.percentage}%</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                        status === 'SAFE' ? 'bg-emerald-500/[0.08] text-emerald-400 border border-emerald-500/20' :
                        status === 'WARNING' ? 'bg-amber-500/[0.08] text-amber-400 border border-amber-500/20' : 'bg-rose-500/[0.08] text-rose-400 border border-rose-500/20'
                      }`}>
                        <span>{status === 'SAFE' ? '●' : status === 'WARNING' ? '▲' : '■'}</span> {status}
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
