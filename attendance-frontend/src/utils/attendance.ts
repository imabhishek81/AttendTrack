// ==========================================
// Attendance Calculation Utilities
// ==========================================
// 🎓 Spring Boot Note:
// This EXACT same logic will be in your AttendanceService.java
// In Spring Boot:
//   @Service
//   public class AttendanceService {
//       public double calculatePercentage(int present, int total) { ... }
//       public int canMiss(int present, int total, double required) { ... }
//   }
//
// The SERVICE LAYER pattern means:
//   Controller → calls → Service → calls → Repository → queries → Database
//   Business logic (like these calculations) lives ONLY in the Service layer.
// ==========================================

import { SafetyStatus } from '../types';

/**
 * Calculate attendance percentage
 * 
 * Formula: (present / total) × 100
 * 
 * Spring Boot equivalent:
 *   public double calculatePercentage(int present, int total) {
 *       if (total == 0) return 100.0;
 *       return ((double) present / total) * 100;
 *   }
 */
export function calculatePercentage(present: number, total: number): number {
  if (total === 0) return 100;
  return (present / total) * 100;
}

/**
 * How many lectures can be missed while staying above required%
 * 
 * Logic: Keep incrementing missCount until percentage drops below required.
 * 
 * If you currently have 32/40 = 80%, and required is 75%:
 *   Miss 1: 32/41 = 78.0% ✅
 *   Miss 2: 32/42 = 76.2% ✅
 *   Miss 3: 32/43 = 74.4% ❌ → Can miss 2
 * 
 * Spring Boot equivalent:
 *   public int canMiss(int present, int total, double required) {
 *       int missCount = 0;
 *       while (((double) present / (total + missCount + 1)) * 100 >= required) {
 *           missCount++;
 *       }
 *       return missCount;
 *   }
 */
export function canMiss(present: number, total: number, required: number): number {
  let missCount = 0;
  while (calculatePercentage(present, total + missCount + 1) >= required) {
    missCount++;
  }
  return missCount;
}

/**
 * How many consecutive lectures must be attended to reach required%
 * 
 * If you have 27/38 = 71%, and need 75%:
 *   Attend 1: 28/39 = 71.8% ❌
 *   Attend 2: 29/40 = 72.5% ❌
 *   ...
 *   Attend 7: 34/45 = 75.6% ✅ → Need 7 lectures
 * 
 * Returns 0 if already above required.
 */
export function requiredToReach(present: number, total: number, required: number): number {
  if (calculatePercentage(present, total) >= required) return 0;
  
  let attend = 0;
  while (calculatePercentage(present + attend, total + attend) < required) {
    attend++;
    // Safety: if it takes more than 500 lectures, something is wrong
    if (attend > 500) return -1;
  }
  return attend;
}

/**
 * Get attendance status with safety margin
 * 
 * 🟢 SAFE    → percentage >= required + 5%
 * 🟡 WARNING → percentage >= required but < required + 5%
 * 🔴 DANGER  → percentage < required
 */
export function getStatus(percentage: number, required: number): SafetyStatus {
  if (percentage >= required + 5) return 'SAFE';
  if (percentage >= required) return 'WARNING';
  return 'DANGER';
}

/**
 * Project what attendance% would be after missing N more lectures
 * Returns an array of projections
 * 
 * Example output for present=32, total=40:
 * [
 *   { missed: 1, percentage: 78.0 },
 *   { missed: 2, percentage: 76.2 },
 *   ...
 * ]
 */
export function projectAfterMissing(
  present: number, 
  total: number, 
  maxMiss: number = 5
): { count: number; missed: number; percentage: number; safe: boolean }[] {
  const projections = [];
  for (let i = 1; i <= maxMiss; i++) {
    const pct = calculatePercentage(present, total + i);
    projections.push({
      count: i,
      missed: i,
      percentage: pct,
      safe: pct >= 75,
    });
  }
  return projections;
}

/**
 * Get the status color class for Tailwind
 */
export function getStatusColor(status: SafetyStatus): string {
  switch (status) {
    case 'SAFE': return 'text-emerald-400';
    case 'WARNING': return 'text-amber-400';
    case 'DANGER': return 'text-red-400';
  }
}

export function getStatusBgColor(status: SafetyStatus): string {
  switch (status) {
    case 'SAFE': return 'bg-emerald-400/10 border-emerald-400/20';
    case 'WARNING': return 'bg-amber-400/10 border-amber-400/20';
    case 'DANGER': return 'bg-red-400/10 border-red-400/20';
  }
}

export function getProgressBarColor(percentage: number, required: number): string {
  if (percentage >= required + 5) return 'bg-emerald-500';
  if (percentage >= required) return 'bg-amber-500';
  return 'bg-red-500';
}

export function getStatusEmoji(status: SafetyStatus): string {
  switch (status) {
    case 'SAFE': return '🟢';
    case 'WARNING': return '🟡';
    case 'DANGER': return '🔴';
  }
}

export function getStatusLabel(status: SafetyStatus): string {
  switch (status) {
    case 'SAFE': return 'Safe';
    case 'WARNING': return 'Warning';
    case 'DANGER': return 'Danger';
  }
}

/**
 * Format a date to readable format
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Get greeting based on time of day
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

/**
 * Get today's day name
 */
export function getTodayName(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' }) as string;
}

/**
 * Get the current date in ISO format
 */
export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}
