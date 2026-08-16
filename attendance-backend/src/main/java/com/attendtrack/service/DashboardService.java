package com.attendtrack.service;

import com.attendtrack.dto.DashboardResponseDTO;
import com.attendtrack.dto.SubjectStatsDTO;
import com.attendtrack.entity.*;
import com.attendtrack.exception.ResourceNotFoundException;
import com.attendtrack.repository.AttendanceRepository;
import com.attendtrack.repository.SemesterRepository;
import com.attendtrack.repository.TimetableRepository;
import com.attendtrack.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
public class DashboardService {

    private final UserRepository userRepository;
    private final SemesterRepository semesterRepository;
    private final TimetableRepository timetableRepository;
    private final AttendanceRepository attendanceRepository;
    private final SubjectService subjectService;
    private final AttendanceCalculationService calculationService;

    public DashboardService(
            UserRepository userRepository,
            SemesterRepository semesterRepository,
            TimetableRepository timetableRepository,
            AttendanceRepository attendanceRepository,
            SubjectService subjectService,
            AttendanceCalculationService calculationService) {
        this.userRepository = userRepository;
        this.semesterRepository = semesterRepository;
        this.timetableRepository = timetableRepository;
        this.attendanceRepository = attendanceRepository;
        this.subjectService = subjectService;
        this.calculationService = calculationService;
    }

    public DashboardResponseDTO getDashboardData(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Semester semester = semesterRepository.findFirstByUserIdOrderByIdDesc(userId)
                .orElseThrow(() -> new ResourceNotFoundException("No active semester found for user: " + userId));

        double requiredAttendance = semester.getRequiredAttendance();

        // 1. Get Subject summaries & stats
        List<SubjectStatsDTO> subjectSummaries = subjectService.getAllSubjectStats(semester.getId(), requiredAttendance);

        long totalClasses = 0;
        long totalPresent = 0;
        long subjectsAtRisk = 0;

        for (SubjectStatsDTO stat : subjectSummaries) {
            totalClasses += stat.getTotal();
            totalPresent += stat.getPresent();
            if (stat.getTotal() > 0 && stat.getPercentage() < requiredAttendance) {
                subjectsAtRisk++;
            }
        }

        double overallPercentage = calculationService.calculatePercentage(totalPresent, totalClasses);
        String overallStatus = calculationService.getStatus(overallPercentage, requiredAttendance);

        // 2. Get Today's classes
        LocalDate today = LocalDate.now();
        String dayOfWeek = today.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.ENGLISH);

        List<TimetableEntry> entries = timetableRepository.findBySubjectSemesterIdAndDay(semester.getId(), dayOfWeek);
        List<DashboardResponseDTO.TodayClassDTO> todayClasses = new ArrayList<>();

        for (TimetableEntry entry : entries) {
            Optional<AttendanceRecord> attendance = attendanceRepository.findBySubjectIdAndDate(entry.getSubject().getId(), today);
            todayClasses.add(new DashboardResponseDTO.TodayClassDTO(entry, attendance.orElse(null)));
        }

        DashboardResponseDTO response = new DashboardResponseDTO();
        response.setUser(user);
        response.setSemester(semester);
        response.setOverallPercentage(overallPercentage);
        response.setOverallStatus(overallStatus);
        response.setTotalClasses(totalClasses);
        response.setTotalPresent(totalPresent);
        response.setSubjectsAtRisk(subjectsAtRisk);
        response.setRequiredAttendance(requiredAttendance);
        response.setTodaysClasses(todayClasses);
        response.setSubjectSummaries(subjectSummaries);

        return response;
    }
}
