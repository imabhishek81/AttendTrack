import { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../App';
import { getDemoSubjectSummaries } from '../data/mockData';
import { calculatePercentage, getStatus } from '../utils/attendance';
import StatusBadge from '../components/StatusBadge';
import CircularProgress from '../components/CircularProgress';
import { 
  ChevronRight, Plus, Edit3, Trash2, X, BookOpen, Sparkles, Check, Search, 
  ShieldCheck, AlertTriangle
} from 'lucide-react';
import { api, ApiSubjectStats } from '../api/apiClient';

const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#3b82f6', // Blue
];

export default function AttendancePage() {
  const { attendanceRecords, requiredAttendance, refreshTrigger, triggerRefresh, isDemoMode } = useAppContext();
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
    if (isDemoMode) {
      setLiveSubjects(null);
      return;
    }
    try {
      const data = await api.getSubjects(1, requiredAttendance);
      setLiveSubjects(data);
    } catch (err) {
      console.warn('Could not fetch subjects from backend, using local context:', err);
    }
  }, [requiredAttendance, isDemoMode]);

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

    if (isDemoMode) {
      setModalError('Subject changes are disabled in offline demo mode.');
      setIsSubmitting(false);
      return;
    }

    try {
      if (editingSubjectId) {
        await api.updateSubject(editingSubjectId, {
          name: subjectName.trim(),
          code: subjectCode.trim().toUpperCase(),
          teacher: subjectTeacher.trim() || 'Prof. TBD',
          color: subjectColor,
        });
      } else {
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
    if (isDemoMode) return;
    if (!confirm(`Are you sure you want to delete "${name}"? All associated timetable entries will also be removed.`)) return;

    try {
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

    return getDemoSubjectSummaries(attendanceRecords, requiredAttendance).map(s => ({
      subject: {
        id: s.subject.id,
        numericId: Number(s.subject.id),
        semesterId: s.subject.semesterId,
        name: s.subject.name,
        code: s.subject.code,
        teacher: s.subject.teacher,
        color: s.subject.color,
      },
      rawSubject: null as ApiSubjectStats | null,
      present: s.present,
      absent: s.absent,
      total: s.total,
      percentage: s.percentage,
      status: s.status,
      missable: s.canMiss,
      needed: s.requiredToReach,
    })).sort((a, b) => a.percentage - b.percentage);
  }, [liveSubjects, attendanceRecords, requiredAttendance]);

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
      {/* ─── Header + Add Subject CTA ──── */}
      <div className="flex items-center justify-between mb-7 animate-slide-up">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Attendance</h1>
          <p className="text-xs sm:text-sm text-surface-400 mt-0.5">Subject metrics, projections, and safe miss calculator</p>
        </div>
        <button
          onClick={openAddModal}
          className="btn-primary text-xs sm:text-sm py-2.5 px-4 flex items-center gap-2 font-semibold shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subject</span>
        </button>
      </div>

      {/* ─── Overall Attendance Summary Card ──── */}
      <div className="glass-card gradient-border p-6 sm:p-7 mb-7 animate-slide-up relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
          <CircularProgress
            percentage={overallStats.percentage}
            status={overallStats.status}
            size={135}
            strokeWidth={9}
          />
          <div className="text-center sm:text-left flex-1">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">Overall Attendance</h2>
            </div>
            <div className="flex items-center gap-3 justify-center sm:justify-start mb-3">
              <StatusBadge status={overallStats.status} />
              <span className="text-xs text-surface-400 font-medium">
                Target: <strong className="text-white">{requiredAttendance}%</strong>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-surface-400">
              <strong className="text-emerald-400 font-bold">{overallStats.totalPresent}</strong> attended out of <strong className="text-white font-bold">{overallStats.totalClasses}</strong> conducted lectures across {subjectStats.length} subjects.
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
            className="input-field pl-9.5 pr-8 py-2.5 text-xs sm:text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 active:scale-95 ${
              statusFilter === 'ALL'
                ? 'bg-indigo-500/[0.15] text-indigo-300 border border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.1)]'
                : 'bg-white/[0.03] text-surface-400 border border-white/[0.06] hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            All ({subjectStats.length})
          </button>
          <button
            onClick={() => setStatusFilter('SAFE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 active:scale-95 ${
              statusFilter === 'SAFE'
                ? 'bg-emerald-500/[0.15] text-emerald-300 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.1)]'
                : 'bg-white/[0.03] text-surface-400 border border-white/[0.06] hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Safe ({safeCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter('WARNING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 active:scale-95 ${
              statusFilter === 'WARNING'
                ? 'bg-amber-500/[0.15] text-amber-300 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.1)]'
                : 'bg-white/[0.03] text-surface-400 border border-white/[0.06] hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Warning ({warningCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter('DANGER')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 active:scale-95 ${
              statusFilter === 'DANGER'
                ? 'bg-rose-500/[0.15] text-rose-300 border border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.1)]'
                : 'bg-white/[0.03] text-surface-400 border border-white/[0.06] hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>Danger ({dangerCount})</span>
          </button>
        </div>
      </div>

      {/* ─── Subject List Header ───────── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title mb-0 flex items-center gap-2">
          <span>Subjects</span>
          <span className="text-xs text-surface-500 font-normal">({filteredSubjects.length})</span>
        </h2>
        <span className="text-xs text-surface-500 font-medium">Sorted by lowest attendance</span>
      </div>

      {/* ─── Subject Cards List ────────── */}
      {filteredSubjects.length === 0 ? (
        <div className="glass-card p-10 text-center animate-fade-in relative overflow-hidden">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-indigo-500/[0.08] border border-indigo-500/15 flex items-center justify-center text-indigo-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">No subjects found</h3>
          <p className="text-xs text-surface-400 mb-4 max-w-xs mx-auto">
            {searchQuery || statusFilter !== 'ALL'
              ? 'No subjects match your current search or filter criteria.'
              : 'Add your first subject to start tracking attendance!'}
          </p>
          {searchQuery || statusFilter !== 'ALL' ? (
            <button
              onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); }}
              className="btn-outline text-xs py-2 px-4 text-indigo-400 hover:text-indigo-300"
            >
              Clear filters
            </button>
          ) : (
            <button
              onClick={openAddModal}
              className="btn-primary text-xs py-2.5 px-5 inline-flex items-center gap-2 font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Subject</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSubjects.map(({ subject, present, total, percentage, status, missable, needed, rawSubject }, index) => (
            <div
              key={subject.id}
              onClick={() => navigate(`/subject/${subject.id}`)}
              className="glass-card-hover p-4 sm:p-5 cursor-pointer animate-slide-up relative overflow-hidden group"
              style={{ animationDelay: `${index * 0.04}s` }}
            >
              {/* Left vertical color pill */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl transition-all duration-300 group-hover:w-2"
                style={{ backgroundColor: subject.color }}
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pl-2">
                {/* Left: Subject Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border"
                    style={{
                      backgroundColor: `${subject.color}18`,
                      color: subject.color,
                      borderColor: `${subject.color}35`
                    }}
                  >
                    {subject.code.slice(0, 3)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-white text-sm sm:text-base tracking-tight truncate group-hover:text-indigo-300 transition-colors">
                      {subject.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-surface-400 font-medium truncate">{subject.teacher}</span>
                      <span className="text-surface-700">•</span>
                      <span className="text-xs text-surface-400 font-mono font-medium shrink-0">
                        {present}/{total} attended
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Stats & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3.5 pt-2 sm:pt-0 border-t border-white/[0.04] sm:border-t-0">
                  {/* Safe Miss / Needed Pill */}
                  <div className="text-right">
                    {total === 0 ? (
                      <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-white/[0.04] text-surface-400 border border-white/[0.06]">
                        No data
                      </span>
                    ) : missable > 0 ? (
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/[0.08] text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.06)]">
                        Can miss {missable}
                      </span>
                    ) : needed > 0 ? (
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-rose-500/[0.08] text-rose-400 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.06)]">
                        Attend next {needed}
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-500/[0.08] text-amber-400 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.06)]">
                        On the edge
                      </span>
                    )}
                  </div>

                  {/* Percentage */}
                  <div className="text-right min-w-[58px]">
                    <span className={`text-lg sm:text-xl font-bold tracking-tight ${
                      status === 'SAFE' ? 'text-emerald-400' :
                      status === 'WARNING' ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {percentage.toFixed(1)}%
                    </span>
                  </div>

                  {/* Edit & Delete Action Buttons */}
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={(e) => openEditModal(rawSubject || {
                        subject: { id: subject.numericId, name: subject.name, code: subject.code, teacher: subject.teacher, color: subject.color },
                        present, absent: total - present, total, percentage, status, canMiss: missable, requiredToReach: needed,
                      }, e)}
                      className="p-2 rounded-xl text-surface-400 hover:text-white hover:bg-white/[0.06] transition-all active:scale-95"
                      title="Edit Subject"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteSubject(subject.numericId, subject.name, e)}
                      className="p-2 rounded-xl text-surface-400 hover:text-rose-400 hover:bg-rose-500/[0.1] transition-all active:scale-95"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#06070b]/80 backdrop-blur-xl animate-fade-in">
          <div className="glass-card gradient-border p-6 sm:p-7 w-full max-w-md shadow-2xl relative animate-slide-up">
            <button
              onClick={() => setIsSubjectModalOpen(false)}
              className="absolute right-4 top-4 text-surface-500 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/[0.08] border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {editingSubjectId ? 'Edit Subject' : 'Add New Subject'}
                </h3>
                <p className="text-xs text-surface-400">Configure details, color theme, and past records</p>
              </div>
            </div>

            <form onSubmit={handleSaveSubject} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-surface-300 mb-1.5">Subject Name</label>
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
                  <label className="block text-xs font-semibold text-surface-300 mb-1.5">Short Code</label>
                  <input
                    type="text"
                    value={subjectCode}
                    onChange={e => setSubjectCode(e.target.value)}
                    placeholder="e.g. OS"
                    className="input-field py-2.5 text-sm uppercase font-mono font-bold"
                    maxLength={8}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-300 mb-1.5">Teacher Name</label>
                  <input
                    type="text"
                    value={subjectTeacher}
                    onChange={e => setSubjectTeacher(e.target.value)}
                    placeholder="e.g. Prof. Mehta"
                    className="input-field py-2.5 text-sm"
                  />
                </div>
              </div>

              {/* Color Theme */}
              <div>
                <label className="block text-xs font-semibold text-surface-300 mb-2">Subject Color Theme</label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSubjectColor(color)}
                      className={`w-7 h-7 rounded-xl transition-all relative flex items-center justify-center ${
                        subjectColor === color ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#0c0f18]' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {subjectColor === color && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Past Attendance Data */}
              {!editingSubjectId && (
                <div className="p-3.5 rounded-xl bg-indigo-500/[0.04] border border-indigo-500/15 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                      <span>🗓️</span> Past Attendance Data (Optional)
                    </span>
                    <span className="text-[10px] text-surface-500 font-medium">e.g. Started July 1</span>
                  </div>
                  <p className="text-[11px] text-surface-400 leading-relaxed">
                    If this semester has already started, enter past lectures held and attended so far:
                  </p>
                  <div className="grid grid-cols-2 gap-2.5 pt-0.5">
                    <div>
                      <label className="block text-[11px] font-medium text-surface-300 mb-1">Conducted</label>
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
                      <label className="block text-[11px] font-medium text-surface-300 mb-1">Attended</label>
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
                <div className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                  {modalError}
                </div>
              )}

              <div className="flex items-center gap-2.5 pt-2">
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
