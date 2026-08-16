package com.attendtrack.repository;

import com.attendtrack.entity.AttendanceRecord;
import com.attendtrack.entity.AttendanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<AttendanceRecord, Long> {
    
    // Find records by subject
    List<AttendanceRecord> findBySubjectIdOrderByDateDesc(Long subjectId);
    
    // Find all records for a semester
    List<AttendanceRecord> findBySubjectSemesterIdOrderByDateDesc(Long semesterId);
    
    // Find record by subject and date
    Optional<AttendanceRecord> findBySubjectIdAndDate(Long subjectId, LocalDate date);
    
    // Find records within a date range (for monthly calendar)
    List<AttendanceRecord> findBySubjectSemesterIdAndDateBetween(Long semesterId, LocalDate startDate, LocalDate endDate);
    
    // Count attendance by status for a subject
    long countBySubjectIdAndStatus(Long subjectId, AttendanceStatus status);
    
    // Total count for a subject
    long countBySubjectId(Long subjectId);

    // Delete records for a subject (for cascade cleanup)
    void deleteBySubjectId(Long subjectId);
}
