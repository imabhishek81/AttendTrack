package com.attendtrack.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

/**
 * ==========================================================
 * 🎓 Spring Boot Learning Note: Unique Constraints & Enums
 * ==========================================================
 * - @Enumerated(EnumType.STRING): Stores 'PRESENT' or 'ABSENT' as readable strings in MySQL.
 * - @Table uniqueConstraints: Prevents duplicate attendance records for the same subject on the same day.
 * ==========================================================
 */
@Entity
@Table(
    name = "attendance_records",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"subject_id", "attendance_date"})
    }
)
public class AttendanceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @Column(name = "attendance_date", nullable = false)
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AttendanceStatus status = AttendanceStatus.PRESENT;

    public AttendanceRecord() {
    }

    public AttendanceRecord(Subject subject, LocalDate date, AttendanceStatus status) {
        this.subject = subject;
        this.date = date;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Subject getSubject() {
        return subject;
    }

    public void setSubject(Subject subject) {
        this.subject = subject;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public AttendanceStatus getStatus() {
        return status;
    }

    public void setStatus(AttendanceStatus status) {
        this.status = status;
    }
}
