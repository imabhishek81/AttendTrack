package com.attendtrack.dto;

import com.attendtrack.entity.AttendanceRecord;
import com.attendtrack.entity.Subject;

import java.util.List;

public class SubjectDetailResponseDTO {
    private Subject subject;
    private long present;
    private long absent;
    private long total;
    private double percentage;
    private String status;
    private int canMiss;
    private int requiredToReach;
    private double requiredPercentage;
    private List<ProjectionItemDTO> projections;
    private List<AttendanceRecord> history;

    public SubjectDetailResponseDTO() {
    }

    public Subject getSubject() {
        return subject;
    }

    public void setSubject(Subject subject) {
        this.subject = subject;
    }

    public long getPresent() {
        return present;
    }

    public void setPresent(long present) {
        this.present = present;
    }

    public long getAbsent() {
        return absent;
    }

    public void setAbsent(long absent) {
        this.absent = absent;
    }

    public long getTotal() {
        return total;
    }

    public void setTotal(long total) {
        this.total = total;
    }

    public double getPercentage() {
        return percentage;
    }

    public void setPercentage(double percentage) {
        this.percentage = percentage;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public int getCanMiss() {
        return canMiss;
    }

    public void setCanMiss(int canMiss) {
        this.canMiss = canMiss;
    }

    public int getRequiredToReach() {
        return requiredToReach;
    }

    public void setRequiredToReach(int requiredToReach) {
        this.requiredToReach = requiredToReach;
    }

    public double getRequiredPercentage() {
        return requiredPercentage;
    }

    public void setRequiredPercentage(double requiredPercentage) {
        this.requiredPercentage = requiredPercentage;
    }

    public List<ProjectionItemDTO> getProjections() {
        return projections;
    }

    public void setProjections(List<ProjectionItemDTO> projections) {
        this.projections = projections;
    }

    public List<AttendanceRecord> getHistory() {
        return history;
    }

    public void setHistory(List<AttendanceRecord> history) {
        this.history = history;
    }
}
