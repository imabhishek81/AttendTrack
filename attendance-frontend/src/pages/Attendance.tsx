import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../App';
import { mockSubjects } from '../data/mockData';
import { calculatePercentage, getStatus, canMiss, requiredToReach } from '../utils/attendance';
import StatusBadge from '../components/StatusBadge';
import CircularProgress from '../components/CircularProgress';
import { ChevronRight, TrendingUp, TrendingDown, Minus, ArrowUpRight } from 'lucide-react';
import { api, ApiSubjectStats } from '../api/apiClient';

export default function AttendancePage() {
  const { attendanceRecords, requiredAttendance, refreshTrigger } = useAppContext();
  const navigate = useNavigate();
  const [liveSubjects, setLiveSubjects] = useState<ApiSubjectStats[] | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const data = await api.getSubjects(1, requiredAttendance);
        if (isMounted) setLiveSubjects(data);
      } catch (err) {
        console.warn('Could not fetch subjects from backend, using local context:', err);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [requiredAttendance, refreshTrigger]);

  const subjectStats = useMemo(() => {
    if (liveSubjects && liveSubjects.length > 0) {
      return liveSubjects.map(s => ({
        subject: {
          id: String(s.subject.id),
          semesterId: '1',
          name: s.subject.name,
          code: s.subject.code,
          teacher: s.subject.teacher,
          color: s.subject.color,
        },
        present: s.present,
        absent: s.absent,
        total: s.total,
        percentage: s.percentage,
        status: s.status,
        missable: s.canMiss,
        needed: s.requiredToReach,
      })).sort((a, b) => a.percentage - b.percentage);
    }

    return mockSubjects.map(subject => {
      const records = attendanceRecords.filter(r => r.subjectId === subject.id);
      const present = records.filter(r => r.status === 'PRESENT').length;
      const absent = records.filter(r => r.status === 'ABSENT').length;
      const total = records.length;
      const percentage = calculatePercentage(present, total);
      const status = getStatus(percentage, requiredAttendance);
      const missable = canMiss(present, total, requiredAttendance);
      const needed = requiredToReach(present, total, requiredAttendance);
      return { subject, present, absent, total, percentage, status, missable, needed };
    }).sort((a, b) => a.percentage - b.percentage);
  }, [liveSubjects, attendanceRecords, requiredAttendance]);

  const overallStats = useMemo(() => {
    const totalPresent = subjectStats.reduce((sum, s) => sum + s.present, 0);
    const totalClasses = subjectStats.reduce((sum, s) => sum + s.total, 0);
    const percentage = calculatePercentage(totalPresent, totalClasses);
    const status = getStatus(percentage, requiredAttendance);
    return { totalPresent, totalClasses, percentage, status };
  }, [subjectStats, requiredAttendance]);

  return (
    <div className="page-container">
      <h1 className="text-2xl font-bold text-white mb-6">Attendance</h1>

      {/* ─── Overall Card ──────────────── */}
      <div className="glass-card gradient-border p-6 mb-8 animate-slide-up">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <CircularProgress
            percentage={overallStats.percentage}
            status={overallStats.status}
            size={130}
            strokeWidth={8}
          />
          <div className="text-center sm:text-left flex-1">
            <h2 className="text-lg font-semibold text-white mb-2">Overall Attendance</h2>
            <div className="flex items-center gap-3 justify-center sm:justify-start mb-3">
              <StatusBadge status={overallStats.status} />
              <span className="text-sm text-surface-500">
                Required: {requiredAttendance}%
              </span>
            </div>
            <p className="text-sm text-surface-500">
              <span className="text-emerald-400 font-medium">{overallStats.totalPresent}</span> present out of <span className="text-white font-medium">{overallStats.totalClasses}</span> classes
            </p>
          </div>
        </div>
      </div>

      {/* ─── Subject Cards ─────────────── */}
      <div className="space-y-3">
        {subjectStats.map(({ subject, present, absent, total, percentage, status, missable, needed }, index) => (
          <div
            key={subject.id}
            className="glass-card-hover p-5 cursor-pointer animate-slide-up relative overflow-hidden group"
            style={{ animationDelay: `${index * 0.05}s` }}
            onClick={() => navigate(`/subject/${subject.id}`)}
          >
            {/* Left color accent */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl transition-all duration-300 group-hover:w-1.5"
              style={{ backgroundColor: subject.color }}
            />

            {/* Hover tint */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: `radial-gradient(ellipse at 0% 50%, ${subject.color}06, transparent 60%)` }}
            />

            <div className="relative pl-3">
              {/* Header row */}
              <div className="flex items-start sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-transform duration-300 group-hover:scale-105"
                    style={{ backgroundColor: subject.color + '15', color: subject.color }}
                  >
                    {subject.code.slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      {subject.code}
                      <ArrowUpRight className="w-3.5 h-3.5 text-surface-700 group-hover:text-surface-400 transition-colors" />
                    </h3>
                    <p className="text-sm text-surface-500">{subject.name}</p>
                  </div>
                </div>
                <StatusBadge status={status} size="sm" />
              </div>

              {/* Stats row */}
              <div className="flex items-end gap-6 mb-3">
                <div>
                  <span className="text-3xl font-bold text-white">{percentage.toFixed(1)}</span>
                  <span className="text-sm text-surface-500 ml-0.5">%</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-surface-500 pb-1">
                  <span><span className="text-emerald-400 font-medium">{present}</span> present</span>
                  <span className="text-surface-700">•</span>
                  <span><span className="text-red-400 font-medium">{absent}</span> absent</span>
                  <span className="text-surface-700">•</span>
                  <span>{total} total</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="progress-bar-container h-2 mb-3">
                <div
                  className={`progress-bar-fill h-2 ${
                    percentage >= requiredAttendance + 5 ? 'bg-emerald-500' :
                    percentage >= requiredAttendance ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ '--progress-width': `${Math.min(percentage, 100)}%` } as React.CSSProperties}
                />
              </div>

              {/* Can miss / Need to attend */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {missable > 0 ? (
                    <>
                      <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs text-emerald-400 font-medium">
                        Can safely miss {missable} lecture{missable > 1 ? 's' : ''}
                      </span>
                    </>
                  ) : percentage >= requiredAttendance ? (
                    <>
                      <Minus className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-xs text-amber-400 font-medium">Cannot miss any more</span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-3.5 h-3.5 text-red-400" />
                      <span className="text-xs text-red-400 font-medium">
                        Need {needed} more lecture{needed > 1 ? 's' : ''} to recover
                      </span>
                    </>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-surface-700 group-hover:text-surface-500 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
