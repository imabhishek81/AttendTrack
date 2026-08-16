package com.attendtrack.service;

import com.attendtrack.entity.Subject;
import com.attendtrack.entity.TimetableEntry;
import com.attendtrack.exception.ResourceNotFoundException;
import com.attendtrack.repository.SubjectRepository;
import com.attendtrack.repository.TimetableRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TimetableService {

    private final TimetableRepository timetableRepository;
    private final SubjectRepository subjectRepository;

    public TimetableService(TimetableRepository timetableRepository, SubjectRepository subjectRepository) {
        this.timetableRepository = timetableRepository;
        this.subjectRepository = subjectRepository;
    }

    public List<TimetableEntry> getTimetableBySemester(Long semesterId) {
        return timetableRepository.findBySubjectSemesterId(semesterId);
    }

    public List<TimetableEntry> getTimetableForDay(Long semesterId, String day) {
        return timetableRepository.findBySubjectSemesterIdAndDay(semesterId, day);
    }

    @Transactional
    public TimetableEntry addEntry(Long subjectId, TimetableEntry entry) {
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + subjectId));
        entry.setSubject(subject);
        return timetableRepository.save(entry);
    }

    @Transactional
    public void deleteEntry(Long id) {
        if (!timetableRepository.existsById(id)) {
            throw new ResourceNotFoundException("Timetable entry not found with id: " + id);
        }
        timetableRepository.deleteById(id);
    }
}
