package com.attendtrack.dto;

import com.attendtrack.entity.AttendanceStatus;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class MarkAttendanceRequestDTO {

    @NotNull(message = "Subject ID is required")
    private Long subjectId;

    @NotNull(message = "Date is required")
    private LocalDate date;

    @NotNull(message = "Status is required")
    private AttendanceStatus status;

    public MarkAttendanceRequestDTO() {
    }

    public MarkAttendanceRequestDTO(Long subjectId, LocalDate date, AttendanceStatus status) {
        this.subjectId = subjectId;
        this.date = date;
        this.status = status;
    }

    public Long getSubjectId() {
        return subjectId;
    }

    public void setSubjectId(Long subjectId) {
        this.subjectId = subjectId;
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
