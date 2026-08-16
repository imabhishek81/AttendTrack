package com.attendtrack.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

/**
 * ==========================================================
 * 🎓 Spring Boot Learning Note: @Entity & JPA Mapping
 * ==========================================================
 * 1. @Entity: Tells Hibernate that this class maps to a relational database table.
 * 2. @Table(name = "users"): Specifies the table name in MySQL.
 * 3. @Id: Marks the primary key field.
 * 4. @GeneratedValue(strategy = GenerationType.IDENTITY): Uses MySQL AUTO_INCREMENT.
 * 5. @Column: Customizes column properties like uniqueness, nullable, length.
 * ==========================================================
 */
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(columnDefinition = "TEXT")
    private String avatarUrl;

    @Column(length = 255)
    private String password;

    // Constructors
    public User() {
    }

    public User(String name, String email, String avatarUrl) {
        this.name = name;
        this.email = email;
        this.avatarUrl = avatarUrl;
    }

    // Getters and Setters
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

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
