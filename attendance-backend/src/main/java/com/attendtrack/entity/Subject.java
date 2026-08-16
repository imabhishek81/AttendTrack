package com.attendtrack.entity;

import jakarta.persistence.*;

/**
 * Subject entity representing college subjects (DBMS, Java, SE, etc.).
 */
@Entity
@Table(name = "subjects")
public class Subject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "semester_id", nullable = false)
    private Semester semester;

    @Column(nullable = false, length = 100)
    private String name; // e.g. "Database Management System"

    @Column(nullable = false, length = 20)
    private String code; // e.g. "DBMS"

    @Column(length = 100)
    private String teacher; // e.g. "Prof. Sharma"

    @Column(length = 20)
    private String color = "#6366f1"; // Color for UI chips & badges

    public Subject() {
    }

    public Subject(Semester semester, String name, String code, String teacher, String color) {
        this.semester = semester;
        this.name = name;
        this.code = code;
        this.teacher = teacher;
        this.color = color;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Semester getSemester() {
        return semester;
    }

    public void setSemester(Semester semester) {
        this.semester = semester;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getTeacher() {
        return teacher;
    }

    public void setTeacher(String teacher) {
        this.teacher = teacher;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }
}
