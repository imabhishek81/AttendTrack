package com.attendtrack.controller;

import com.attendtrack.dto.UserProfileDTO;
import com.attendtrack.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * GET /api/user/profile?userId=1
     */
    @GetMapping("/profile")
    public ResponseEntity<UserProfileDTO> getProfile(
            @RequestParam(name = "userId", defaultValue = "1") Long userId) {
        UserProfileDTO profile = userService.getUserProfile(userId);
        return ResponseEntity.ok(profile);
    }

    /**
     * PUT /api/user/profile?userId=1
     */
    @PutMapping("/profile")
    public ResponseEntity<UserProfileDTO> updateProfile(
            @RequestParam(name = "userId", defaultValue = "1") Long userId,
            @RequestBody UserProfileDTO updateRequest) {
        UserProfileDTO updated = userService.updateProfile(userId, updateRequest);
        return ResponseEntity.ok(updated);
    }
}
