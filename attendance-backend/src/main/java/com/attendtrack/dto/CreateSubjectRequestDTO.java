package com.attendtrack.dto;

import com.attendtrack.entity.Subject;

public class CreateSubjectRequestDTO {
    private String name;
    private String code;
    private String teacher;
    private String color;
    private Integer initialTotal;
    private Integer initialAttended;

    public CreateSubjectRequestDTO() {
    }

    public CreateSubjectRequestDTO(String name, String code, String teacher, String color, Integer initialTotal, Integer initialAttended) {
        this.name = name;
        this.code = code;
        this.teacher = teacher;
        this.color = color;
        this.initialTotal = initialTotal;
        this.initialAttended = initialAttended;
    }

    public Subject toSubject() {
        Subject subject = new Subject();
        subject.setName(this.name);
        subject.setCode(this.code);
        subject.setTeacher(this.teacher);
        subject.setColor(this.color);
        return subject;
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

    public Integer getInitialTotal() {
        return initialTotal;
    }

    public void setInitialTotal(Integer initialTotal) {
        this.initialTotal = initialTotal;
    }

    public Integer getInitialAttended() {
        return initialAttended;
    }

    public void setInitialAttended(Integer initialAttended) {
        this.initialAttended = initialAttended;
    }
}
