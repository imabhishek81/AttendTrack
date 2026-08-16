// ==========================================
// TypeScript Interfaces for Attendance Tracker
// ==========================================
// 🎓 Spring Boot Note:
// These TypeScript interfaces map directly to your future Java Entity classes.
// In Spring Boot, you'd create these as @Entity classes with @Id, @Column etc.
// Example: interface Subject → @Entity public class Subject { ... }
// ==========================================

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'CANCELLED';
export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
export type SafetyStatus = 'SAFE' | 'WARNING' | 'DANGER';

// Maps to: @Entity public class User
export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string; // Base64 data URL or Cloud image URL (e.g. /uploads/avatar.jpg)
  password?: string; // Never sent from backend in real app
}

// Maps to: @Entity public class Semester
export interface Semester {
  id: string;
  userId: string;
  semesterName: string;
  academicYear: string;
  requiredAttendance: number; // e.g., 75
}

// Maps to: @Entity public class Subject
export interface Subject {
  id: string;
  semesterId: string;
  name: string;
  code: string; // Short name like "DBMS"
  teacher: string;
  color: string; // For UI display
}

// Maps to: @Entity public class TimetableEntry
export interface TimetableEntry {
  id: string;
  subjectId: string;
  day: DayOfWeek;
  startTime: string; // "09:00"
  endTime: string;   // "10:00"
  room: string;
}

// Maps to: @Entity public class Attendance
export interface AttendanceRecord {
  id: string;
  subjectId: string;
  date: string; // ISO date string "2026-08-16"
  status: AttendanceStatus;
}

// ==========================================
// Computed/DTO types (not stored in DB)
// In Spring Boot, these become DTO classes in the dto/ package
// ==========================================

export interface SubjectAttendance {
  subject: Subject;
  present: number;
  absent: number;
  total: number;
  percentage: number;
  status: SafetyStatus;
  canMiss: number;
  requiredToReach: number; // 0 if already above required
}

export interface DailyClass {
  timetableEntry: TimetableEntry;
  subject: Subject;
  attendance?: AttendanceRecord; // undefined if not yet marked
}

export interface DayAttendance {
  date: string;
  records: {
    subject: Subject;
    status: AttendanceStatus;
  }[];
}

export interface MonthlyStats {
  month: string; // "June", "July"
  year: number;
  percentage: number;
}

export interface DashboardData {
  user: User;
  overallPercentage: number;
  overallStatus: SafetyStatus;
  todaysClasses: DailyClass[];
  subjectsAtRisk: number;
  requiredAttendance: number;
}
