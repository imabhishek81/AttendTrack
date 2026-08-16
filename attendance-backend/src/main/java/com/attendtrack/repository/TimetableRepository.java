package com.attendtrack.repository;

import com.attendtrack.entity.TimetableEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TimetableRepository extends JpaRepository<TimetableEntry, Long> {
    List<TimetableEntry> findBySubjectSemesterId(Long semesterId);
    List<TimetableEntry> findBySubjectSemesterIdAndDay(Long semesterId, String day);
    List<TimetableEntry> findBySubjectId(Long subjectId);
    void deleteBySubjectId(Long subjectId);
}
