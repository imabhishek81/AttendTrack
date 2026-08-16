package com.attendtrack.service;

import com.attendtrack.dto.SubjectStatsDTO;
import com.attendtrack.entity.AttendanceStatus;
import com.attendtrack.entity.Semester;
import com.attendtrack.entity.Subject;
import com.attendtrack.exception.ResourceNotFoundException;
import com.attendtrack.repository.AttendanceRepository;
import com.attendtrack.repository.SemesterRepository;
import com.attendtrack.repository.SubjectRepository;
import com.attendtrack.repository.TimetableRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SubjectService {

    private final SubjectRepository subjectRepository;
    private final SemesterRepository semesterRepository;
    private final AttendanceRepository attendanceRepository;
    private final TimetableRepository timetableRepository;
    private final AttendanceCalculationService calculationService;

    // Constructor Injection (Best Practice in Spring Boot!)
    public SubjectService(
            SubjectRepository subjectRepository,
            SemesterRepository semesterRepository,
            AttendanceRepository attendanceRepository,
            TimetableRepository timetableRepository,
            AttendanceCalculationService calculationService) {
        this.subjectRepository = subjectRepository;
        this.semesterRepository = semesterRepository;
        this.attendanceRepository = attendanceRepository;
        this.timetableRepository = timetableRepository;
        this.calculationService = calculationService;
    }

    public List<Subject> getSubjectsBySemester(Long semesterId) {
        return subjectRepository.findBySemesterId(semesterId);
    }

    public Subject getSubjectById(Long id) {
        return subjectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + id));
    }

    public SubjectStatsDTO getSubjectStats(Long subjectId, double requiredAttendance) {
        Subject subject = getSubjectById(subjectId);
        long present = attendanceRepository.countBySubjectIdAndStatus(subjectId, AttendanceStatus.PRESENT);
        long total = attendanceRepository.countBySubjectId(subjectId);
        long absent = total - present;

        double percentage = calculationService.calculatePercentage(present, total);
        String status = calculationService.getStatus(percentage, requiredAttendance);
        int canMiss = calculationService.calculateCanMiss(present, total, requiredAttendance);
        int requiredToReach = calculationService.calculateRequiredToReach(present, total, requiredAttendance);

        return new SubjectStatsDTO(subject, present, absent, total, percentage, status, canMiss, requiredToReach);
    }

    public List<SubjectStatsDTO> getAllSubjectStats(Long semesterId, double requiredAttendance) {
        List<Subject> subjects = getSubjectsBySemester(semesterId);
        return subjects.stream()
                .map(sub -> getSubjectStats(sub.getId(), requiredAttendance))
                .collect(Collectors.toList());
    }

    @Transactional
    public Subject createSubject(Long semesterId, Subject subjectData) {
        Semester semester = semesterRepository.findById(semesterId)
                .orElseThrow(() -> new ResourceNotFoundException("Semester not found with id: " + semesterId));
        subjectData.setSemester(semester);
        return subjectRepository.save(subjectData);
    }

    @Transactional
    public Subject updateSubject(Long id, Subject updated) {
        Subject existing = getSubjectById(id);
        existing.setName(updated.getName());
        existing.setCode(updated.getCode());
        existing.setTeacher(updated.getTeacher());
        if (updated.getColor() != null) {
            existing.setColor(updated.getColor());
        }
        return subjectRepository.save(existing);
    }

    @Transactional
    public void deleteSubject(Long id) {
        if (!subjectRepository.existsById(id)) {
            throw new ResourceNotFoundException("Subject not found with id: " + id);
        }
        // 1. Delete associated attendance records first
        attendanceRepository.deleteBySubjectId(id);
        // 2. Delete associated timetable entries first
        timetableRepository.deleteBySubjectId(id);
        // 3. Delete the subject itself
        subjectRepository.deleteById(id);
    }
}
