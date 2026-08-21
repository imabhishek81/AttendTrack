import { useState, useMemo, useEffect, useCallback } from 'react';
import { mockTimetable, mockSubjects } from '../data/mockData';
import { Clock, MapPin, Plus, Trash2, X, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import type { DayOfWeek } from '../types';
import { api, ApiTimetableEntry, ApiSubjectStats } from '../api/apiClient';
import { useAppContext } from '../App';

const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const dayShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Timetable() {
  const { refreshTrigger, triggerRefresh, isDemoMode } = useAppContext();
  const currentDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }) as DayOfWeek;
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(
    days.includes(currentDayName) ? currentDayName : days[0]
  );
  const [liveTimetable, setLiveTimetable] = useState<ApiTimetableEntry[] | null>(null);
  const [availableSubjects, setAvailableSubjects] = useState<ApiSubjectStats[]>([]);
  
  // Modal state for adding a class slot
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [slotDay, setSlotDay] = useState<DayOfWeek>(selectedDay);
  const [slotSubjectId, setSlotSubjectId] = useState<string>('');
  const [slotStartTime, setSlotStartTime] = useState('09:00');
  const [slotEndTime, setSlotEndTime] = useState('10:00');
  const [slotRoom, setSlotRoom] = useState('Room 301');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchTimetable = useCallback(async () => {
    if (isDemoMode) {
      setLiveTimetable(null);
      return;
    }
    try {
      const data = await api.getTimetable(1);
      setLiveTimetable(data);
    } catch (err) {
      console.warn('Could not fetch timetable from backend:', err);
    }
  }, [isDemoMode]);

  const fetchSubjects = useCallback(async () => {
    if (isDemoMode) {
      setAvailableSubjects([]);
      return;
    }
    try {
      const data = await api.getSubjects(1);
      setAvailableSubjects(data);
      if (data.length > 0 && !slotSubjectId) {
        setSlotSubjectId(String(data[0].subject.id));
      }
    } catch (err) {
      console.warn('Could not fetch subjects:', err);
    }
  }, [slotSubjectId, isDemoMode]);

  useEffect(() => {
    fetchTimetable();
    fetchSubjects();
  }, [fetchTimetable, fetchSubjects, refreshTrigger]);

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotSubjectId) {
      setFormError('Please select a subject.');
      return;
    }
    if (!slotStartTime || !slotEndTime) {
      setFormError('Please enter start and end times.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    if (isDemoMode) {
      setFormError('Timetable edits are disabled in offline demo mode.');
      setIsSubmitting(false);
      return;
    }

    try {
      await api.addTimetableEntry(Number(slotSubjectId), {
        day: slotDay,
        startTime: slotStartTime,
        endTime: slotEndTime,
        room: slotRoom || 'Room 101',
      });
      setIsAddModalOpen(false);
      triggerRefresh();
      fetchTimetable();
    } catch (err: any) {
      setFormError(err.message || 'Failed to add class slot.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSlot = async (id: number) => {
    if (isDemoMode) return;
    if (!confirm('Are you sure you want to remove this class from your timetable?')) return;
    try {
      setLiveTimetable(prev => prev ? prev.filter(t => t.id !== id) : []);
      await api.deleteTimetableEntry(id);
      triggerRefresh();
      fetchTimetable();
    } catch (err) {
      console.error('Failed to delete timetable entry:', err);
      fetchTimetable();
    }
  };

  const dayClasses = useMemo(() => {
    if (liveTimetable) {
      return liveTimetable
        .filter(t => t.day === selectedDay)
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
        .map(entry => ({
          id: entry.id,
          subjectId: entry.subject.id,
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
      .map(entry => {
        const subject = mockSubjects.find(s => s.id === entry.subjectId)!;
        return {
          id: Number(entry.id),
          subjectId: Number(entry.subjectId),
          day: entry.day,
          startTime: entry.startTime,
          endTime: entry.endTime,
          room: entry.room,
          subject,
        };
      });
  }, [liveTimetable, selectedDay]);

  return (
    <div className="page-container">
      {/* ─── Header + Add Button ────────── */}
      <div className="flex items-center justify-between mb-7 animate-slide-up">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Timetable</h1>
          <p className="text-xs sm:text-sm text-surface-400 mt-0.5">Manage weekly schedule and lecture rooms</p>
        </div>
        <button
          onClick={() => {
            setSlotDay(selectedDay);
            setIsAddModalOpen(true);
          }}
          className="btn-primary text-xs sm:text-sm py-2.5 px-4 flex items-center gap-2 font-semibold shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Class Slot</span>
        </button>
      </div>

      {/* ─── Day Selector Pill Strip ───── */}
      <div className="w-full overflow-x-auto no-scrollbar pb-1 mb-7">
        <div className="glass-card p-1.5 inline-flex gap-1 animate-slide-up min-w-full sm:min-w-0 justify-between sm:justify-start">
          {days.map((day, i) => {
            const isToday = i === Math.min(new Date().getDay() - 1, 5);
            const isSelected = day === selectedDay;
            const count = liveTimetable 
              ? liveTimetable.filter(t => t.day === day).length 
              : mockTimetable.filter(t => t.day === day).length;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`
                  relative px-3.5 sm:px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm
                  transition-all duration-200 flex items-center gap-2 active:scale-95
                  ${isSelected
                    ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25'
                    : 'text-surface-400 hover:text-white hover:bg-white/[0.04]'
                  }
                `}
              >
                <span>{dayShort[i]}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                  isSelected ? 'bg-white/25 text-white' : 'bg-white/[0.05] text-surface-400'
                }`}>
                  {count}
                </span>
                {isToday && !isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-400 rounded-full shadow-[0_0_6px_rgba(99,102,241,0.8)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Classes List / Timeline ───── */}
      {dayClasses.length === 0 ? (
        <div className="glass-card p-12 text-center animate-slide-up relative overflow-hidden">
          <div className="w-14 h-14 mx-auto mb-3.5 rounded-2xl bg-indigo-500/[0.08] border border-indigo-500/15 flex items-center justify-center text-2xl">
            🎉
          </div>
          <p className="text-base font-bold text-white mb-1">No classes scheduled on {selectedDay}</p>
          <p className="text-xs text-surface-400 mb-5 max-w-xs mx-auto">Take time to study or add new scheduled slots for this day</p>
          <button
            onClick={() => {
              setSlotDay(selectedDay);
              setIsAddModalOpen(true);
            }}
            className="btn-outline text-xs py-2.5 px-4 inline-flex items-center gap-2 font-semibold text-indigo-400 hover:text-indigo-300"
          >
            <Plus className="w-4 h-4" />
            <span>Add Slot for {selectedDay}</span>
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="space-y-3">
            {dayClasses.map((item, index) => (
              <div
                key={item.id}
                className="glass-card-hover p-4 sm:p-5 animate-slide-up relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Accent line on left */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl transition-all duration-300 group-hover:w-2"
                  style={{ backgroundColor: item.subject?.color || '#6366f1' }}
                />

                <div className="flex items-start sm:items-center gap-3.5 pl-2">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.06] flex flex-col items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-indigo-400 mb-0.5" />
                    <span className="text-[10px] text-white font-mono font-bold">{item.startTime}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-bold text-white tracking-tight">{item.subject?.code}</h3>
                      <span className="text-xs text-surface-400 font-medium truncate">• {item.subject?.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-surface-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-surface-500" />
                        <span className="font-mono">{item.startTime} – {item.endTime}</span>
                      </div>
                      <span className="text-surface-700">•</span>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-surface-500" />
                        <span className="font-medium text-surface-300">{item.room}</span>
                      </div>
                      {item.subject?.teacher && (
                        <>
                          <span className="text-surface-700">•</span>
                          <span className="text-surface-500 truncate">{item.subject.teacher}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Delete slot button */}
                <div className="flex items-center justify-end">
                  <button
                    onClick={() => handleDeleteSlot(item.id)}
                    className="p-2 rounded-xl text-surface-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all active:scale-95"
                    title="Remove class slot"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Add Class Slot Modal ───────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#06070b]/80 backdrop-blur-xl animate-fade-in">
          <div className="glass-card gradient-border p-6 sm:p-7 w-full max-w-md shadow-2xl relative animate-slide-up">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 text-surface-500 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/[0.08] border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Add Timetable Slot</h3>
                <p className="text-xs text-surface-400">Schedule a new recurring class</p>
              </div>
            </div>

            <form onSubmit={handleAddSlot} className="space-y-4">
              {/* Day */}
              <div>
                <label className="block text-xs font-semibold text-surface-300 mb-1.5">Day of Week</label>
                <select
                  value={slotDay}
                  onChange={e => setSlotDay(e.target.value as DayOfWeek)}
                  className="input-field py-2.5 text-sm"
                >
                  {days.map(d => (
                    <option key={d} value={d} className="bg-[#0c0f18] text-white">
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-surface-300 mb-1.5">Subject</label>
                {availableSubjects.length === 0 ? (
                  <p className="text-xs text-amber-400 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                    No subjects found. Please add a subject in Attendance page first!
                  </p>
                ) : (
                  <select
                    value={slotSubjectId}
                    onChange={e => setSlotSubjectId(e.target.value)}
                    className="input-field py-2.5 text-sm"
                  >
                    {availableSubjects.map(s => (
                      <option key={s.subject.id} value={s.subject.id} className="bg-[#0c0f18] text-white">
                        {s.subject.code} — {s.subject.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Start & End Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-surface-300 mb-1.5">Start Time</label>
                  <input
                    type="time"
                    value={slotStartTime}
                    onChange={e => setSlotStartTime(e.target.value)}
                    className="input-field py-2 text-sm font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-300 mb-1.5">End Time</label>
                  <input
                    type="time"
                    value={slotEndTime}
                    onChange={e => setSlotEndTime(e.target.value)}
                    className="input-field py-2 text-sm font-mono"
                    required
                  />
                </div>
              </div>

              {/* Room */}
              <div>
                <label className="block text-xs font-semibold text-surface-300 mb-1.5">Classroom / Lab</label>
                <input
                  type="text"
                  value={slotRoom}
                  onChange={e => setSlotRoom(e.target.value)}
                  placeholder="e.g. Lab 201, Room 402"
                  className="input-field py-2.5 text-sm"
                />
              </div>

              {formError && (
                <div className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                  {formError}
                </div>
              )}

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-outline flex-1 py-2.5 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || availableSubjects.length === 0}
                  className="btn-primary flex-1 py-2.5 text-xs font-semibold disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
