package com.attendtrack.service;

import com.attendtrack.dto.MarkAttendanceRequestDTO;
import com.attendtrack.dto.ProjectionItemDTO;
import com.attendtrack.dto.SubjectDetailResponseDTO;
import com.attendtrack.entity.AttendanceRecord;
import com.attendtrack.entity.AttendanceStatus;
import com.attendtrack.entity.Subject;
import com.attendtrack.exception.ResourceNotFoundException;
import com.attendtrack.repository.AttendanceRepository;
import com.attendtrack.repository.SubjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final SubjectRepository subjectRepository;
    private final AttendanceCalculationService calculationService;

    public AttendanceService(
            AttendanceRepository attendanceRepository,
            SubjectRepository subjectRepository,
            AttendanceCalculationService calculationService) {
        this.attendanceRepository = attendanceRepository;
        this.subjectRepository = subjectRepository;
        this.calculationService = calculationService;
    }

    /**
     * Mark or update attendance for a subject on a specific date.
     */
    @Transactional
    public AttendanceRecord markAttendance(MarkAttendanceRequestDTO request) {
        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + request.getSubjectId()));

        Optional<AttendanceRecord> existing = attendanceRepository.findBySubjectIdAndDate(request.getSubjectId(), request.getDate());

        AttendanceRecord record;
        if (existing.isPresent()) {
            record = existing.get();
            record.setStatus(request.getStatus());
        } else {
            record = new AttendanceRecord(subject, request.getDate(), request.getStatus());
        }

        return attendanceRepository.save(record);
    }

    /**
     * Get subject detail view with complete "Can I Miss" projections and history.
     */
    public SubjectDetailResponseDTO getSubjectDetail(Long subjectId, double requiredAttendance) {
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + subjectId));

        List<AttendanceRecord> history = attendanceRepository.findBySubjectIdOrderByDateDesc(subjectId);
        long present = history.stream().filter(r -> r.getStatus() == AttendanceStatus.PRESENT).count();
        long total = history.size();
        long absent = total - present;

        double percentage = calculationService.calculatePercentage(present, total);
        String status = calculationService.getStatus(percentage, requiredAttendance);
        int canMiss = calculationService.calculateCanMiss(present, total, requiredAttendance);
        int requiredToReach = calculationService.calculateRequiredToReach(present, total, requiredAttendance);

        List<ProjectionItemDTO> projections;
        if (percentage >= requiredAttendance) {
            projections = calculationService.projectAfterMissing(present, total, requiredAttendance, 6);
        } else {
            projections = calculationService.projectRecovery(present, total, requiredAttendance, requiredToReach);
        }

        SubjectDetailResponseDTO response = new SubjectDetailResponseDTO();
        response.setSubject(subject);
        response.setPresent(present);
        response.setAbsent(absent);
        response.setTotal(total);
        response.setPercentage(percentage);
        response.setStatus(status);
        response.setCanMiss(canMiss);
        response.setRequiredToReach(requiredToReach);
        response.setRequiredPercentage(requiredAttendance);
        response.setProjections(projections);
        response.setHistory(history);

        return response;
    }

    /**
     * Get all records for a semester within a date range (for calendar).
     */
    public List<AttendanceRecord> getCalendarRecords(Long semesterId, LocalDate startDate, LocalDate endDate) {
        return attendanceRepository.findBySubjectSemesterIdAndDateBetween(semesterId, startDate, endDate);
    }
}
