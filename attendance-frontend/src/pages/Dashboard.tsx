import { useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../App';
import { mockSubjects, mockTimetable, getDemoSubjectSummaries } from '../data/mockData';
import {
  calculatePercentage, getStatus, getGreeting,
  formatDate, getTodayISO
} from '../utils/attendance';
import CircularProgress from '../components/CircularProgress';
import StatusBadge from '../components/StatusBadge';
import { 
  MapPin, Clock, AlertTriangle, TrendingUp, BookOpen, ChevronRight, 
  Sparkles, Zap, Lock, Unlock, ShieldCheck, CheckCircle2, Plus, Calendar as CalendarIcon, Flame
} from 'lucide-react';
import type { DayOfWeek } from '../types';
import { api, ApiDashboardData } from '../api/apiClient';

// Animated counter hook with smooth cubic spring
function useAnimatedNumber(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

export default function Dashboard() {
  const { user, attendanceRecords, markAttendance, requiredAttendance, refreshTrigger, isDemoMode } = useAppContext();
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
      if (!isDemoMode) {
        for (const item of todaysClasses) {
          if (item.record?.status) {
            await api.markAttendance(Number(item.subject.id), today, item.record.status);
          }
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

  // Quick 1-Tap: Mark all uncompleted classes today as Present
  const handleMarkAllPresent = () => {
    if (isLocked) return;
    todaysClasses.forEach(item => {
      markAttendance(item.subject.id, today, 'PRESENT');
    });
  };

  // Fetch live dashboard data from Spring Boot REST API
  useEffect(() => {
    let isMounted = true;
    async function loadDashboard() {
      if (isDemoMode) {
        if (isMounted) {
          setLiveData(null);
          setLoading(false);
        }
        return;
      }
      try {
        const data = await api.getDashboard(Number(user.id) || 1);
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
  }, [refreshTrigger, requiredAttendance, isDemoMode, user.id]);

  // Compute stats
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
    if (liveData) {
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

    return getDemoSubjectSummaries(attendanceRecords, requiredAttendance).map(s => ({
      subject: s.subject,
      present: s.present,
      total: s.total,
      percentage: s.percentage,
      status: s.status,
      missable: s.canMiss,
    }));
  }, [liveData, attendanceRecords, requiredAttendance]);

  const todaysClasses = useMemo(() => {
    if (liveData) {
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
        const record = attendanceRecords.find(r => r.subjectId === entry.subjectId && r.date === today);
        return { entry, subject, record };
      });
  }, [liveData, attendanceRecords, today, todayDayName]);

  // Animated values
  const animatedPercentage = useAnimatedNumber(overallStats.percentage, 1000);
  const animatedTotal = useAnimatedNumber(overallStats.totalClasses, 700);
  const animatedPresent = useAnimatedNumber(overallStats.totalPresent, 700);

  const currentHour = new Date().getHours();
  const timeEmoji = currentHour < 12 ? '☀️' : currentHour < 17 ? '🌤️' : '🌙';

  return (
    <div className="page-container">
      {/* ─── Hero Header & Greeting ────── */}
      <div className="mb-8 animate-slide-up relative">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{timeEmoji}</span>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {getGreeting()},
              </h1>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold gradient-text mb-3 tracking-tight">{user.name}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-surface-300 flex items-center gap-1.5 font-medium shadow-sm">
                <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
                {formatDate(today)}
              </span>
              <span className="text-xs px-3 py-1 rounded-full bg-amber-500/[0.08] border border-amber-500/20 text-amber-400 font-semibold flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.08)]">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                5-Day Streak
              </span>
              <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/[0.08] border border-indigo-500/20 text-indigo-300 font-semibold flex items-center gap-1.5 shadow-[0_0_12px_rgba(99,102,241,0.08)]">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Target {requiredAttendance}%
              </span>
              {isDemoMode && (
                <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/[0.08] border border-emerald-500/20 text-emerald-400 font-medium">
                  Offline Demo · {user.email}
                </span>
              )}
            </div>
          </div>

          {/* User avatar */}
          <div 
            onClick={() => navigate('/settings')}
            className="relative cursor-pointer group"
            title="Edit profile & photo"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg shadow-indigo-500/20 overflow-hidden ring-2 ring-white/[0.08] group-hover:ring-indigo-400/50 group-hover:scale-105 transition-all duration-300">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span>{user.name.charAt(0)}</span>
              )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#06070b]" />
          </div>
        </div>
      </div>

      {/* ─── Main Metric & Stats Grid ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-8">
        {/* Overall Attendance Card */}
        <div className="lg:col-span-5 glass-card gradient-border p-6 sm:p-7 flex flex-col items-center justify-center animate-slide-up relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/[0.06] rounded-full blur-2xl pointer-events-none" />
          <CircularProgress
            percentage={overallStats.percentage}
            status={overallStats.status}
            size={155}
          />
          <div className="mt-5 flex items-center gap-3">
            <StatusBadge status={overallStats.status} size="lg" />
          </div>
          <div className="mt-3.5 flex items-center gap-2 text-xs sm:text-sm text-surface-400 font-medium">
            <span>Target: <strong className="text-white">{requiredAttendance}%</strong></span>
            <span className="text-white/[0.15]">•</span>
            <span><strong className="text-white">{overallStats.totalPresent}</strong>/{overallStats.totalClasses} classes</span>
          </div>
        </div>

        {/* Quick Stats 2x2 Grid */}
        <div className="lg:col-span-7 grid grid-cols-2 gap-3.5 sm:gap-4">
          <div className="stat-card animate-slide-up stagger-1 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-surface-400 font-medium">Total Classes</span>
              <div className="stat-icon bg-indigo-500/[0.08] text-indigo-400 border border-indigo-500/15">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{Math.round(animatedTotal)}</p>
              <p className="text-[11px] text-surface-500 mt-1">Conducted to date</p>
            </div>
          </div>

          <div className="stat-card animate-slide-up stagger-2 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-surface-400 font-medium">Attended</span>
              <div className="stat-icon bg-emerald-500/[0.08] text-emerald-400 border border-emerald-500/15">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{Math.round(animatedPresent)}</p>
              <p className="text-[11px] text-emerald-400/90 mt-1 font-medium">
                {overallStats.totalClasses > 0 ? `${((overallStats.totalPresent / overallStats.totalClasses) * 100).toFixed(0)}% attendance rate` : 'No data yet'}
              </p>
            </div>
          </div>

          <div className="stat-card animate-slide-up stagger-3 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-surface-400 font-medium">At Risk</span>
              <div className={`stat-icon ${overallStats.subjectsAtRisk > 0 ? 'bg-rose-500/[0.08] text-rose-400 border border-rose-500/15' : 'bg-white/[0.04] text-surface-500 border border-white/[0.06]'}`}>
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className={`text-2xl sm:text-3xl font-bold tracking-tight ${overallStats.subjectsAtRisk > 0 ? 'text-rose-400' : 'text-white'}`}>
                  {overallStats.subjectsAtRisk}
                </p>
                {overallStats.subjectsAtRisk > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/20">
                    Below {requiredAttendance}%
                  </span>
                )}
              </div>
              <p className="text-[11px] text-surface-500 mt-1">Subjects needing care</p>
            </div>
          </div>

          <div className="stat-card animate-slide-up stagger-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-surface-400 font-medium">Today's Load</span>
              <div className="stat-icon bg-violet-500/[0.08] text-violet-400 border border-violet-500/15">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {todaysClasses.length}
              </p>
              <p className="text-[11px] text-surface-500 mt-1">
                {todaysClasses.length === 0 ? 'Day off' : `${todaysClasses.length} scheduled lectures`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Today's Schedule & 1-Tap Attendance ──── */}
      <div className="mb-9">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="section-title flex items-center gap-2.5 mb-0">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/[0.08] flex items-center justify-center border border-indigo-500/15">
              <Clock className="w-4 h-4 text-indigo-400" />
            </div>
            <span>Today's Classes</span>
          </h2>

          <div className="flex items-center gap-2">
            {todaysClasses.length > 0 && !isLocked && todaysClasses.some(c => !c.record) && (
              <button
                onClick={handleMarkAllPresent}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/[0.08] border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/[0.15] hover:border-emerald-500/30 flex items-center gap-1.5 transition-all active:scale-95 shadow-[0_0_12px_rgba(16,185,129,0.08)]"
                title="Mark all today's lectures as present"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Mark All Present</span>
              </button>
            )}
            {todaysClasses.length > 0 && (
              <span className="text-xs text-surface-400 bg-white/[0.03] border border-white/[0.06] px-3 py-1 rounded-full font-mono font-medium">
                {todaysClasses.filter(c => c.record).length}/{todaysClasses.length} marked
              </span>
            )}
          </div>
        </div>

        {todaysClasses.length === 0 ? (
          <div className="glass-card p-10 text-center relative overflow-hidden">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-indigo-500/[0.08] border border-indigo-500/15 flex items-center justify-center text-2xl">
              🎉
            </div>
            <p className="text-base font-bold text-white mb-1">No classes today!</p>
            <p className="text-surface-500 text-xs max-w-xs mx-auto">Enjoy your time off or review your upcoming attendance projections.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todaysClasses.map(({ entry, subject, record }, index) => (
              <div
                key={entry.id}
                className="glass-card-hover p-4 sm:p-5 animate-slide-up relative overflow-hidden group"
                style={{ animationDelay: `${index * 0.06}s` }}
              >
                {/* Left vertical color pill accent */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl transition-all duration-300 group-hover:w-2"
                  style={{ backgroundColor: subject.color }}
                />

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 pl-3">
                  {/* Time + Subject */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex flex-col items-center gap-0.5 min-w-[54px] py-1 px-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-xs font-bold font-mono text-white">
                        {entry.startTime}
                      </span>
                      <span className="text-[10px] text-surface-500 font-mono">{entry.endTime}</span>
                    </div>

                    <div className="w-px h-10 bg-white/[0.06] hidden sm:block" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-sm sm:text-base tracking-tight truncate">{subject.code}</h3>
                        {record && (
                          <span className={`w-2 h-2 rounded-full ring-2 ${
                            record.status === 'PRESENT' ? 'bg-emerald-400 ring-emerald-500/30' : 'bg-rose-400 ring-rose-500/30'
                          }`} />
                        )}
                      </div>
                      <p className="text-xs text-surface-400 truncate mt-0.5">{subject.name}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-surface-500" />
                          <span className="text-[11px] text-surface-400 font-medium">{entry.room}</span>
                        </div>
                        <span className="text-surface-700">•</span>
                        <span className="text-[11px] text-surface-500 truncate">{subject.teacher}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t border-white/[0.04] sm:border-t-0">
                    <button
                      disabled={isLocked}
                      className={`btn-present flex-1 sm:flex-initial text-xs sm:text-sm py-2.5 sm:py-2 text-center justify-center font-semibold transition-all ${
                        record?.status === 'PRESENT' ? 'marked' : ''
                      } ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                      onClick={() => !isLocked && markAttendance(subject.id, today, 'PRESENT')}
                    >
                      {record?.status === 'PRESENT' ? '✓ Present' : 'Present'}
                    </button>
                    <button
                      disabled={isLocked}
                      className={`btn-absent flex-1 sm:flex-initial text-xs sm:text-sm py-2.5 sm:py-2 text-center justify-center font-semibold transition-all ${
                        record?.status === 'ABSENT' ? 'marked' : ''
                      } ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                      onClick={() => !isLocked && markAttendance(subject.id, today, 'ABSENT')}
                    >
                      {record?.status === 'ABSENT' ? '✗ Absent' : 'Absent'}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* ─── Final Submit & Lock Footer Bar ─── */}
            <div className="mt-4 pt-1">
              {isLocked ? (
                <div className="glass-card p-4 sm:p-5 bg-emerald-500/[0.06] border border-emerald-500/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in shadow-[0_0_20px_rgba(16,185,129,0.06)]">
                  <div className="flex items-center gap-3 text-emerald-400">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Attendance Locked & Submitted</h4>
                      <p className="text-xs text-emerald-300/75 mt-0.5">All marked records are permanently saved to database.</p>
                    </div>
                  </div>
                  <button
                    onClick={handleUnlockAttendance}
                    className="btn-outline text-xs py-2 px-3.5 flex items-center justify-center gap-1.5 text-surface-400 hover:text-white shrink-0 self-end sm:self-auto"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Unlock to Edit</span>
                  </button>
                </div>
              ) : (
                <div className="glass-card p-4 sm:p-5 border border-indigo-500/20 bg-gradient-to-r from-indigo-950/30 via-[#0c0f18] to-purple-950/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Lock className="w-4 h-4 text-indigo-400" />
                      Lock & Finalize Today's Attendance
                    </h4>
                    <p className="text-xs text-surface-400 mt-0.5">
                      {todaysClasses.filter(c => c.record).length === todaysClasses.length
                        ? 'All classes marked! Click to permanently commit to database.'
                        : `Marked ${todaysClasses.filter(c => c.record).length} of ${todaysClasses.length} classes today.`
                      }
                    </p>
                  </div>
                  <button
                    onClick={handleLockAttendance}
                    disabled={isLocking || todaysClasses.filter(c => c.record).length === 0}
                    className="btn-primary text-xs sm:text-sm py-2.5 px-5 font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
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
                <div className="mt-3 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-slide-up shadow-lg">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Success! Today's attendance is locked and committed to MySQL database.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── Subject Overview Cards ──────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title flex items-center gap-2.5 mb-0">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/[0.08] flex items-center justify-center border border-indigo-500/15">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <span>Subject Overview</span>
          </h2>
          <button
            onClick={() => navigate('/attendance')}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-white/[0.04]"
          >
            View all <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {subjectStats.length === 0 ? (
          <div className="glass-card p-10 text-center animate-fade-in relative overflow-hidden">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-indigo-500/[0.08] border border-indigo-500/15 flex items-center justify-center text-indigo-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">No subjects yet</h3>
            <p className="text-xs text-surface-400 mb-5 max-w-sm mx-auto">
              Add your subjects to start tracking attendance and unlock intelligent what-if projections!
            </p>
            <button
              onClick={() => navigate('/attendance')}
              className="btn-primary text-xs py-2.5 px-5 inline-flex items-center gap-2 font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Subject</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {subjectStats.map(({ subject, percentage, status, present, total, missable }, index) => (
              <div
                key={subject.id}
                className="glass-card-hover p-4 sm:p-5 cursor-pointer animate-slide-up relative overflow-hidden group"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => navigate(`/subject/${subject.id}`)}
              >
                {/* Background ambient color tint */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${subject.color}12, transparent 70%)` }}
                />

                <div className="relative">
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 border"
                        style={{
                          backgroundColor: `${subject.color}15`,
                          color: subject.color,
                          borderColor: `${subject.color}30`
                        }}
                      >
                        {subject.code.slice(0, 2)}
                      </div>
                      <span className="font-bold text-white text-sm tracking-tight truncate">{subject.code}</span>
                    </div>
                    <StatusBadge status={status} size="sm" />
                  </div>

                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <span className="text-2xl font-bold text-white tracking-tight">{percentage.toFixed(1)}</span>
                      <span className="text-sm text-surface-400 ml-0.5 font-normal">%</span>
                    </div>
                    <span className="text-xs text-surface-400 font-mono font-medium">{present}/{total} attended</span>
                  </div>

                  <div className="progress-bar-container h-1.5 mb-3.5">
                    <div
                      className={`progress-bar-fill h-1.5 ${
                        percentage >= requiredAttendance + 5 ? 'bg-emerald-500' :
                        percentage >= requiredAttendance ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ '--progress-width': `${Math.min(percentage, 100)}%` } as React.CSSProperties}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                    {total === 0 ? (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/[0.04] text-surface-400 border border-white/[0.06]">
                        ✨ No classes yet
                      </span>
                    ) : missable > 0 ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/[0.08] text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <span>🛡️</span> Can miss {missable} {missable === 1 ? 'class' : 'classes'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/[0.08] text-amber-400 border border-amber-500/20 flex items-center gap-1">
                        <span>⚡</span> Don't miss next class
                      </span>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-surface-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
