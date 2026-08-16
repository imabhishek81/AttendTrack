package com.attendtrack.controller;

import com.attendtrack.dto.AuthRequestDTO;
import com.attendtrack.dto.AuthResponseDTO;
import com.attendtrack.dto.RegisterRequestDTO;
import com.attendtrack.entity.Semester;
import com.attendtrack.entity.Subject;
import com.attendtrack.entity.User;
import com.attendtrack.exception.ResourceNotFoundException;
import com.attendtrack.repository.SemesterRepository;
import com.attendtrack.repository.SubjectRepository;
import com.attendtrack.repository.UserRepository;
import com.attendtrack.security.JwtTokenProvider;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/**
 * ==========================================================
 * 🎓 Spring Boot Learning Note: Auth Controller & Spring Security
 * ==========================================================
 * - AuthenticationManager: Verifies user credentials using BCrypt.
 * - PasswordEncoder: Hashes raw passwords before storing in MySQL.
 * - JwtTokenProvider: Issues signed JWT token for subsequent API calls.
 * ==========================================================
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final SemesterRepository semesterRepository;
    private final SubjectRepository subjectRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthController(
            AuthenticationManager authenticationManager,
            UserRepository userRepository,
            SemesterRepository semesterRepository,
            SubjectRepository subjectRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider tokenProvider) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.semesterRepository = semesterRepository;
        this.subjectRepository = subjectRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    /**
     * POST /api/auth/register
     * Register a new student, create default semester & subjects, return JWT.
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequestDTO request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body("Email is already registered!");
        }

        // 1. Create and save new User with hashed password
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user = userRepository.save(user);

        // 2. Create default semester
        Semester semester = new Semester(user, "5th Semester", "2026-27", 75.0);
        semester = semesterRepository.save(semester);

        // 3. Create starter subjects
        subjectRepository.saveAll(List.of(
                new Subject(semester, "Database Management System", "DBMS", "Prof. Sharma", "#6366f1"),
                new Subject(semester, "Java Programming", "Java", "Prof. Patel", "#f59e0b"),
                new Subject(semester, "Software Engineering", "SE", "Prof. Gupta", "#10b981"),
                new Subject(semester, "Internet of Things", "IoT", "Prof. Kumar", "#ec4899"),
                new Subject(semester, "Computer Networks", "CN", "Prof. Singh", "#06b6d4")
        ));

        // 4. Generate JWT token
        String token = tokenProvider.generateToken(user.getEmail(), user.getId());

        // Don't send back password hash in response
        user.setPassword(null);
        return new ResponseEntity<>(new AuthResponseDTO(token, user), HttpStatus.CREATED);
    }

    /**
     * POST /api/auth/login
     * Authenticate student credentials and return JWT token.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequestDTO request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String token = tokenProvider.generateToken(user.getEmail(), user.getId());

        user.setPassword(null);
        return ResponseEntity.ok(new AuthResponseDTO(token, user));
    }

    /**
     * GET /api/auth/me
     * Fetch currently authenticated user details.
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated");
        }

        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setPassword(null);
        return ResponseEntity.ok(user);
    }
}
