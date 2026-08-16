package com.attendtrack.service;

import com.attendtrack.dto.ProjectionItemDTO;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * ==========================================================
 * 🎓 Spring Boot Learning Note: @Service & Business Logic Layer
 * ==========================================================
 * - @Service registers this class as a Spring Bean (managed object).
 * - Core mathematical engine for attendance calculation.
 * - Kept decoupled and unit-testable!
 * ==========================================================
 */
@Service
public class AttendanceCalculationService {

    /**
     * Calculate attendance percentage: (present / total) * 100
     */
    public double calculatePercentage(long present, long total) {
        if (total <= 0) return 100.0;
        double pct = ((double) present / total) * 100.0;
        return Math.round(pct * 10.0) / 10.0; // 1 decimal place
    }

    /**
     * Calculate how many consecutive lectures a student can safely miss
     * while staying at or above requiredAttendance.
     */
    public int calculateCanMiss(long present, long total, double requiredAttendance) {
        if (total <= 0) return 0;
        int missCount = 0;
        while (calculatePercentage(present, total + missCount + 1) >= requiredAttendance) {
            missCount++;
            if (missCount > 100) break; // safety guard
        }
        return missCount;
    }

    /**
     * Calculate how many consecutive lectures a student must attend
     * to recover and reach requiredAttendance (when currently below).
     */
    public int calculateRequiredToReach(long present, long total, double requiredAttendance) {
        if (calculatePercentage(present, total) >= requiredAttendance) return 0;
        
        int needed = 0;
        while (calculatePercentage(present + needed, total + needed) < requiredAttendance) {
            needed++;
            if (needed > 500) return -1; // safety cap
        }
        return needed;
    }

    /**
     * Return status string: SAFE / WARNING / DANGER
     */
    public String getStatus(double percentage, double requiredAttendance) {
        if (percentage >= requiredAttendance + 5.0) return "SAFE";
        if (percentage >= requiredAttendance) return "WARNING";
        return "DANGER";
    }

    /**
     * Generate projection list: what % the student will have after missing 1, 2, 3... lectures.
     */
    public List<ProjectionItemDTO> projectAfterMissing(long present, long total, double requiredAttendance, int maxCount) {
        List<ProjectionItemDTO> projections = new ArrayList<>();
        for (int i = 1; i <= maxCount; i++) {
            double projectedPct = calculatePercentage(present, total + i);
            boolean safe = projectedPct >= requiredAttendance;
            projections.add(new ProjectionItemDTO(i, projectedPct, safe));
        }
        return projections;
    }

    /**
     * Generate recovery projection list: what % the student will reach after attending 1, 2, 3... lectures.
     */
    public List<ProjectionItemDTO> projectRecovery(long present, long total, double requiredAttendance, int neededCount) {
        List<ProjectionItemDTO> projections = new ArrayList<>();
        int countToProject = Math.min(Math.max(neededCount + 2, 6), 10);
        for (int i = 1; i <= countToProject; i++) {
            double projectedPct = calculatePercentage(present + i, total + i);
            boolean safe = projectedPct >= requiredAttendance;
            projections.add(new ProjectionItemDTO(i, projectedPct, safe));
        }
        return projections;
    }
}
