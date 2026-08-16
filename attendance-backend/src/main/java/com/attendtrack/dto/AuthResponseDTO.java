package com.attendtrack.dto;

import com.attendtrack.entity.User;

public class AuthResponseDTO {

    private String token;
    private String tokenType = "Bearer";
    private User user;

    public AuthResponseDTO() {
    }

    public AuthResponseDTO(String token, User user) {
        this.token = token;
        this.user = user;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}
