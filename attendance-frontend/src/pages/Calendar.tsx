import { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../App';
import { mockSubjects } from '../data/mockData';
import { ChevronLeft, ChevronRight, Check, X, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { api, ApiAttendanceRecord } from '../api/apiClient';

export default function CalendarPage() {
  const { attendanceRecords, refreshTrigger, isDemoMode } = useAppContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [liveCalendarRecords, setLiveCalendarRecords] = useState<ApiAttendanceRecord[] | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    let isMounted = true;
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    if (isDemoMode) {
      setLiveCalendarRecords(null);
      return () => { isMounted = false; };
    }

    api.getCalendar(1, startDate, endDate)
      .then(data => {
        if (isMounted) setLiveCalendarRecords(data);
      })
      .catch(err => console.warn('Could not fetch calendar from backend:', err));
    return () => { isMounted = false; };
  }, [year, month, refreshTrigger, isDemoMode]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const totalDays = lastDay.getDate();

    const days: { date: string | null; day: number | null }[] = [];
    for (let i = 0; i < startOffset; i++) days.push({ date: null, day: null });
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ date: dateStr, day: d });
    }
    return days;
  }, [year, month]);

  const effectiveRecords = useMemo(() => {
    if (liveCalendarRecords) {
      return liveCalendarRecords.map(r => ({
        id: String(r.id),
        subjectId: String(r.subject.id),
        date: r.date,
        status: r.status,
        subject: {
          id: String(r.subject.id),
          semesterId: '1',
          name: r.subject.name,
          code: r.subject.code,
          teacher: r.subject.teacher,
          color: r.subject.color,
        },
      }));
    }

    return attendanceRecords.map(r => {
      const subject = mockSubjects.find(s => s.id === r.subjectId) || {
        id: r.subjectId,
        semesterId: '1',
        name: 'Unknown',
        code: 'N/A',
        teacher: '',
        color: '#6366f1',
      };
      return { ...r, subject };
    });
  }, [liveCalendarRecords, attendanceRecords]);

  const dateAttendanceMap = useMemo(() => {
    const map: Record<string, { present: number; absent: number; total: number }> = {};
    effectiveRecords.forEach(record => {
      if (!map[record.date]) map[record.date] = { present: 0, absent: 0, total: 0 };
      map[record.date].total++;
      if (record.status === 'PRESENT') map[record.date].present++;
      else map[record.date].absent++;
    });
    return map;
  }, [effectiveRecords]);

  const selectedDateRecords = useMemo(() => {
    if (!selectedDate) return [];
    return effectiveRecords.filter(r => r.date === selectedDate);
  }, [selectedDate, effectiveRecords]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="page-container">
      {/* ─── Header ────────────────────── */}
      <div className="mb-7 animate-slide-up">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Calendar</h1>
        <p className="text-xs sm:text-sm text-surface-400 mt-0.5">Historical presence breakdown and day-by-day log</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Calendar Grid ───────────── */}
        <div className="lg:col-span-2 glass-card gradient-border p-6 sm:p-7 animate-slide-up relative overflow-hidden">
          {/* Navigation Bar */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={prevMonth}
              className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.08] hover:border-white/[0.12] transition-all active:scale-95"
            >
              <ChevronLeft className="w-4 h-4 text-surface-300" />
            </button>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-indigo-400" />
              <span>{monthName}</span>
            </h2>
            <button
              onClick={nextMonth}
              className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.08] hover:border-white/[0.12] transition-all active:scale-95"
            >
              <ChevronRight className="w-4 h-4 text-surface-300" />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 mb-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-center text-[10px] font-bold text-surface-500 uppercase tracking-[0.1em] py-2 font-mono">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {calendarDays.map((item, index) => {
              if (!item.date || !item.day) return <div key={`empty-${index}`} className="aspect-square" />;

              const dateInfo = dateAttendanceMap[item.date];
              const isToday = item.date === todayStr;
              const isSelected = item.date === selectedDate;
              const isFuture = item.date > todayStr;
              const hasClasses = !!dateInfo;

              let dotColor = '';
              let bgTint = '';
              if (hasClasses) {
                if (dateInfo.absent === 0) { dotColor = 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]'; bgTint = 'bg-emerald-400/[0.04] border-emerald-500/15'; }
                else if (dateInfo.present === 0) { dotColor = 'bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.8)]'; bgTint = 'bg-rose-400/[0.04] border-rose-500/15'; }
                else { dotColor = 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.8)]'; bgTint = 'bg-amber-400/[0.04] border-amber-500/15'; }
              }

              return (
                <button
                  key={item.date}
                  onClick={() => setSelectedDate(item.date)}
                  disabled={isFuture}
                  className={`
                    calendar-day aspect-square rounded-xl flex flex-col items-center justify-center gap-1
                    text-sm relative border transition-all duration-200 active:scale-90
                    ${isSelected
                      ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white border-indigo-400/50 shadow-lg shadow-indigo-500/30'
                      : isToday
                        ? 'bg-white/[0.04] text-white border-indigo-500/40 ring-1 ring-indigo-500/30'
                        : isFuture
                          ? 'text-surface-700 border-transparent cursor-default opacity-40'
                          : hasClasses
                            ? `text-surface-200 ${bgTint}`
                            : 'text-surface-400 border-transparent hover:bg-white/[0.04] hover:border-white/[0.06]'
                    }
                  `}
                >
                  <span className={`font-semibold text-xs sm:text-sm font-mono ${isSelected ? 'text-white' : ''}`}>
                    {item.day}
                  </span>
                  {hasClasses && !isSelected && (
                    <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mt-6 pt-4 border-t border-white/[0.04] flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
              <span className="text-[11px] text-surface-400 font-medium">All present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.5)]" />
              <span className="text-[11px] text-surface-400 font-medium">Partial</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.5)]" />
              <span className="text-[11px] text-surface-400 font-medium">All absent</span>
            </div>
          </div>
        </div>

        {/* ─── Selected Date Details ───── */}
        <div className="glass-card p-6 animate-slide-up stagger-1 h-fit lg:sticky lg:top-6">
          {selectedDate ? (
            <>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white tracking-tight">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' })}
                </h3>
              </div>
              <p className="text-xs text-surface-500 mb-4">Class breakdown for this day</p>

              {selectedDateRecords.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center text-xl">
                    📭
                  </div>
                  <p className="text-surface-400 text-xs font-medium">No recorded lectures on this day</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {selectedDateRecords.map(record => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] attendance-row"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 border"
                          style={{
                            backgroundColor: `${record.subject.color}15`,
                            color: record.subject.color,
                            borderColor: `${record.subject.color}30`
                          }}
                        >
                          {record.subject.code.slice(0, 3)}
                        </div>
                        <span className="text-xs font-semibold text-white truncate">{record.subject.name}</span>
                      </div>
                      {record.status === 'PRESENT' ? (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/[0.08] border border-emerald-500/20 text-emerald-400">
                          <Check className="w-3 h-3 stroke-[2.5]" />
                          <span className="text-[10px] font-bold">Present</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/[0.08] border border-rose-500/20 text-rose-400">
                          <X className="w-3 h-3 stroke-[2.5]" />
                          <span className="text-[10px] font-bold">Absent</span>
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="pt-3 border-t border-white/[0.04] mt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-surface-400 font-medium">Classes attended:</span>
                      <span className="text-white font-mono font-bold">
                        {selectedDateRecords.filter(r => r.status === 'PRESENT').length}/{selectedDateRecords.length}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-14">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-indigo-500/[0.08] border border-indigo-500/15 flex items-center justify-center text-indigo-400">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Select a Date</h4>
              <p className="text-surface-500 text-xs max-w-[180px] mx-auto">Click any day on the calendar to view its logged attendance</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
