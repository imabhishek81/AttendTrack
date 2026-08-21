import { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../App';
import { mockSubjects } from '../data/mockData';
import { 
  calculatePercentage, getStatus, canMiss, requiredToReach, 
  projectAfterMissing, formatDateShort 
} from '../utils/attendance';
import StatusBadge from '../components/StatusBadge';
import CircularProgress from '../components/CircularProgress';
import { 
  ArrowLeft, Check, X, AlertTriangle, 
  TrendingDown, TrendingUp, Calendar as CalendarIcon, Sparkles, BookOpen
} from 'lucide-react';
import { api, ApiSubjectDetail } from '../api/apiClient';

export default function SubjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { attendanceRecords, requiredAttendance, refreshTrigger, isDemoMode } = useAppContext();

  const [liveDetail, setLiveDetail] = useState<ApiSubjectDetail | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (isDemoMode) {
      setLiveDetail(null);
      return () => { isMounted = false; };
    }
    if (id) {
      api.getSubjectDetail(Number(id), requiredAttendance)
        .then(data => {
          if (isMounted) setLiveDetail(data);
        })
        .catch(err => console.warn('Could not fetch subject detail from backend:', err));
    }
    return () => { isMounted = false; };
  }, [id, requiredAttendance, refreshTrigger, isDemoMode]);

  const subject = useMemo(() => {
    if (liveDetail) {
      return {
        id: String(liveDetail.subject.id),
        semesterId: '1',
        name: liveDetail.subject.name,
        code: liveDetail.subject.code,
        teacher: liveDetail.subject.teacher,
        color: liveDetail.subject.color,
      };
    }
    return mockSubjects.find(s => s.id === id);
  }, [liveDetail, id]);

  const stats = useMemo(() => {
    if (liveDetail) {
      return {
        records: liveDetail.history.map(r => ({
          id: String(r.id),
          subjectId: String(r.subject.id),
          date: r.date,
          status: r.status,
        })),
        present: liveDetail.present,
        absent: liveDetail.absent,
        total: liveDetail.total,
        percentage: liveDetail.percentage,
        status: liveDetail.status,
        missable: liveDetail.canMiss,
        needed: liveDetail.requiredToReach,
        projections: liveDetail.projections,
      };
    }

    if (!subject) return null;

    const records = attendanceRecords
      .filter(r => r.subjectId === subject.id)
      .sort((a, b) => b.date.localeCompare(a.date));

    const present = records.filter(r => r.status === 'PRESENT').length;
    const absent = records.filter(r => r.status === 'ABSENT').length;
    const total = records.length;
    const percentage = calculatePercentage(present, total);
    const status = getStatus(percentage, requiredAttendance);
    const missable = canMiss(present, total, requiredAttendance);
    const needed = requiredToReach(present, total, requiredAttendance);
    const projections = projectAfterMissing(present, total, 6).map(p => ({
      ...p,
      safe: p.percentage >= requiredAttendance,
    }));

    return { records, present, absent, total, percentage, status, missable, needed, projections };
  }, [liveDetail, subject, attendanceRecords, requiredAttendance]);

  if (!subject || !stats) {
    return (
      <div className="page-container text-center py-20">
        <div className="w-14 h-14 mx-auto mb-3.5 rounded-2xl bg-indigo-500/[0.08] border border-indigo-500/15 flex items-center justify-center text-indigo-400">
          <BookOpen className="w-6 h-6" />
        </div>
        <p className="text-white font-bold text-base mb-1">Subject not found</p>
        <p className="text-surface-400 text-xs mb-4">The requested subject ID is not available in your records.</p>
        <button onClick={() => navigate(-1)} className="btn-outline text-xs py-2 px-4">Go Back</button>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* ─── Back Navigation ───────────── */}
      <button 
        onClick={() => navigate(-1)} 
        className="inline-flex items-center gap-2 text-surface-400 hover:text-white transition-colors mb-6 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.06] active:scale-95"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Attendance</span>
      </button>

      {/* ─── Hero Subject Banner ───────── */}
      <div className="glass-card gradient-border p-6 sm:p-7 mb-7 animate-slide-up relative overflow-hidden">
        <div
          className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-20"
          style={{ backgroundColor: subject.color }}
        />

        <div className="flex items-center gap-4 relative">
          <div 
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center font-bold text-xl sm:text-2xl shadow-xl shrink-0 border"
            style={{ 
              backgroundColor: `${subject.color}20`, 
              color: subject.color,
              borderColor: `${subject.color}40`
            }}
          >
            {subject.code.slice(0, 3)}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{subject.code}</h1>
              <StatusBadge status={stats.status} size="sm" />
            </div>
            <p className="text-sm font-medium text-surface-300 mt-0.5">{subject.name}</p>
            <p className="text-xs text-surface-500 mt-0.5">{subject.teacher}</p>
          </div>
        </div>
      </div>

      {/* ─── Stats & Simulation Grid ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-7">
        {/* Attendance Overview Card */}
        <div className="glass-card p-6 sm:p-7 animate-slide-up flex flex-col items-center justify-center">
          <CircularProgress 
            percentage={stats.percentage} 
            status={stats.status}
            size={145}
            strokeWidth={9}
          />
          <div className="mt-5 flex items-center gap-3">
            <StatusBadge status={stats.status} size="lg" />
          </div>
          
          {/* Stats 3-Col Bar */}
          <div className="grid grid-cols-3 gap-4 mt-6 w-full pt-5 border-t border-white/[0.04]">
            <div className="text-center p-2.5 rounded-xl bg-white/[0.02]">
              <p className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono">{stats.present}</p>
              <p className="text-[11px] text-surface-500 font-medium uppercase tracking-wider mt-0.5">Present</p>
            </div>
            <div className="text-center p-2.5 rounded-xl bg-white/[0.02]">
              <p className="text-xl sm:text-2xl font-bold text-rose-400 font-mono">{stats.absent}</p>
              <p className="text-[11px] text-surface-500 font-medium uppercase tracking-wider mt-0.5">Absent</p>
            </div>
            <div className="text-center p-2.5 rounded-xl bg-white/[0.02]">
              <p className="text-xl sm:text-2xl font-bold text-white font-mono">{stats.total}</p>
              <p className="text-[11px] text-surface-500 font-medium uppercase tracking-wider mt-0.5">Total</p>
            </div>
          </div>
        </div>

        {/* Can I Miss / Shortage Projections */}
        <div className="glass-card p-6 sm:p-7 animate-slide-up stagger-1">
          {stats.percentage >= requiredAttendance ? (
            <>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/[0.08] border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Safe Miss Calculator</h3>
                  <p className="text-xs text-surface-400">Lectures you can afford to skip</p>
                </div>
              </div>

              <div className="bg-emerald-500/[0.06] border border-emerald-500/20 rounded-2xl p-4 sm:p-5 mb-5 shadow-[0_0_16px_rgba(16,185,129,0.06)]">
                <p className="text-2xl sm:text-3xl font-bold text-emerald-400 font-mono mb-0.5">
                  {stats.missable} {stats.missable === 1 ? 'lecture' : 'lectures'}
                </p>
                <p className="text-xs text-surface-300">
                  You can safely miss without dropping below your target <strong className="text-white">{requiredAttendance}%</strong>.
                </p>
              </div>

              {/* Projection Rows */}
              <h4 className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-2.5 font-mono">Projection If You Miss:</h4>
              <div className="space-y-1.5">
                {stats.projections.map(proj => (
                  <div 
                    key={proj.count}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all ${
                      proj.safe ? 'bg-white/[0.02] border-white/[0.04]' : 'bg-rose-500/[0.04] border-rose-500/20'
                    }`}
                  >
                    <span className="text-xs text-surface-300 font-medium">
                      After missing <strong className="text-white font-mono">{proj.count}</strong> {proj.count === 1 ? 'lecture' : 'lectures'}:
                    </span>
                    <span className={`text-xs font-bold font-mono ${
                      proj.safe ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {proj.percentage.toFixed(1)}% {proj.safe ? '✓' : '⚠'}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-rose-500/[0.08] border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Attendance Shortage Recovery</h3>
                  <p className="text-xs text-surface-400">Action plan to reach target</p>
                </div>
              </div>

              <div className="bg-rose-500/[0.06] border border-rose-500/20 rounded-2xl p-4 sm:p-5 mb-5 shadow-[0_0_16px_rgba(244,63,94,0.06)]">
                <div className="flex items-center gap-1.5 mb-1 text-rose-400 font-semibold text-xs">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Below required {requiredAttendance}% target</span>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-white font-mono mb-0.5">
                  Attend next {stats.needed} {stats.needed === 1 ? 'lecture' : 'lectures'}
                </p>
                <p className="text-xs text-surface-300">
                  Must be attended consecutively to achieve <strong className="text-white">{requiredAttendance}%</strong>.
                </p>
              </div>

              {/* Recovery Projections */}
              <h4 className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-2.5 font-mono">Recovery Trajectory:</h4>
              <div className="space-y-1.5">
                {Array.from({ length: Math.min(stats.needed + 2, 8) }, (_, i) => i + 1).map(attend => {
                  const projPct = calculatePercentage(stats.present + attend, stats.total + attend);
                  const atTarget = projPct >= requiredAttendance;
                  return (
                    <div 
                      key={attend}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all ${
                        atTarget ? 'bg-emerald-500/[0.06] border-emerald-500/20' : 'bg-white/[0.02] border-white/[0.04]'
                      }`}
                    >
                      <span className="text-xs text-surface-300 font-medium">
                        After attending <strong className="text-white font-mono">{attend}</strong> {attend === 1 ? 'lecture' : 'lectures'}:
                      </span>
                      <span className={`text-xs font-bold font-mono ${
                        atTarget ? 'text-emerald-400 font-bold' : 'text-amber-400'
                      }`}>
                        {projPct.toFixed(1)}% {atTarget ? '✓ Reached' : '…'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── Attendance History Ledger ──── */}
      <div className="glass-card p-6 sm:p-7 animate-slide-up stagger-2">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/[0.08] border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Attendance History Log</h3>
            <p className="text-xs text-surface-400">Chronological ledger of recorded lectures</p>
          </div>
        </div>

        {stats.records.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-surface-500 text-xs">No lecture records recorded yet for this subject.</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
            {stats.records.map((record, index) => (
              <div 
                key={record.id}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border border-white/[0.03] transition-colors ${
                  index % 2 === 0 ? 'bg-white/[0.02]' : 'bg-transparent'
                }`}
              >
                <span className="text-xs sm:text-sm text-surface-300 font-medium font-mono">{formatDateShort(record.date)}</span>
                <div className="flex items-center gap-2">
                  {record.status === 'PRESENT' ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/[0.08] border border-emerald-500/20 text-emerald-400 text-xs font-bold font-mono">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Present</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/[0.08] border border-rose-500/20 text-rose-400 text-xs font-bold font-mono">
                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Absent</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
