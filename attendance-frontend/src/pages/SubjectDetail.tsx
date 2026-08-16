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
  TrendingDown, TrendingUp, Calendar 
} from 'lucide-react';
import { api, ApiSubjectDetail } from '../api/apiClient';

export default function SubjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { attendanceRecords, requiredAttendance, refreshTrigger } = useAppContext();

  const [liveDetail, setLiveDetail] = useState<ApiSubjectDetail | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (id) {
      api.getSubjectDetail(Number(id), requiredAttendance)
        .then(data => {
          if (isMounted) setLiveDetail(data);
        })
        .catch(err => console.warn('Could not fetch subject detail from backend:', err));
    }
    return () => { isMounted = false; };
  }, [id, requiredAttendance, refreshTrigger]);

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
      .sort((a, b) => b.date.localeCompare(a.date)); // newest first

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
        <p className="text-surface-400">Subject not found</p>
        <button onClick={() => navigate(-1)} className="btn-outline mt-4">Go Back</button>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* ─── Header ────────────────────── */}
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 text-surface-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-medium">Back</span>
      </button>

      <div className="flex items-center gap-4 mb-8 animate-fade-in">
        <div 
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg"
          style={{ backgroundColor: subject.color + '20', color: subject.color }}
        >
          {subject.code.slice(0, 2)}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{subject.code}</h1>
          <p className="text-surface-400">{subject.name}</p>
          <p className="text-xs text-surface-500 mt-0.5">{subject.teacher}</p>
        </div>
      </div>

      {/* ─── Stats Grid ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        {/* Attendance Overview */}
        <div className="glass-card gradient-border p-6 animate-slide-up">
          <div className="flex flex-col items-center">
            <CircularProgress 
              percentage={stats.percentage} 
              status={stats.status}
              size={140}
            />
            <div className="mt-4 flex items-center gap-3">
              <StatusBadge status={stats.status} size="lg" />
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 w-full">
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-400">{stats.present}</p>
                <p className="text-xs text-surface-500">Present</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-400">{stats.absent}</p>
                <p className="text-xs text-surface-500">Absent</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-xs text-surface-500">Total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Can I Miss? / Need to Attend */}
        <div className="glass-card p-6 animate-slide-up stagger-1">
          {stats.percentage >= requiredAttendance ? (
            // ─── Can Miss Section ───
            <>
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-semibold text-white">Can I Miss?</h3>
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 mb-5">
                <p className="text-3xl font-bold text-emerald-400 mb-1">
                  {stats.missable} lecture{stats.missable !== 1 ? 's' : ''}
                </p>
                <p className="text-sm text-surface-400">
                  You can miss while staying above {requiredAttendance}%
                </p>
              </div>

              {/* Projection table */}
              <h4 className="text-sm font-medium text-surface-300 mb-3">What happens if you miss:</h4>
              <div className="space-y-2">
                {stats.projections.map(proj => (
                  <div 
                    key={proj.count}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                      proj.safe ? 'bg-surface-800/30' : 'bg-red-500/5 border border-red-500/10'
                    }`}
                  >
                    <span className="text-sm text-surface-400">
                      After missing {proj.count} {proj.count === 1 ? 'lecture' : 'lectures'}:
                    </span>
                    <span className={`text-sm font-semibold ${
                      proj.safe ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {proj.percentage.toFixed(1)}% {proj.safe ? '🟢' : '🔴'}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            // ─── Attendance Shortage Section ───
            <>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h3 className="text-lg font-semibold text-white">Attendance Shortage</h3>
              </div>

              <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-red-400" />
                  <p className="text-sm text-red-400 font-medium">
                    Below required {requiredAttendance}%
                  </p>
                </div>
                <p className="text-3xl font-bold text-white mb-1">
                  Attend next {stats.needed} lecture{stats.needed !== 1 ? 's' : ''}
                </p>
                <p className="text-sm text-surface-400">
                  to reach {requiredAttendance}%
                </p>
              </div>

              {/* Recovery projection */}
              <h4 className="text-sm font-medium text-surface-300 mb-3">Recovery projection:</h4>
              <div className="space-y-2">
                {Array.from({ length: Math.min(stats.needed + 2, 8) }, (_, i) => i + 1).map(attend => {
                  const projPct = calculatePercentage(stats.present + attend, stats.total + attend);
                  const atTarget = projPct >= requiredAttendance;
                  return (
                    <div 
                      key={attend}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                        atTarget ? 'bg-emerald-500/5 border border-emerald-500/10' : 'bg-surface-800/30'
                      }`}
                    >
                      <span className="text-sm text-surface-400">
                        After attending {attend}:
                      </span>
                      <span className={`text-sm font-semibold ${
                        atTarget ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {projPct.toFixed(1)}% {atTarget ? '✅' : '⏳'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── Attendance History ─────────── */}
      <div className="glass-card p-6 animate-slide-up stagger-2">
        <div className="flex items-center gap-2 mb-5">
          <Calendar className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-semibold text-white">Attendance History</h3>
        </div>

        <div className="space-y-1 max-h-96 overflow-y-auto pr-2">
          {stats.records.map((record, index) => (
            <div 
              key={record.id}
              className={`flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
                index % 2 === 0 ? 'bg-surface-800/20' : ''
              }`}
            >
              <span className="text-sm text-surface-300">{formatDateShort(record.date)}</span>
              <div className="flex items-center gap-2">
                {record.status === 'PRESENT' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-emerald-400 font-medium">Present</span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-red-400 font-medium">Absent</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
