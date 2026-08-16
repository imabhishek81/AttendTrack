package com.attendtrack.controller;

import com.attendtrack.dto.CreateSubjectRequestDTO;
import com.attendtrack.dto.SubjectStatsDTO;
import com.attendtrack.entity.Subject;
import com.attendtrack.service.SubjectService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
public class SubjectController {

    private final SubjectService subjectService;

    public SubjectController(SubjectService subjectService) {
        this.subjectService = subjectService;
    }

    /**
     * GET /api/subjects?semesterId=1&required=75
     */
    @GetMapping
    public ResponseEntity<List<SubjectStatsDTO>> getAllSubjects(
            @RequestParam(name = "semesterId", defaultValue = "1") Long semesterId,
            @RequestParam(name = "required", defaultValue = "75.0") double requiredAttendance) {
        List<SubjectStatsDTO> list = subjectService.getAllSubjectStats(semesterId, requiredAttendance);
        return ResponseEntity.ok(list);
    }

    /**
     * GET /api/subjects/{id}?required=75
     */
    @GetMapping("/{id}")
    public ResponseEntity<SubjectStatsDTO> getSubjectById(
            @PathVariable Long id,
            @RequestParam(name = "required", defaultValue = "75.0") double requiredAttendance) {
        SubjectStatsDTO stats = subjectService.getSubjectStats(id, requiredAttendance);
        return ResponseEntity.ok(stats);
    }

    /**
     * POST /api/subjects?semesterId=1
     */
    @PostMapping
    public ResponseEntity<Subject> createSubject(
            @RequestParam(name = "semesterId", defaultValue = "1") Long semesterId,
            @RequestBody CreateSubjectRequestDTO request) {
        Subject subject = request.toSubject();
        Subject created = subjectService.createSubject(semesterId, subject, request.getInitialTotal(), request.getInitialAttended());
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    /**
     * PUT /api/subjects/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<Subject> updateSubject(
            @PathVariable Long id,
            @RequestBody Subject subject) {
        Subject updated = subjectService.updateSubject(id, subject);
        return ResponseEntity.ok(updated);
    }

    /**
     * DELETE /api/subjects/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSubject(@PathVariable Long id) {
        subjectService.deleteSubject(id);
        return ResponseEntity.noContent().build();
    }
}
