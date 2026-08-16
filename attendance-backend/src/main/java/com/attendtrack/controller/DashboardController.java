package com.attendtrack.controller;

import com.attendtrack.dto.DashboardResponseDTO;
import com.attendtrack.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    /**
     * GET /api/dashboard
     * Returns: Overall %, today's classes, subject summaries, subjects at risk
     */
    @GetMapping
    public ResponseEntity<DashboardResponseDTO> getDashboard(
            @RequestParam(name = "userId", defaultValue = "1") Long userId) {
        DashboardResponseDTO response = dashboardService.getDashboardData(userId);
        return ResponseEntity.ok(response);
    }
}
