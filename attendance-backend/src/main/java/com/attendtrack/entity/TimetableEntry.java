package com.attendtrack.entity;

import jakarta.persistence.*;

/**
 * TimetableEntry entity representing weekly lecture slots (Monday 09:00 - 10:00).
 */
@Entity
@Table(name = "timetable")
public class TimetableEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @Column(nullable = false, length = 20)
    private String day; // "Monday", "Tuesday", etc.

    @Column(nullable = false, length = 10)
    private String startTime; // "09:00"

    @Column(nullable = false, length = 10)
    private String endTime; // "10:00"

    @Column(length = 50)
    private String room; // "C-204"

    public TimetableEntry() {
    }

    public TimetableEntry(Subject subject, String day, String startTime, String endTime, String room) {
        this.subject = subject;
        this.day = day;
        this.startTime = startTime;
        this.endTime = endTime;
        this.room = room;
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

    public String getDay() {
        return day;
    }

    public void setDay(String day) {
        this.day = day;
    }

    public String getStartTime() {
        return startTime;
    }

    public void setStartTime(String startTime) {
        this.startTime = startTime;
    }

    public String getEndTime() {
        return endTime;
    }

    public void setEndTime(String endTime) {
        this.endTime = endTime;
    }

    public String getRoom() {
        return room;
    }

    public void setRoom(String room) {
        this.room = room;
    }
}
