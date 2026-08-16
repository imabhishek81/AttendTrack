package com.attendtrack.entity;

import jakarta.persistence.*;

/**
 * ==========================================================
 * 🎓 Spring Boot Learning Note: @ManyToOne & Foreign Keys
 * ==========================================================
 * - @ManyToOne(fetch = FetchType.LAZY): Multiple semesters belong to one user.
 * - @JoinColumn(name = "user_id"): The foreign key column created in the 'semesters' table.
 * ==========================================================
 */
@Entity
@Table(name = "semesters")
public class Semester {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 50)
    private String semesterName; // e.g. "5th Semester"

    @Column(nullable = false, length = 20)
    private String academicYear; // e.g. "2026-27"

    @Column(nullable = false)
    private double requiredAttendance = 75.0; // e.g. 75%

    public Semester() {
    }

    public Semester(User user, String semesterName, String academicYear, double requiredAttendance) {
        this.user = user;
        this.semesterName = semesterName;
        this.academicYear = academicYear;
        this.requiredAttendance = requiredAttendance;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getSemesterName() {
        return semesterName;
    }

    public void setSemesterName(String semesterName) {
        this.semesterName = semesterName;
    }

    public String getAcademicYear() {
        return academicYear;
    }

    public void setAcademicYear(String academicYear) {
        this.academicYear = academicYear;
    }

    public double getRequiredAttendance() {
        return requiredAttendance;
    }

    public void setRequiredAttendance(double requiredAttendance) {
        this.requiredAttendance = requiredAttendance;
    }
}
