package com.attendtrack.dto;

import com.attendtrack.entity.Subject;

public class SubjectStatsDTO {
    private Subject subject;
    private long present;
    private long absent;
    private long total;
    private double percentage;
    private String status; // "SAFE", "WARNING", "DANGER"
    private int canMiss;
    private int requiredToReach;

    public SubjectStatsDTO() {
    }

    public SubjectStatsDTO(Subject subject, long present, long absent, long total, double percentage, String status, int canMiss, int requiredToReach) {
        this.subject = subject;
        this.present = present;
        this.absent = absent;
        this.total = total;
        this.percentage = percentage;
        this.status = status;
        this.canMiss = canMiss;
        this.requiredToReach = requiredToReach;
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
}
