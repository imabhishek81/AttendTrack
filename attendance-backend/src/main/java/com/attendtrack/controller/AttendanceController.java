package com.attendtrack.controller;

import com.attendtrack.dto.MarkAttendanceRequestDTO;
import com.attendtrack.dto.SubjectDetailResponseDTO;
import com.attendtrack.entity.AttendanceRecord;
import com.attendtrack.service.AttendanceService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    /**
     * POST /api/attendance
     * Body: { subjectId: 1, date: "2026-08-16", status: "PRESENT" }
     */
    @PostMapping
    public ResponseEntity<AttendanceRecord> markAttendance(@Valid @RequestBody MarkAttendanceRequestDTO request) {
        AttendanceRecord record = attendanceService.markAttendance(request);
        return ResponseEntity.ok(record);
    }

    /**
     * GET /api/attendance/subject/{id}?required=75.0
     * Detailed subject view with "Can I Miss" calculations and full history
     */
    @GetMapping("/subject/{id}")
    public ResponseEntity<SubjectDetailResponseDTO> getSubjectDetail(
            @PathVariable Long id,
            @RequestParam(name = "required", defaultValue = "75.0") double requiredAttendance) {
        SubjectDetailResponseDTO detail = attendanceService.getSubjectDetail(id, requiredAttendance);
        return ResponseEntity.ok(detail);
    }

    /**
     * GET /api/attendance/calendar?semesterId=1&startDate=2026-08-01&endDate=2026-08-31
     */
    @GetMapping("/calendar")
    public ResponseEntity<List<AttendanceRecord>> getCalendarRecords(
            @RequestParam(name = "semesterId", defaultValue = "1") Long semesterId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<AttendanceRecord> records = attendanceService.getCalendarRecords(semesterId, startDate, endDate);
        return ResponseEntity.ok(records);
    }
}
