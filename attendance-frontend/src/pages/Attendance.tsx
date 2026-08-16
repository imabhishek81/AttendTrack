import { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../App';
import { mockSubjects } from '../data/mockData';
import { calculatePercentage, getStatus, canMiss, requiredToReach } from '../utils/attendance';
import StatusBadge from '../components/StatusBadge';
import CircularProgress from '../components/CircularProgress';
import { 
  ChevronRight, TrendingUp, TrendingDown, Minus, ArrowUpRight, 
  Plus, Edit3, Trash2, X, BookOpen, Sparkles, Check, Search, Filter,
  Shield, AlertTriangle
} from 'lucide-react';
import { api, ApiSubjectStats } from '../api/apiClient';

const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#8b5cf6', // Purple
  '#ef4444', // Red
  '#3b82f6', // Blue
];

export default function AttendancePage() {
  const { attendanceRecords, requiredAttendance, refreshTrigger, triggerRefresh } = useAppContext();
  const navigate = useNavigate();
  const [liveSubjects, setLiveSubjects] = useState<ApiSubjectStats[] | null>(null);

  // Modal states
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<number | null>(null);
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectTeacher, setSubjectTeacher] = useState('');
  const [subjectColor, setSubjectColor] = useState(PRESET_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SAFE' | 'WARNING' | 'DANGER'>('ALL');
  const [initialTotal, setInitialTotal] = useState<string>('');
  const [initialAttended, setInitialAttended] = useState<string>('');

  const loadSubjects = useCallback(async () => {
    try {
      const data = await api.getSubjects(1, requiredAttendance);
      setLiveSubjects(data);
    } catch (err) {
      console.warn('Could not fetch subjects from backend, using local context:', err);
    }
  }, [requiredAttendance]);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects, refreshTrigger]);

  const openAddModal = () => {
    setEditingSubjectId(null);
    setSubjectName('');
    setSubjectCode('');
    setSubjectTeacher('');
    setSubjectColor(PRESET_COLORS[0]);
    setInitialTotal('');
    setInitialAttended('');
    setModalError('');
    setIsSubjectModalOpen(true);
  };

  const openEditModal = (s: ApiSubjectStats, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSubjectId(s.subject.id);
    setSubjectName(s.subject.name);
    setSubjectCode(s.subject.code);
    setSubjectTeacher(s.subject.teacher);
    setSubjectColor(s.subject.color || PRESET_COLORS[0]);
    setModalError('');
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim() || !subjectCode.trim()) {
      setModalError('Please enter both subject name and short code.');
      return;
    }

    setIsSubmitting(true);
    setModalError('');

    try {
      if (editingSubjectId) {
        // Update existing subject
        await api.updateSubject(editingSubjectId, {
          name: subjectName.trim(),
          code: subjectCode.trim().toUpperCase(),
          teacher: subjectTeacher.trim() || 'Prof. TBD',
          color: subjectColor,
        });
      } else {
        // Create new subject with optional past historical data
        const totalNum = initialTotal.trim() ? parseInt(initialTotal, 10) : undefined;
        const attendedNum = initialAttended.trim() ? parseInt(initialAttended, 10) : undefined;
        await api.createSubject(1, {
          name: subjectName.trim(),
          code: subjectCode.trim().toUpperCase(),
          teacher: subjectTeacher.trim() || 'Prof. TBD',
          color: subjectColor,
          initialTotal: totalNum,
          initialAttended: attendedNum,
        });
      }

      setIsSubjectModalOpen(false);
      triggerRefresh();
      loadSubjects();
    } catch (err: any) {
      setModalError(err.message || 'Failed to save subject.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubject = async (id: number, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${name}"? All associated timetable entries will also be removed.`)) return;

    try {
      // Instant optimistic UI update
      setLiveSubjects(prev => prev ? prev.filter(s => s.subject.id !== id) : []);
      await api.deleteSubject(id);
      triggerRefresh();
      loadSubjects();
    } catch (err) {
      console.error('Failed to delete subject:', err);
      loadSubjects();
    }
  };

  const subjectStats = useMemo(() => {
    if (liveSubjects) {
      return liveSubjects.map(s => ({
        subject: {
          id: String(s.subject.id),
          numericId: s.subject.id,
          semesterId: '1',
          name: s.subject.name,
          code: s.subject.code,
          teacher: s.subject.teacher,
          color: s.subject.color,
        },
        rawSubject: s,
        present: s.present,
        absent: s.absent,
        total: s.total,
        percentage: s.percentage,
        status: s.status,
        missable: s.canMiss,
        needed: s.requiredToReach,
      })).sort((a, b) => a.percentage - b.percentage);
    }

    return [];
  }, [liveSubjects]);

  const overallStats = useMemo(() => {
    const totalPresent = subjectStats.reduce((sum, s) => sum + s.present, 0);
    const totalClasses = subjectStats.reduce((sum, s) => sum + s.total, 0);
    const percentage = calculatePercentage(totalPresent, totalClasses);
    const status = getStatus(percentage, requiredAttendance);
    return { totalPresent, totalClasses, percentage, status };
  }, [subjectStats, requiredAttendance]);

  const safeCount = subjectStats.filter(s => s.status === 'SAFE').length;
  const warningCount = subjectStats.filter(s => s.status === 'WARNING').length;
  const dangerCount = subjectStats.filter(s => s.status === 'DANGER').length;

  const filteredSubjects = useMemo(() => {
    return subjectStats.filter(s => {
      const matchesSearch = 
        s.subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.subject.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.subject.teacher.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'ALL' ? true : s.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [subjectStats, searchQuery, statusFilter]);

  return (
    <div className="page-container">
      {/* ─── Header + Add Subject Button ─── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Attendance</h1>
          <p className="text-xs sm:text-sm text-surface-400">Track subject stats and safe miss calculations</p>
        </div>
        <button
          onClick={openAddModal}
          className="btn-primary text-xs sm:text-sm py-2 px-3.5 flex items-center gap-1.5 font-semibold shadow-lg shadow-indigo-500/25"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subject</span>
        </button>
      </div>

      {/* ─── Overall Card ──────────────── */}
      <div className="glass-card gradient-border p-6 mb-6 animate-slide-up">
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

      {/* ─── Search & Status Filters ───── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subjects or teachers..."
            className="w-full bg-surface-900/60 border border-surface-700/60 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-white placeholder-surface-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-500 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
              statusFilter === 'ALL'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'bg-surface-900/40 text-surface-400 border border-surface-800 hover:text-white'
            }`}
          >
            All ({subjectStats.length})
          </button>
          <button
            onClick={() => setStatusFilter('SAFE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 flex items-center gap-1 ${
              statusFilter === 'SAFE'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-surface-900/40 text-surface-400 border border-surface-800 hover:text-white'
            }`}
          >
            <span>🟢 Safe</span> ({safeCount})
          </button>
          <button
            onClick={() => setStatusFilter('WARNING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 flex items-center gap-1 ${
              statusFilter === 'WARNING'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-surface-900/40 text-surface-400 border border-surface-800 hover:text-white'
            }`}
          >
            <span>🟡 Warning</span> ({warningCount})
          </button>
          <button
            onClick={() => setStatusFilter('DANGER')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 flex items-center gap-1 ${
              statusFilter === 'DANGER'
                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                : 'bg-surface-900/40 text-surface-400 border border-surface-800 hover:text-white'
            }`}
          >
            <span>🔴 Danger</span> ({dangerCount})
          </button>
        </div>
      </div>

      {/* ─── Subject List ──────────────── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title mb-0">
          Subjects ({filteredSubjects.length})
        </h2>
        <span className="text-xs text-surface-500">Sorted by lowest attendance</span>
      </div>

      {filteredSubjects.length === 0 ? (
        <div className="glass-card p-10 text-center animate-fade-in">
          <BookOpen className="w-10 h-10 text-surface-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white mb-1">No subjects found</h3>
          <p className="text-xs text-surface-500 mb-4">
            {searchQuery || statusFilter !== 'ALL'
              ? 'No subjects match your current search or filter criteria.'
              : 'Add your first subject to start tracking!'}
          </p>
          {(searchQuery || statusFilter !== 'ALL') && (
            <button
              onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); }}
              className="btn-outline text-xs py-1.5 px-3 text-indigo-400 hover:text-indigo-300"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSubjects.map(({ subject, present, absent, total, percentage, status, missable, needed, rawSubject }, index) => (
          <div
            key={subject.id}
            onClick={() => navigate(`/subject/${subject.id}`)}
            className="glass-card-hover p-4 sm:p-5 cursor-pointer animate-slide-up relative overflow-hidden group"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {/* Left color bar */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl"
              style={{ backgroundColor: subject.color }}
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Left: Subject Info */}
              <div className="flex items-center gap-3.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-md"
                  style={{ backgroundColor: `${subject.color}20`, color: subject.color }}
                >
                  {subject.code}
                </div>
                <div>
                  <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                    {subject.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-surface-500">{subject.teacher}</span>
                    <span className="text-xs text-surface-700">•</span>
                    <span className="text-xs text-surface-500">
                      {present}/{total} attended
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Stats & Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t border-white/[0.04] sm:border-t-0">
                {/* Safe Miss / Needed Pill */}
                <div className="text-right">
                  {missable > 0 ? (
                    <span className="badge badge-safe text-[11px] py-0.5 px-2.5">
                      Can miss {missable}
                    </span>
                  ) : needed > 0 ? (
                    <span className="badge badge-danger text-[11px] py-0.5 px-2.5">
                      Attend next {needed}
                    </span>
                  ) : (
                    <span className="badge badge-warning text-[11px] py-0.5 px-2.5">
                      On the edge
                    </span>
                  )}
                </div>

                {/* Percentage */}
                <div className="text-right min-w-[52px]">
                  <span className={`text-base sm:text-lg font-bold ${
                    status === 'SAFE' ? 'text-emerald-400' :
                    status === 'WARNING' ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {percentage.toFixed(1)}%
                  </span>
                </div>

                {/* Action buttons (Edit & Delete) - Always visible */}
                <div className="flex items-center gap-1.5 ml-1" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={(e) => openEditModal(rawSubject || {
                      subject: { id: subject.numericId, name: subject.name, code: subject.code, teacher: subject.teacher, color: subject.color },
                      present, absent, total, percentage, status, canMiss: missable, requiredToReach: needed,
                    }, e)}
                    className="p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-surface-700/60 transition-all active:scale-95"
                    title="Edit Subject"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteSubject(subject.numericId, subject.name, e)}
                    className="p-1.5 rounded-lg text-surface-400 hover:text-rose-400 hover:bg-rose-500/15 transition-all active:scale-95"
                    title="Delete Subject"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <ChevronRight className="w-4 h-4 text-surface-600 group-hover:text-white group-hover:translate-x-0.5 transition-all hidden sm:block" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )}

      {/* ─── Add / Edit Subject Modal ────── */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/80 backdrop-blur-md animate-fade-in">
          <div className="glass-card gradient-border p-6 w-full max-w-md shadow-2xl relative animate-slide-up">
            <button
              onClick={() => setIsSubjectModalOpen(false)}
              className="absolute right-4 top-4 text-surface-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingSubjectId ? 'Edit Subject' : 'Add New Subject'}
                </h3>
                <p className="text-xs text-surface-400">Configure subject details and color</p>
              </div>
            </div>

            <form onSubmit={handleSaveSubject} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-surface-300 mb-1.5">Subject Name</label>
                <input
                  type="text"
                  value={subjectName}
                  onChange={e => setSubjectName(e.target.value)}
                  placeholder="e.g. Operating Systems"
                  className="input-field py-2.5 text-sm"
                  required
                />
              </div>

              {/* Short Code & Teacher */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-surface-300 mb-1.5">Short Code</label>
                  <input
                    type="text"
                    value={subjectCode}
                    onChange={e => setSubjectCode(e.target.value)}
                    placeholder="e.g. OS"
                    className="input-field py-2.5 text-sm uppercase"
                    maxLength={8}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-300 mb-1.5">Teacher Name</label>
                  <input
                    type="text"
                    value={subjectTeacher}
                    onChange={e => setSubjectTeacher(e.target.value)}
                    placeholder="e.g. Prof. Mehta"
                    className="input-field py-2.5 text-sm"
                  />
                </div>
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-xs font-medium text-surface-300 mb-2">Subject Color Theme</label>
                <div className="flex items-center gap-2.5">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSubjectColor(color)}
                      className={`w-7 h-7 rounded-xl transition-all relative flex items-center justify-center ${
                        subjectColor === color ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-surface-900' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {subjectColor === color && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Past Attendance Data (Semester already started) */}
              {!editingSubjectId && (
                <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/15 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                      <span>🗓️</span> Past Attendance Data (Optional)
                    </span>
                    <span className="text-[10px] text-surface-400 font-medium">e.g. Started July 1</span>
                  </div>
                  <p className="text-[11px] text-surface-400 leading-relaxed">
                    If this subject has already started, enter past lectures held and attended so far:
                  </p>
                  <div className="grid grid-cols-2 gap-2.5 pt-0.5">
                    <div>
                      <label className="block text-[11px] font-medium text-surface-300 mb-1">Lectures Conducted</label>
                      <input
                        type="number"
                        min="0"
                        value={initialTotal}
                        onChange={e => setInitialTotal(e.target.value)}
                        placeholder="e.g. 24"
                        className="input-field py-2 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-surface-300 mb-1">Lectures Attended</label>
                      <input
                        type="number"
                        min="0"
                        max={initialTotal ? Number(initialTotal) : undefined}
                        value={initialAttended}
                        onChange={e => setInitialAttended(e.target.value)}
                        placeholder="e.g. 20"
                        className="input-field py-2 text-xs font-mono"
                      />
                    </div>
                  </div>
                  {initialTotal && Number(initialTotal) > 0 && (
                    <div className="pt-1.5 flex items-center justify-between text-xs border-t border-indigo-500/10">
                      <span className="text-surface-400">Starting Attendance:</span>
                      <span className="font-bold text-emerald-400 font-mono">
                        {((Number(initialAttended || 0) / Number(initialTotal)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              )}

              {modalError && (
                <div className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                  {modalError}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="btn-outline flex-1 py-2.5 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex-1 py-2.5 text-xs font-semibold disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingSubjectId ? 'Update Subject' : 'Add Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
