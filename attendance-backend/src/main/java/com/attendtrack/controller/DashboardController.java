package com.attendtrack.controller;

import com.attendtrack.dto.DashboardResponseDTO;
import com.attendtrack.entity.User;
import com.attendtrack.repository.UserRepository;
import com.attendtrack.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

/**
 * ==========================================================
 * 🎓 Spring Boot Learning Note: @RestController & REST APIs
 * ==========================================================
 * - @RestController: Marks this class as a request handler that returns JSON automatically.
 *   (It combines @Controller and @ResponseBody).
 * - @RequestMapping("/api/dashboard"): Base URI prefix for all endpoints in this class.
 * - @CrossOrigin(origins = "*"): Allows browser requests from React (:5173).
 * - ResponseEntity<T>: Wraps HTTP status code (200 OK), headers, and JSON body.
 * ==========================================================
 */
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;
    private final UserRepository userRepository;

    public DashboardController(DashboardService dashboardService, UserRepository userRepository) {
        this.dashboardService = dashboardService;
        this.userRepository = userRepository;
    }

    /**
     * GET /api/dashboard
     * Returns: Overall %, today's classes, subject summaries, subjects at risk
     */
    @GetMapping
    public ResponseEntity<DashboardResponseDTO> getDashboard(
            @RequestParam(name = "userId", required = false) Long userId,
            Principal principal) {
        Long targetUserId = userId;
        if (principal != null && principal.getName() != null) {
            targetUserId = userRepository.findByEmail(principal.getName())
                    .map(User::getId)
                    .orElse(targetUserId != null ? targetUserId : 1L);
        } else if (targetUserId == null) {
            targetUserId = 1L;
        }

        DashboardResponseDTO response = dashboardService.getDashboardData(targetUserId);
        return ResponseEntity.ok(response);
    }
}
