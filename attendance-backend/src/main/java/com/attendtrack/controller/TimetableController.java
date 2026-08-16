package com.attendtrack.controller;

import com.attendtrack.entity.TimetableEntry;
import com.attendtrack.service.TimetableService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/timetable")
public class TimetableController {

    private final TimetableService timetableService;

    public TimetableController(TimetableService timetableService) {
        this.timetableService = timetableService;
    }

    /**
     * GET /api/timetable?semesterId=1&day=Monday
     */
    @GetMapping
    public ResponseEntity<List<TimetableEntry>> getTimetable(
            @RequestParam(name = "semesterId", defaultValue = "1") Long semesterId,
            @RequestParam(name = "day", required = false) String day) {
        List<TimetableEntry> entries;
        if (day != null && !day.isBlank()) {
            entries = timetableService.getTimetableForDay(semesterId, day);
        } else {
            entries = timetableService.getTimetableBySemester(semesterId);
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
