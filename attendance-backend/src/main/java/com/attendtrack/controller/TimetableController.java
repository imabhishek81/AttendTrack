package com.attendtrack.controller;

import com.attendtrack.entity.Semester;
import com.attendtrack.entity.TimetableEntry;
import com.attendtrack.repository.SemesterRepository;
import com.attendtrack.repository.UserRepository;
import com.attendtrack.service.TimetableService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/timetable")
public class TimetableController {

    private final TimetableService timetableService;
    private final UserRepository userRepository;
    private final SemesterRepository semesterRepository;

    public TimetableController(
            TimetableService timetableService,
            UserRepository userRepository,
            SemesterRepository semesterRepository) {
        this.timetableService = timetableService;
        this.userRepository = userRepository;
        this.semesterRepository = semesterRepository;
    }

    private Long resolveSemesterId(Long semesterId, Principal principal) {
        if (principal != null && principal.getName() != null) {
            return userRepository.findByEmail(principal.getName())
                    .flatMap(user -> semesterRepository.findFirstByUserIdOrderByIdDesc(user.getId()))
                    .map(Semester::getId)
                    .orElse(semesterId != null ? semesterId : 1L);
        }
        return semesterId != null ? semesterId : 1L;
    }

    /**
     * GET /api/timetable?day=Monday
     */
    @GetMapping
    public ResponseEntity<List<TimetableEntry>> getTimetable(
            @RequestParam(name = "semesterId", required = false) Long semesterId,
            @RequestParam(name = "day", required = false) String day,
            Principal principal) {
        Long targetSemesterId = resolveSemesterId(semesterId, principal);
        List<TimetableEntry> entries;
        if (day != null && !day.isBlank()) {
            entries = timetableService.getTimetableForDay(targetSemesterId, day);
        } else {
            entries = timetableService.getTimetableBySemester(targetSemesterId);
        }
        return ResponseEntity.ok(entries);
    }

    /**
     * POST /api/timetable?subjectId=1
     */
    @PostMapping
    public ResponseEntity<TimetableEntry> addTimetableEntry(
            @RequestParam Long subjectId,
            @RequestBody TimetableEntry entry) {
        TimetableEntry created = timetableService.addEntry(subjectId, entry);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    /**
     * DELETE /api/timetable/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTimetableEntry(@PathVariable Long id) {
        timetableService.deleteEntry(id);
        return ResponseEntity.noContent().build();
    }
}
