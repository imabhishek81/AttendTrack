package com.attendtrack.config;

import com.attendtrack.entity.*;
import com.attendtrack.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * ==========================================================
 * 🎓 Spring Boot Learning Note: CommandLineRunner & Seed Data
 * ==========================================================
 * - CommandLineRunner runs automatically right after Spring Boot starts.
 * - Seeds demo user, semester, subjects, timetable, and attendance history
 *   if the database is currently empty.
 * ==========================================================
 */
@Configuration
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final SemesterRepository semesterRepository;
    private final SubjectRepository subjectRepository;
    private final TimetableRepository timetableRepository;
    private final AttendanceRepository attendanceRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    public DataInitializer(
            UserRepository userRepository,
            SemesterRepository semesterRepository,
            SubjectRepository subjectRepository,
            TimetableRepository timetableRepository,
            AttendanceRepository attendanceRepository,
            org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.semesterRepository = semesterRepository;
        this.subjectRepository = subjectRepository;
        this.timetableRepository = timetableRepository;
        this.attendanceRepository = attendanceRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            // Ensure demo user has a BCrypt password set
            userRepository.findByEmail("abhishek@example.com").ifPresent(u -> {
                if (u.getPassword() == null || u.getPassword().isBlank()) {
                    u.setPassword(passwordEncoder.encode("password123"));
                    userRepository.save(u);
                    System.out.println("🔑 Encrypted password set for demo user: abhishek@example.com (password123)");
                }
            });
            System.out.println("ℹ️ Database already contains data. Skipping initial seeding.");
            return;
        }

        System.out.println("🚀 Seeding initial demo data into MySQL database...");

        // 1. Create Demo User
        User user = new User("Abhishek", "abhishek@example.com", null);
        user.setPassword(passwordEncoder.encode("password123"));
        user = userRepository.save(user);

        // 2. Create Active Semester
        Semester semester = new Semester(user, "5th Semester", "2026-27", 75.0);
        semester = semesterRepository.save(semester);

        // 3. Create 5 Core Subjects
        Subject dbms = subjectRepository.save(new Subject(semester, "Database Management System", "DBMS", "Prof. Sharma", "#6366f1"));
        Subject java = subjectRepository.save(new Subject(semester, "Java Programming", "Java", "Prof. Patel", "#f59e0b"));
        Subject se = subjectRepository.save(new Subject(semester, "Software Engineering", "SE", "Prof. Gupta", "#10b981"));
        Subject iot = subjectRepository.save(new Subject(semester, "Internet of Things", "IoT", "Prof. Kumar", "#ec4899"));
        Subject cn = subjectRepository.save(new Subject(semester, "Computer Networks", "CN", "Prof. Singh", "#06b6d4"));

        // 4. Create Timetable Entries
        List<TimetableEntry> entries = new ArrayList<>();
        // Monday
        entries.add(new TimetableEntry(dbms, "Monday", "09:00", "10:00", "C-204"));
        entries.add(new TimetableEntry(java, "Monday", "10:00", "11:00", "C-204"));
        entries.add(new TimetableEntry(se, "Monday", "11:00", "12:00", "B-102"));
        entries.add(new TimetableEntry(iot, "Monday", "14:00", "15:00", "Lab-1"));

        // Tuesday
        entries.add(new TimetableEntry(cn, "Tuesday", "09:00", "10:00", "A-301"));
        entries.add(new TimetableEntry(dbms, "Tuesday", "10:00", "11:00", "C-204"));
        entries.add(new TimetableEntry(java, "Tuesday", "11:00", "12:00", "C-204"));
        entries.add(new TimetableEntry(se, "Tuesday", "14:00", "15:00", "B-102"));

        // Wednesday
        entries.add(new TimetableEntry(iot, "Wednesday", "09:00", "10:00", "Lab-1"));
        entries.add(new TimetableEntry(cn, "Wednesday", "10:00", "11:00", "A-301"));
        entries.add(new TimetableEntry(dbms, "Wednesday", "11:00", "12:00", "C-204"));
        entries.add(new TimetableEntry(java, "Wednesday", "14:00", "15:00", "C-204"));

        // Thursday
        entries.add(new TimetableEntry(se, "Thursday", "09:00", "10:00", "B-102"));
        entries.add(new TimetableEntry(iot, "Thursday", "10:00", "11:00", "Lab-1"));
        entries.add(new TimetableEntry(cn, "Thursday", "11:00", "12:00", "A-301"));
        entries.add(new TimetableEntry(dbms, "Thursday", "14:00", "15:00", "C-204"));

        // Friday
        entries.add(new TimetableEntry(java, "Friday", "09:00", "10:00", "C-204"));
        entries.add(new TimetableEntry(se, "Friday", "10:00", "11:00", "B-102"));
        entries.add(new TimetableEntry(iot, "Friday", "11:00", "12:00", "Lab-1"));
        entries.add(new TimetableEntry(cn, "Friday", "14:00", "15:00", "A-301"));

        // Saturday
        entries.add(new TimetableEntry(dbms, "Saturday", "09:00", "10:00", "C-204"));
        entries.add(new TimetableEntry(java, "Saturday", "10:00", "11:00", "C-204"));

        timetableRepository.saveAll(entries);

        // 5. Generate realistic attendance records from June 1st to yesterday
        LocalDate startDate = LocalDate.of(2026, 6, 1);
        LocalDate endDate = LocalDate.now().minusDays(1);
        Random random = new Random(42); // Deterministic seed

        List<AttendanceRecord> attendanceRecords = new ArrayList<>();

        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            String dayName = switch (date.getDayOfWeek()) {
                case MONDAY -> "Monday";
                case TUESDAY -> "Tuesday";
                case WEDNESDAY -> "Wednesday";
                case THURSDAY -> "Thursday";
                case FRIDAY -> "Friday";
                case SATURDAY -> "Saturday";
                case SUNDAY -> null;
            };

            if (dayName == null) continue; // Skip Sunday

            final String currentDay = dayName;
            List<TimetableEntry> dayClasses = entries.stream()
                    .filter(e -> e.getDay().equals(currentDay))
                    .toList();

            for (TimetableEntry cls : dayClasses) {
                double absentProbability = switch (cls.getSubject().getCode()) {
                    case "DBMS" -> 0.18; // ~82% attendance
                    case "Java" -> 0.29; // ~71% attendance (warning/shortage)
                    case "SE" -> 0.24;   // ~76% attendance
                    case "IoT" -> 0.12;  // ~88% attendance (safe)
                    case "CN" -> 0.20;   // ~80% attendance
                    default -> 0.20;
                };

                AttendanceStatus status = (random.nextDouble() < absentProbability) ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT;
                attendanceRecords.add(new AttendanceRecord(cls.getSubject(), date, status));
            }
        }

        attendanceRepository.saveAll(attendanceRecords);
        System.out.println("✅ Seeded " + attendanceRecords.size() + " attendance records successfully!");
    }
}
