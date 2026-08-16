package com.attendtrack.dto;

import com.attendtrack.entity.AttendanceRecord;
import com.attendtrack.entity.Semester;
import com.attendtrack.entity.TimetableEntry;
import com.attendtrack.entity.User;

import java.util.List;

public class DashboardResponseDTO {
    private User user;
    private Semester semester;
    private double overallPercentage;
    private String overallStatus;
    private long totalClasses;
    private long totalPresent;
    private long subjectsAtRisk;
    private double requiredAttendance;
    private List<TodayClassDTO> todaysClasses;
    private List<SubjectStatsDTO> subjectSummaries;

    public static class TodayClassDTO {
        private TimetableEntry timetableEntry;
        private AttendanceRecord attendance;

        public TodayClassDTO() {
        }

        public TodayClassDTO(TimetableEntry timetableEntry, AttendanceRecord attendance) {
            this.timetableEntry = timetableEntry;
            this.attendance = attendance;
        }

        public TimetableEntry getTimetableEntry() {
            return timetableEntry;
        }

        public void setTimetableEntry(TimetableEntry timetableEntry) {
            this.timetableEntry = timetableEntry;
        }

        public AttendanceRecord getAttendance() {
            return attendance;
        }

        public void setAttendance(AttendanceRecord attendance) {
            this.attendance = attendance;
        }
    }

    public DashboardResponseDTO() {
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Semester getSemester() {
        return semester;
    }

    public void setSemester(Semester semester) {
        this.semester = semester;
    }

    public double getOverallPercentage() {
        return overallPercentage;
    }

    public void setOverallPercentage(double overallPercentage) {
        this.overallPercentage = overallPercentage;
    }

    public String getOverallStatus() {
        return overallStatus;
    }

    public void setOverallStatus(String overallStatus) {
        this.overallStatus = overallStatus;
    }

    public long getTotalClasses() {
        return totalClasses;
    }

    public void setTotalClasses(long totalClasses) {
        this.totalClasses = totalClasses;
    }

    public long getTotalPresent() {
        return totalPresent;
    }

    public void setTotalPresent(long totalPresent) {
        this.totalPresent = totalPresent;
    }

    public long getSubjectsAtRisk() {
        return subjectsAtRisk;
    }

    public void setSubjectsAtRisk(long subjectsAtRisk) {
        this.subjectsAtRisk = subjectsAtRisk;
    }

    public double getRequiredAttendance() {
        return requiredAttendance;
    }

    public void setRequiredAttendance(double requiredAttendance) {
        this.requiredAttendance = requiredAttendance;
    }

    public List<TodayClassDTO> getTodaysClasses() {
        return todaysClasses;
    }

    public void setTodaysClasses(List<TodayClassDTO> todaysClasses) {
        this.todaysClasses = todaysClasses;
    }

    public List<SubjectStatsDTO> getSubjectSummaries() {
        return subjectSummaries;
    }

    public void setSubjectSummaries(List<SubjectStatsDTO> subjectSummaries) {
        this.subjectSummaries = subjectSummaries;
    }
}
