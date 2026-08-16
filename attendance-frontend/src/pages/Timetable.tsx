import { useState, useMemo, useEffect, useCallback } from 'react';
import { mockTimetable, mockSubjects } from '../data/mockData';
import { Clock, MapPin, User, Plus, Trash2, X, Calendar, Sparkles } from 'lucide-react';
import type { DayOfWeek } from '../types';
import { api, ApiTimetableEntry, ApiSubjectStats } from '../api/apiClient';
import { useAppContext } from '../App';

const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const dayShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Timetable() {
  const { refreshTrigger, triggerRefresh } = useAppContext();
  const todayIndex = Math.min(new Date().getDay() - 1, 5);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(
    todayIndex >= 0 ? days[todayIndex] : days[0]
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
    try {
      const data = await api.getTimetable(1);
      setLiveTimetable(data);
    } catch (err) {
      console.warn('Could not fetch timetable from backend:', err);
    }
  }, []);

  const fetchSubjects = useCallback(async () => {
    try {
      const data = await api.getSubjects(1);
      setAvailableSubjects(data);
      if (data.length > 0 && !slotSubjectId) {
        setSlotSubjectId(String(data[0].subject.id));
      }
    } catch (err) {
      console.warn('Could not fetch subjects:', err);
    }
  }, [slotSubjectId]);

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
    if (!confirm('Are you sure you want to remove this class from your timetable?')) return;
    try {
      await api.deleteTimetableEntry(id);
      triggerRefresh();
      fetchTimetable();
    } catch (err) {
      console.error('Failed to delete timetable entry:', err);
    }
  };

  const dayClasses = useMemo(() => {
    if (liveTimetable && liveTimetable.length > 0) {
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
      .map(entry => ({
        id: Number(entry.id),
        subjectId: Number(entry.subjectId),
        day: entry.day,
        startTime: entry.startTime,
        endTime: entry.endTime,
        room: entry.room,
        subject: mockSubjects.find(s => s.id === entry.subjectId)!,
      }));
  }, [liveTimetable, selectedDay]);

  return (
    <div className="page-container">
      {/* ─── Header + Add Button ────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Timetable</h1>
          <p className="text-xs sm:text-sm text-surface-400">Manage your weekly class schedule</p>
        </div>
        <button
          onClick={() => {
            setSlotDay(selectedDay);
            setIsAddModalOpen(true);
          }}
          className="btn-primary text-xs sm:text-sm py-2 px-3.5 flex items-center gap-1.5 font-semibold shadow-lg shadow-indigo-500/25"
        >
          <Plus className="w-4 h-4" />
          <span>Add Class Slot</span>
        </button>
      </div>

      {/* ─── Day Selector (Horizontally scrollable on mobile) ──── */}
      <div className="w-full overflow-x-auto no-scrollbar pb-1 mb-6">
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
                  relative px-3.5 sm:px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm
                  transition-all duration-250 flex items-center gap-1.5
                  ${isSelected
                    ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-surface-400 hover:text-white hover:bg-white/[0.04]'
                  }
                `}
              >
                <span>{dayShort[i]}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-surface-800 text-surface-500'
                }`}>
                  {count}
                </span>
                {isToday && !isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Classes List ───────────────── */}
      {dayClasses.length === 0 ? (
        <div className="glass-card p-12 text-center animate-slide-up">
          <div className="text-5xl mb-4">🎉</div>
          <p className="text-lg font-medium text-white mb-1">No classes scheduled on {selectedDay}</p>
          <p className="text-sm text-surface-500 mb-5">Tap "+ Add Class Slot" above to schedule a lecture</p>
          <button
            onClick={() => {
              setSlotDay(selectedDay);
              setIsAddModalOpen(true);
            }}
            className="btn-outline text-xs py-2 px-4 inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
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
                  className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl"
                  style={{ backgroundColor: item.subject?.color || '#6366f1' }}
                />

                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-surface-900/60 border border-surface-700/40 flex flex-col items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-indigo-400 mb-0.5" />
                    <span className="text-[10px] text-surface-400 font-mono">{item.startTime}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-bold text-white">{item.subject?.code}</h3>
                      <span className="text-xs text-surface-400 font-medium">• {item.subject?.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-surface-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-surface-600" />
                        <span>{item.startTime} – {item.endTime}</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-surface-600" />
                        <span>{item.room}</span>
                      </div>
                      {item.subject?.teacher && (
                        <>
                          <span>•</span>
                          <span>{item.subject.teacher}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Delete slot button */}
                <div className="flex items-center justify-end">
                  <button
                    onClick={() => handleDeleteSlot(item.id)}
                    className="p-2 rounded-xl text-surface-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/80 backdrop-blur-md animate-fade-in">
          <div className="glass-card gradient-border p-6 w-full max-w-md shadow-2xl relative animate-slide-up">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 text-surface-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Add Timetable Slot</h3>
                <p className="text-xs text-surface-400">Schedule a new recurring class</p>
              </div>
            </div>

            <form onSubmit={handleAddSlot} className="space-y-4">
              {/* Day */}
              <div>
                <label className="block text-xs font-medium text-surface-300 mb-1.5">Day of Week</label>
                <select
                  value={slotDay}
                  onChange={e => setSlotDay(e.target.value as DayOfWeek)}
                  className="input-field py-2.5 text-sm"
                >
                  {days.map(d => (
                    <option key={d} value={d} className="bg-surface-900 text-white">
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-medium text-surface-300 mb-1.5">Subject</label>
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
                      <option key={s.subject.id} value={s.subject.id} className="bg-surface-900 text-white">
                        {s.subject.code} — {s.subject.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Start & End Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-surface-300 mb-1.5">Start Time</label>
                  <input
                    type="time"
                    value={slotStartTime}
                    onChange={e => setSlotStartTime(e.target.value)}
                    className="input-field py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-300 mb-1.5">End Time</label>
                  <input
                    type="time"
                    value={slotEndTime}
                    onChange={e => setSlotEndTime(e.target.value)}
                    className="input-field py-2 text-sm"
                    required
                  />
                </div>
              </div>

              {/* Room */}
              <div>
                <label className="block text-xs font-medium text-surface-300 mb-1.5">Classroom / Lab</label>
                <input
                  type="text"
                  value={slotRoom}
                  onChange={e => setSlotRoom(e.target.value)}
                  placeholder="e.g. Lab 201, Room 402"
                  className="input-field py-2.5 text-sm"
                />
              </div>

              {formError && (
                <div className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                  {formError}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
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
