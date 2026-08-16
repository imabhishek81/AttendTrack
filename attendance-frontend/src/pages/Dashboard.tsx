import { useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../App';
import { mockSubjects, mockTimetable } from '../data/mockData';
import {
  calculatePercentage, getStatus, getGreeting,
  formatDate, getTodayISO, canMiss
} from '../utils/attendance';
import CircularProgress from '../components/CircularProgress';
import StatusBadge from '../components/StatusBadge';
import { 
  MapPin, Clock, AlertTriangle, TrendingUp, BookOpen, ChevronRight, 
  Sparkles, Zap, Database, Lock, Unlock, ShieldCheck, CheckCircle2 
} from 'lucide-react';
import type { DayOfWeek } from '../types';
import { api, ApiDashboardData } from '../api/apiClient';

// Animated counter hook
function useAnimatedNumber(target: number, duration = 1000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(target * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

export default function Dashboard() {
  const { user, attendanceRecords, markAttendance, requiredAttendance, refreshTrigger, backendConnected } = useAppContext();
  const navigate = useNavigate();
  const today = getTodayISO();
  const todayDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }) as DayOfWeek;
  const [liveData, setLiveData] = useState<ApiDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    return localStorage.getItem(`attendtrack_locked_${today}`) === 'true';
  });
  const [isLocking, setIsLocking] = useState(false);
  const [lockSuccessMessage, setLockSuccessMessage] = useState(false);

  // Lock and submit all today's attendance to DB
  const handleLockAttendance = async () => {
    setIsLocking(true);
    try {
      // Commit all marked classes to backend API
      for (const item of todaysClasses) {
        if (item.record?.status) {
          await api.markAttendance(Number(item.subject.id), today, item.record.status);
        }
      }
      setIsLocked(true);
      localStorage.setItem(`attendtrack_locked_${today}`, 'true');
      setLockSuccessMessage(true);
      setTimeout(() => setLockSuccessMessage(false), 4000);
    } catch (err) {
      console.error('Failed to lock attendance:', err);
    } finally {
      setIsLocking(false);
    }
  };

  const handleUnlockAttendance = () => {
    setIsLocked(false);
    localStorage.removeItem(`attendtrack_locked_${today}`);
  };

  // Fetch live dashboard data from Spring Boot REST API
  useEffect(() => {
    let isMounted = true;
    async function loadDashboard() {
      try {
        const data = await api.getDashboard(1);
        if (isMounted) {
          setLiveData(data);
          setLoading(false);
        }
      } catch (err) {
        console.warn('Could not fetch dashboard from backend, using local context:', err);
        if (isMounted) setLoading(false);
      }
    }
    loadDashboard();
    return () => { isMounted = false; };
  }, [refreshTrigger, requiredAttendance]);

  // Compute stats (using live data if available, fallback to mock)
  const overallStats = useMemo(() => {
    if (liveData) {
      return {
        percentage: liveData.overallPercentage,
        status: liveData.overallStatus,
        totalPresent: liveData.totalPresent,
        totalClasses: liveData.totalClasses,
        subjectsAtRisk: liveData.subjectsAtRisk,
      };
    }

    let totalPresent = 0;
    let totalClasses = 0;
    let subjectsAtRisk = 0;

    mockSubjects.forEach(subject => {
      const records = attendanceRecords.filter(r => r.subjectId === subject.id);
      const present = records.filter(r => r.status === 'PRESENT').length;
      const total = records.length;
      totalPresent += present;
      totalClasses += total;
      if (total > 0 && calculatePercentage(present, total) < requiredAttendance) subjectsAtRisk++;
    });

    const percentage = calculatePercentage(totalPresent, totalClasses);
    const status = getStatus(percentage, requiredAttendance);
    return { percentage, status, totalPresent, totalClasses, subjectsAtRisk };
  }, [liveData, attendanceRecords, requiredAttendance]);

  const subjectStats = useMemo(() => {
    if (liveData && liveData.subjectSummaries.length > 0) {
      return liveData.subjectSummaries.map(s => ({
        subject: {
          id: String(s.subject.id),
          semesterId: '1',
          name: s.subject.name,
          code: s.subject.code,
          teacher: s.subject.teacher,
          color: s.subject.color,
        },
        present: s.present,
        total: s.total,
        percentage: s.percentage,
        status: s.status,
        missable: s.canMiss,
      }));
    }

    return mockSubjects.map(subject => {
      const records = attendanceRecords.filter(r => r.subjectId === subject.id);
      const present = records.filter(r => r.status === 'PRESENT').length;
      const total = records.length;
      const percentage = calculatePercentage(present, total);
      const status = getStatus(percentage, requiredAttendance);
      const missable = canMiss(present, total, requiredAttendance);
      return { subject, present, total, percentage, status, missable };
    });
  }, [liveData, attendanceRecords, requiredAttendance]);

  const todaysClasses = useMemo(() => {
    if (liveData && liveData.todaysClasses.length > 0) {
      return liveData.todaysClasses.map(item => ({
        entry: {
          id: String(item.timetableEntry.id),
          subjectId: String(item.timetableEntry.subject.id),
          day: item.timetableEntry.day as DayOfWeek,
          startTime: item.timetableEntry.startTime,
          endTime: item.timetableEntry.endTime,
          room: item.timetableEntry.room,
        },
        subject: {
          id: String(item.timetableEntry.subject.id),
          semesterId: '1',
          name: item.timetableEntry.subject.name,
          code: item.timetableEntry.subject.code,
          teacher: item.timetableEntry.subject.teacher,
          color: item.timetableEntry.subject.color,
        },
        record: item.attendance ? {
          id: String(item.attendance.id),
          subjectId: String(item.attendance.subject.id),
          date: item.attendance.date,
          status: item.attendance.status,
        } : undefined,
      }));
    }

    return mockTimetable
      .filter(t => t.day === todayDayName)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .map(entry => {
        const subject = mockSubjects.find(s => s.id === entry.subjectId)!;
        const record = attendanceRecords.find(
          r => r.subjectId === entry.subjectId && r.date === today
        );
        return { entry, subject, record };
      });
  }, [liveData, todayDayName, attendanceRecords, today]);

  // Animated values
  const animatedPercentage = useAnimatedNumber(overallStats.percentage, 1200);
  const animatedTotal = useAnimatedNumber(overallStats.totalClasses, 800);
  const animatedPresent = useAnimatedNumber(overallStats.totalPresent, 800);

  // Get current time for time-based styling
  const currentHour = new Date().getHours();
  const timeEmoji = currentHour < 12 ? '☀️' : currentHour < 17 ? '🌤️' : '🌙';

  return (
    <div className="page-container">
      {/* ─── Greeting Section ──────────── */}
      <div className="mb-8 animate-slide-up relative">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{timeEmoji}</span>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {getGreeting()},
              </h1>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold gradient-text mb-2">{user.name}</h2>
            <p className="text-surface-500 text-sm">{formatDate(today)}</p>
          </div>

          {/* User avatar (Click to open Settings) */}
          <div 
            onClick={() => navigate('/settings')}
            className="relative cursor-pointer group"
            title="Edit profile & photo"
          >
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20 overflow-hidden ring-2 ring-indigo-500/30 group-hover:ring-indigo-400 group-hover:scale-105 transition-all">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span>{user.name.charAt(0)}</span>
              )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-surface-950" />
          </div>
        </div>
      </div>

      {/* ─── Main Stats Area ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-8">
        {/* Overall Attendance Card — Larger, more prominent */}
        <div className="lg:col-span-5 glass-card gradient-border p-6 flex flex-col items-center justify-center animate-slide-up">
          <CircularProgress
            percentage={overallStats.percentage}
            status={overallStats.status}
            size={150}
          />
          <div className="mt-4 flex items-center gap-3">
            <StatusBadge status={overallStats.status} size="lg" />
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm text-surface-500">
            <span>Required: {requiredAttendance}%</span>
            <span className="text-surface-700">•</span>
            <span>{overallStats.totalPresent}/{overallStats.totalClasses} classes</span>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="lg:col-span-7 grid grid-cols-2 gap-4">
          <div className="stat-card animate-slide-up stagger-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="stat-icon bg-indigo-500/10">
                <BookOpen className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white animate-count-up">{Math.round(animatedTotal)}</p>
            <p className="text-xs text-surface-500 mt-1">Total Classes</p>
          </div>

          <div className="stat-card animate-slide-up stagger-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="stat-icon bg-emerald-500/10">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{Math.round(animatedPresent)}</p>
            <p className="text-xs text-surface-500 mt-1">Classes Attended</p>
          </div>

          <div className="stat-card animate-slide-up stagger-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="stat-icon bg-amber-500/10">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">
              {overallStats.subjectsAtRisk}
              {overallStats.subjectsAtRisk > 0 && (
                <span className="text-xs font-normal text-red-400 ml-2">⚠</span>
              )}
            </p>
            <p className="text-xs text-surface-500 mt-1">At Risk</p>
          </div>

          <div className="stat-card animate-slide-up stagger-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="stat-icon bg-violet-500/10">
                <Zap className="w-5 h-5 text-violet-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">
              {todaysClasses.length}
            </p>
            <p className="text-xs text-surface-500 mt-1">Today's Classes</p>
          </div>
        </div>
      </div>

      {/* ─── Today's Classes ───────────── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title flex items-center gap-2 mb-0">
            <Clock className="w-5 h-5 text-indigo-400" />
            Today's Classes
          </h2>
          {todaysClasses.length > 0 && (
            <span className="text-xs text-surface-500 bg-white/[0.04] px-3 py-1 rounded-full">
              {todaysClasses.filter(c => c.record).length}/{todaysClasses.length} marked
            </span>
          )}
        </div>

        {todaysClasses.length === 0 ? (
          <div className="glass-card p-10 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <p className="text-lg font-medium text-white mb-1">No classes today!</p>
            <p className="text-surface-500 text-sm">Enjoy your day off, {user.name}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todaysClasses.map(({ entry, subject, record }, index) => (
              <div
                key={entry.id}
                className="glass-card-hover p-4 sm:p-5 animate-slide-up relative overflow-hidden"
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                {/* Left color accent */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                  style={{ backgroundColor: subject.color }}
                />

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 pl-3">
                  {/* Time + Subject */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex flex-col items-center gap-1 min-w-[48px]">
                      <span className="text-sm font-semibold font-mono text-white">
                        {entry.startTime}
                      </span>
                      <span className="text-[10px] text-surface-600 font-mono">{entry.endTime}</span>
                    </div>

                    <div className="w-px h-10 bg-white/[0.06] hidden sm:block" />

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">{subject.code}</h3>
                        {record && (
                          <span className={`w-2 h-2 rounded-full ${
                            record.status === 'PRESENT' ? 'bg-emerald-400' : 'bg-red-400'
                          }`} />
                        )}
                      </div>
                      <p className="text-sm text-surface-500">{subject.name}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-surface-600" />
                          <span className="text-xs text-surface-600">{entry.room}</span>
                        </div>
                        <span className="text-xs text-surface-700">•</span>
                        <span className="text-xs text-surface-600">{subject.teacher}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t border-white/[0.04] sm:border-t-0">
                    <button
                      disabled={isLocked}
                      className={`btn-present flex-1 sm:flex-initial text-xs sm:text-sm py-2.5 sm:py-2 text-center justify-center font-semibold transition-all ${
                        record?.status === 'PRESENT' ? 'marked ring-2 ring-emerald-400/30' : ''
                      } ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
                      onClick={() => !isLocked && markAttendance(subject.id, today, 'PRESENT')}
                    >
                      {record?.status === 'PRESENT' ? '✓ Present' : 'Present'}
                    </button>
                    <button
                      disabled={isLocked}
                      className={`btn-absent flex-1 sm:flex-initial text-xs sm:text-sm py-2.5 sm:py-2 text-center justify-center font-semibold transition-all ${
                        record?.status === 'ABSENT' ? 'marked ring-2 ring-red-400/30' : ''
                      } ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
                      onClick={() => !isLocked && markAttendance(subject.id, today, 'ABSENT')}
                    >
                      {record?.status === 'ABSENT' ? '✗ Absent' : 'Absent'}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* ─── Final Submit & Lock Footer Bar ─── */}
            <div className="mt-4 pt-2">
              {isLocked ? (
                <div className="glass-card p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
                  <div className="flex items-center gap-2.5 text-emerald-400">
                    <ShieldCheck className="w-5 h-5 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Today's Attendance Locked & Submitted</h4>
                      <p className="text-xs text-emerald-300/80">All records are locked and permanently committed to the database.</p>
                    </div>
                  </div>
                  <button
                    onClick={handleUnlockAttendance}
                    className="btn-outline text-xs py-1.5 px-3 flex items-center justify-center gap-1.5 text-surface-400 hover:text-white shrink-0 self-end sm:self-auto"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Unlock to Edit</span>
                  </button>
                </div>
              ) : (
                <div className="glass-card p-4 border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-surface-900/60 to-purple-950/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-indigo-400" />
                      Lock & Finalize Today's Attendance
                    </h4>
                    <p className="text-xs text-surface-400 mt-0.5">
                      {todaysClasses.filter(c => c.record).length === todaysClasses.length
                        ? 'All classes marked! Click to lock and commit to database.'
                        : `Marked ${todaysClasses.filter(c => c.record).length} of ${todaysClasses.length} classes today.`
                      }
                    </p>
                  </div>
                  <button
                    onClick={handleLockAttendance}
                    disabled={isLocking || todaysClasses.filter(c => c.record).length === 0}
                    className="btn-primary text-xs sm:text-sm py-2.5 px-5 font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    {isLocking ? (
                      <span>Saving to DB...</span>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Lock & Final Submit</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Lock Success Toast */}
              {lockSuccessMessage && (
                <div className="mt-3 p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-slide-up">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Success! Today's attendance is locked and committed to MySQL database.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── Subject Overview ──────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title flex items-center gap-2 mb-0">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Subject Overview
          </h2>
          <button
            onClick={() => navigate('/attendance')}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
          >
            View all <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {subjectStats.map(({ subject, percentage, status, present, total, missable }, index) => (
            <div
              key={subject.id}
              className="glass-card-hover p-4 cursor-pointer animate-slide-up relative overflow-hidden group"
              style={{ animationDelay: `${index * 0.06}s` }}
              onClick={() => navigate(`/subject/${subject.id}`)}
            >
              {/* Subtle color tint on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `radial-gradient(circle at 50% 0%, ${subject.color}08, transparent 70%)` }}
              />

              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: subject.color + '18', color: subject.color }}
                    >
                      {subject.code.slice(0, 2)}
                    </div>
                    <span className="font-semibold text-white text-sm">{subject.code}</span>
                  </div>
                  <StatusBadge status={status} size="sm" />
                </div>

                <div className="flex items-end justify-between mb-3">
                  <div>
                    <span className="text-2xl font-bold text-white">{percentage.toFixed(1)}</span>
                    <span className="text-sm text-surface-500 ml-0.5">%</span>
                  </div>
                  <span className="text-xs text-surface-600">{present}/{total}</span>
                </div>

                <div className="progress-bar-container h-1.5 mb-3">
                  <div
                    className={`progress-bar-fill h-1.5 ${
                      percentage >= requiredAttendance + 5 ? 'bg-emerald-500' :
                      percentage >= requiredAttendance ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ '--progress-width': `${Math.min(percentage, 100)}%` } as React.CSSProperties}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-xs ${
                    missable > 0 ? 'text-surface-500' : 'text-amber-400'
                  }`}>
                    {missable > 0 ? `Can miss ${missable}` : 'Cannot miss'}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-surface-700 group-hover:text-surface-500 transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
