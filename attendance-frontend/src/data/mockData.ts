// ==========================================
// Mock Data for UI Prototype
// ==========================================
// 🎓 Spring Boot Note:
// In the real app, ALL this data comes from your MySQL database
// via REST API calls. This file simulates what the backend returns.
//
// Each array here corresponds to a database TABLE:
//   mockSubjects  → SELECT * FROM subjects WHERE semester_id = ?
//   mockTimetable → SELECT * FROM timetable WHERE subject_id IN (...)
//   mockAttendance → SELECT * FROM attendance WHERE subject_id IN (...)
//
// When we build Spring Boot (Stage 3), your Repository methods will
// replace these arrays. For example:
//   @Repository
//   public interface SubjectRepository extends JpaRepository<Subject, Long> {
//       List<Subject> findBySemesterId(Long semesterId);
//   }
// ==========================================

import { 
  User, Semester, Subject, TimetableEntry, 
  AttendanceRecord, DayOfWeek 
} from '../types';

// ─── User ────────────────────────────────
export const mockUser: User = {
  id: '1',
  name: 'Abhishek',
  email: 'abhishek@example.com',
};

// ─── Semester ────────────────────────────
export const mockSemester: Semester = {
  id: '1',
  userId: '1',
  semesterName: '5th Semester',
  academicYear: '2026-27',
  requiredAttendance: 75,
};

// ─── Subjects ────────────────────────────
export const mockSubjects: Subject[] = [
  {
    id: '1',
    semesterId: '1',
    name: 'Database Management System',
    code: 'DBMS',
    teacher: 'Prof. Sharma',
    color: '#6366f1', // Indigo
  },
  {
    id: '2',
    semesterId: '1',
    name: 'Java Programming',
    code: 'Java',
    teacher: 'Prof. Patel',
    color: '#f59e0b', // Amber
  },
  {
    id: '3',
    semesterId: '1',
    name: 'Software Engineering',
    code: 'SE',
    teacher: 'Prof. Gupta',
    color: '#10b981', // Emerald
  },
  {
    id: '4',
    semesterId: '1',
    name: 'Internet of Things',
    code: 'IoT',
    teacher: 'Prof. Kumar',
    color: '#ec4899', // Pink
  },
  {
    id: '5',
    semesterId: '1',
    name: 'Computer Networks',
    code: 'CN',
    teacher: 'Prof. Singh',
    color: '#06b6d4', // Cyan
  },
];

// ─── Timetable ────────────────────────────
export const mockTimetable: TimetableEntry[] = [
  // Monday
  { id: '1', subjectId: '1', day: 'Monday', startTime: '09:00', endTime: '10:00', room: 'C-204' },
  { id: '2', subjectId: '2', day: 'Monday', startTime: '10:00', endTime: '11:00', room: 'C-204' },
  { id: '3', subjectId: '3', day: 'Monday', startTime: '11:00', endTime: '12:00', room: 'B-102' },
  { id: '4', subjectId: '4', day: 'Monday', startTime: '14:00', endTime: '15:00', room: 'Lab-1' },
  
  // Tuesday
  { id: '5', subjectId: '5', day: 'Tuesday', startTime: '09:00', endTime: '10:00', room: 'A-301' },
  { id: '6', subjectId: '1', day: 'Tuesday', startTime: '10:00', endTime: '11:00', room: 'C-204' },
  { id: '7', subjectId: '2', day: 'Tuesday', startTime: '11:00', endTime: '12:00', room: 'C-204' },
  { id: '8', subjectId: '3', day: 'Tuesday', startTime: '14:00', endTime: '15:00', room: 'B-102' },
  
  // Wednesday
  { id: '9', subjectId: '4', day: 'Wednesday', startTime: '09:00', endTime: '10:00', room: 'Lab-1' },
  { id: '10', subjectId: '5', day: 'Wednesday', startTime: '10:00', endTime: '11:00', room: 'A-301' },
  { id: '11', subjectId: '1', day: 'Wednesday', startTime: '11:00', endTime: '12:00', room: 'C-204' },
  { id: '12', subjectId: '2', day: 'Wednesday', startTime: '14:00', endTime: '15:00', room: 'C-204' },
  
  // Thursday
  { id: '13', subjectId: '3', day: 'Thursday', startTime: '09:00', endTime: '10:00', room: 'B-102' },
  { id: '14', subjectId: '4', day: 'Thursday', startTime: '10:00', endTime: '11:00', room: 'Lab-1' },
  { id: '15', subjectId: '5', day: 'Thursday', startTime: '11:00', endTime: '12:00', room: 'A-301' },
  { id: '16', subjectId: '1', day: 'Thursday', startTime: '14:00', endTime: '15:00', room: 'C-204' },
  
  // Friday
  { id: '17', subjectId: '2', day: 'Friday', startTime: '09:00', endTime: '10:00', room: 'C-204' },
  { id: '18', subjectId: '3', day: 'Friday', startTime: '10:00', endTime: '11:00', room: 'B-102' },
  { id: '19', subjectId: '4', day: 'Friday', startTime: '11:00', endTime: '12:00', room: 'Lab-1' },
  { id: '20', subjectId: '5', day: 'Friday', startTime: '14:00', endTime: '15:00', room: 'A-301' },
  
  // Saturday
  { id: '21', subjectId: '1', day: 'Saturday', startTime: '09:00', endTime: '10:00', room: 'C-204' },
  { id: '22', subjectId: '2', day: 'Saturday', startTime: '10:00', endTime: '11:00', room: 'C-204' },
];

// ─── Attendance Records ──────────────────
// Generate realistic attendance data for the past ~2 months
function generateAttendanceRecords(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  let recordId = 1;
  
  // Generate records from June 1 to today (Aug 16, 2026)
  const startDate = new Date('2026-06-01');
  const endDate = new Date('2026-08-15'); // Yesterday
  
  const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayIndexMap: Record<DayOfWeek, number> = {
    'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
    'Thursday': 4, 'Friday': 5, 'Saturday': 6,
  };
  
  // Per-subject absence rates (to create varied percentages)
  const absenceRates: Record<string, number> = {
    '1': 0.18,  // DBMS: ~82%
    '2': 0.29,  // Java: ~71%
    '3': 0.24,  // SE: ~76%
    '4': 0.12,  // IoT: ~88%
    '5': 0.20,  // CN: ~80%
  };
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay(); // 0=Sun, 1=Mon, ...
    if (dayOfWeek === 0) continue; // Skip Sunday
    
    const dayName = days[dayOfWeek - 1];
    if (!dayName) continue;
    
    const dateStr = d.toISOString().split('T')[0];
    
    // Find classes on this day
    const todaysClasses = mockTimetable.filter(t => t.day === dayName);
    
    for (const cls of todaysClasses) {
      const absenceRate = absenceRates[cls.subjectId] || 0.2;
      const isAbsent = Math.random() < absenceRate;
      
      records.push({
        id: String(recordId++),
        subjectId: cls.subjectId,
        date: dateStr,
        status: isAbsent ? 'ABSENT' : 'PRESENT',
      });
    }
  }
  
  return records;
}

export const mockAttendance: AttendanceRecord[] = generateAttendanceRecords();

// ─── Helper: Get timetable for a specific day ──────
export function getTimetableForDay(day: DayOfWeek): TimetableEntry[] {
  return mockTimetable
    .filter(t => t.day === day)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

// ─── Helper: Get subject by ID ──────────────────────
export function getSubjectById(id: string): Subject | undefined {
  return mockSubjects.find(s => s.id === id);
}

// ─── Helper: Get attendance for a subject ───────────
export function getAttendanceForSubject(subjectId: string): AttendanceRecord[] {
  return mockAttendance
    .filter(a => a.subjectId === subjectId)
    .sort((a, b) => b.date.localeCompare(a.date)); // newest first
}

// ─── Helper: Get attendance for a date ──────────────
export function getAttendanceForDate(date: string): AttendanceRecord[] {
  return mockAttendance.filter(a => a.date === date);
}

// ─── Helper: Calculate subject stats ────────────────
export function getSubjectStats(subjectId: string) {
  const records = mockAttendance.filter(a => a.subjectId === subjectId);
  const present = records.filter(r => r.status === 'PRESENT').length;
  const absent = records.filter(r => r.status === 'ABSENT').length;
  const total = records.length;
  return { present, absent, total };
}
