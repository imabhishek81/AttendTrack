import { useState, useMemo, useEffect } from 'react';
import { mockTimetable, mockSubjects } from '../data/mockData';
import { Clock, MapPin, User } from 'lucide-react';
import type { DayOfWeek } from '../types';
import { api, ApiTimetableEntry } from '../api/apiClient';

const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const dayShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Timetable() {
  const todayIndex = Math.min(new Date().getDay() - 1, 5);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(
    todayIndex >= 0 ? days[todayIndex] : days[0]
  );
  const [liveTimetable, setLiveTimetable] = useState<ApiTimetableEntry[] | null>(null);

  useEffect(() => {
    let isMounted = true;
    api.getTimetable(1)
      .then(data => {
        if (isMounted) setLiveTimetable(data);
      })
      .catch(err => console.warn('Could not fetch timetable from backend:', err));
    return () => { isMounted = false; };
  }, []);

  const dayClasses = useMemo(() => {
    if (liveTimetable && liveTimetable.length > 0) {
      return liveTimetable
        .filter(t => t.day === selectedDay)
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
        .map(entry => ({
          id: String(entry.id),
          subjectId: String(entry.subject.id),
          day: entry.day as DayOfWeek,
          startTime: entry.startTime,
          endTime: entry.endTime,
          room: entry.room,
          subject: {
            id: String(entry.subject.id),
            semesterId: '1',
            name: entry.subject.name,
            code: entry.subject.code,
            teacher: entry.subject.teacher,
            color: entry.subject.color,
          },
        }));
    }

    return mockTimetable
      .filter(t => t.day === selectedDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .map(entry => ({
        ...entry,
        subject: mockSubjects.find(s => s.id === entry.subjectId)!,
      }));
  }, [liveTimetable, selectedDay]);

  return (
    <div className="page-container">
      <h1 className="text-2xl font-bold text-white mb-6">Timetable</h1>

      {/* ─── Day Selector (Horizontally scrollable on mobile) ──── */}
      <div className="w-full overflow-x-auto no-scrollbar pb-1 mb-6">
        <div className="glass-card p-1.5 inline-flex gap-1 animate-slide-up min-w-full sm:min-w-0 justify-between sm:justify-start">
        {days.map((day, i) => {
          const isToday = i === Math.min(new Date().getDay() - 1, 5);
          const isSelected = day === selectedDay;
          const classCount = mockTimetable.filter(t => t.day === day).length;

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`
                relative px-4 py-2.5 rounded-xl font-medium text-sm
                transition-all duration-250
                ${isSelected
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-surface-400 hover:text-white hover:bg-white/[0.04]'
                }
              `}
            >
              <span className="relative">
                {dayShort[i]}
                <span className={`ml-1 text-[10px] ${isSelected ? 'text-white/60' : 'text-surface-600'}`}>
                  {classCount}
                </span>
              </span>
              {isToday && !isSelected && (
                <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-400 rounded-full" />
              )}
            </button>
          );
        })}
        </div>
      </div>

      {/* ─── Classes ───────────────────── */}
      {dayClasses.length === 0 ? (
        <div className="glass-card p-14 text-center animate-slide-up">
          <div className="text-5xl mb-4">🎉</div>
          <p className="text-lg font-medium text-white mb-1">No classes on {selectedDay}</p>
          <p className="text-sm text-surface-500">Enjoy your free day!</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[23px] top-6 bottom-6 w-px bg-gradient-to-b from-indigo-500/20 via-white/[0.04] to-transparent hidden sm:block" />

          <div className="space-y-3">
            {dayClasses.map((cls, index) => (
              <div
                key={cls.id}
                className="flex gap-4 animate-slide-up"
                style={{ animationDelay: `${index * 0.06}s` }}
              >
                {/* Timeline dot */}
                <div className="hidden sm:flex flex-col items-center pt-6">
                  <div className="relative z-10">
                    <div
                      className="w-3 h-3 rounded-full ring-4 ring-surface-950"
                      style={{ backgroundColor: cls.subject.color }}
                    />
                  </div>
                </div>

                {/* Card */}
                <div className="flex-1 glass-card-hover p-5 relative overflow-hidden group">
                  {/* Color accent */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                    style={{ backgroundColor: cls.subject.color }}
                  />

                  {/* Hover tint */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: `radial-gradient(ellipse at 0% 50%, ${cls.subject.color}06, transparent 60%)` }}
                  />

                  <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pl-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold"
                          style={{ backgroundColor: cls.subject.color + '15', color: cls.subject.color }}
                        >
                          {cls.subject.code.slice(0, 2)}
                        </div>
                        <h3 className="text-base font-semibold text-white">{cls.subject.code}</h3>
                      </div>
                      <p className="text-sm text-surface-500 ml-9">{cls.subject.name}</p>
                    </div>

                    <div className="flex items-center gap-5 ml-9 sm:ml-0">
                      <div className="flex items-center gap-1.5 text-surface-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-sm font-mono">{cls.startTime}</span>
                        <span className="text-surface-700 text-xs">→</span>
                        <span className="text-sm font-mono text-surface-500">{cls.endTime}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-surface-500">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="text-sm">{cls.room}</span>
                      </div>
                      <div className="hidden md:flex items-center gap-1.5 text-surface-600">
                        <User className="w-3.5 h-3.5" />
                        <span className="text-xs">{cls.subject.teacher}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
