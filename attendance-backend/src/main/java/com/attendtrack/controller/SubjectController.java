package com.attendtrack.controller;

import com.attendtrack.dto.CreateSubjectRequestDTO;
import com.attendtrack.dto.SubjectStatsDTO;
import com.attendtrack.entity.Semester;
import com.attendtrack.entity.Subject;
import com.attendtrack.repository.SemesterRepository;
import com.attendtrack.repository.UserRepository;
import com.attendtrack.service.SubjectService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/subjects")
public class SubjectController {

    private final SubjectService subjectService;
    private final UserRepository userRepository;
    private final SemesterRepository semesterRepository;

    public SubjectController(
            SubjectService subjectService,
            UserRepository userRepository,
            SemesterRepository semesterRepository) {
        this.subjectService = subjectService;
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
     * GET /api/subjects?semesterId=1&required=75
     */
    @GetMapping
    public ResponseEntity<List<SubjectStatsDTO>> getAllSubjects(
            @RequestParam(name = "semesterId", required = false) Long semesterId,
            @RequestParam(name = "required", defaultValue = "75.0") double requiredAttendance,
            Principal principal) {
        Long targetSemesterId = resolveSemesterId(semesterId, principal);
        List<SubjectStatsDTO> list = subjectService.getAllSubjectStats(targetSemesterId, requiredAttendance);
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
     * POST /api/subjects
     */
    @PostMapping
    public ResponseEntity<Subject> createSubject(
            @RequestParam(name = "semesterId", required = false) Long semesterId,
            @RequestBody CreateSubjectRequestDTO request,
            Principal principal) {
        Long targetSemesterId = resolveSemesterId(semesterId, principal);
        Subject subject = request.toSubject();
        Subject created = subjectService.createSubject(targetSemesterId, subject, request.getInitialTotal(), request.getInitialAttended());
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
