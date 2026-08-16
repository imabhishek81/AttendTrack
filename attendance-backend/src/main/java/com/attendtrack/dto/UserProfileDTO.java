package com.attendtrack.dto;

public class UserProfileDTO {
    private Long id;
    private String name;
    private String email;
    private String avatarUrl;
    private Double requiredAttendance;

    public UserProfileDTO() {
    }

    public UserProfileDTO(Long id, String name, String email, String avatarUrl, Double requiredAttendance) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.avatarUrl = avatarUrl;
        this.requiredAttendance = requiredAttendance;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public Double getRequiredAttendance() {
        return requiredAttendance;
    }

    public void setRequiredAttendance(Double requiredAttendance) {
        this.requiredAttendance = requiredAttendance;
    }
}
