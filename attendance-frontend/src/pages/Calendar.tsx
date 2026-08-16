import { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../App';
import { mockSubjects } from '../data/mockData';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { api, ApiAttendanceRecord } from '../api/apiClient';

export default function CalendarPage() {
  const { attendanceRecords, refreshTrigger } = useAppContext();
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

    api.getCalendar(1, startDate, endDate)
      .then(data => {
        if (isMounted) setLiveCalendarRecords(data);
      })
      .catch(err => console.warn('Could not fetch calendar from backend:', err));
    return () => { isMounted = false; };
  }, [year, month, refreshTrigger]);

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

    return [];
  }, [liveCalendarRecords]);

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
      <h1 className="text-2xl font-bold text-white mb-6">Calendar</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Calendar Grid ───────────── */}
        <div className="lg:col-span-2 glass-card p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <button onClick={prevMonth} className="w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center hover:bg-white/[0.08] transition-colors">
              <ChevronLeft className="w-4 h-4 text-surface-300" />
            </button>
            <h2 className="text-lg font-semibold text-white">{monthName}</h2>
            <button onClick={nextMonth} className="w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center hover:bg-white/[0.08] transition-colors">
              <ChevronRight className="w-4 h-4 text-surface-300" />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-3">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-center text-[10px] font-semibold text-surface-600 uppercase tracking-wider py-2">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
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
                if (dateInfo.absent === 0) { dotColor = 'bg-emerald-400'; bgTint = 'bg-emerald-400/[0.04]'; }
                else if (dateInfo.present === 0) { dotColor = 'bg-red-400'; bgTint = 'bg-red-400/[0.04]'; }
                else { dotColor = 'bg-amber-400'; bgTint = 'bg-amber-400/[0.04]'; }
              }

              return (
                <button
                  key={item.date}
                  onClick={() => setSelectedDate(item.date)}
                  disabled={isFuture}
                  className={`
                    calendar-day aspect-square rounded-xl flex flex-col items-center justify-center gap-1
                    text-sm relative
                    ${isSelected
                      ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                      : isToday
                        ? 'bg-white/[0.04] text-white ring-1 ring-indigo-500/30'
                        : isFuture
                          ? 'text-surface-800 cursor-default'
                          : hasClasses
                            ? `text-surface-300 ${bgTint}`
                            : 'text-surface-500 hover:bg-white/[0.04]'
                    }
                  `}
                >
                  <span className={`font-medium text-[13px] ${isSelected ? 'text-white' : ''}`}>
                    {item.day}
                  </span>
                  {hasClasses && !isSelected && (
                    <div className={`w-1 h-1 rounded-full ${dotColor}`} />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-6 mt-5 pt-4 border-t border-white/[0.04]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[11px] text-surface-500">All present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-[11px] text-surface-500">Partial</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-[11px] text-surface-500">All absent</span>
            </div>
          </div>
        </div>

        {/* ─── Selected Date Details ───── */}
        <div className="glass-card p-6 animate-slide-up stagger-1 h-fit lg:sticky lg:top-6">
          {selectedDate ? (
            <>
              <h3 className="text-base font-semibold text-white mb-1">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>

              {selectedDateRecords.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-3xl mb-2">📭</div>
                  <p className="text-surface-500 text-sm">No classes on this day</p>
                </div>
              ) : (
                <div className="space-y-2 mt-4">
                  {selectedDateRecords.map(record => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.04] attendance-row"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold"
                          style={{ backgroundColor: record.subject.color + '15', color: record.subject.color }}
                        >
                          {record.subject.code.slice(0, 2)}
                        </div>
                        <span className="text-sm font-medium text-white">{record.subject.code}</span>
                      </div>
                      {record.status === 'PRESENT' ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <Check className="w-3 h-3 text-emerald-400" />
                          </div>
                          <span className="text-xs text-emerald-400 font-medium">Present</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center">
                            <X className="w-3 h-3 text-red-400" />
                          </div>
                          <span className="text-xs text-red-400 font-medium">Absent</span>
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="pt-3 border-t border-white/[0.04] mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-surface-500">Classes attended</span>
                      <span className="text-xs text-white font-medium">
                        {selectedDateRecords.filter(r => r.status === 'PRESENT').length}/{selectedDateRecords.length}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-14">
              <div className="text-3xl mb-3">📅</div>
              <p className="text-surface-500 text-sm">Select a date to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
