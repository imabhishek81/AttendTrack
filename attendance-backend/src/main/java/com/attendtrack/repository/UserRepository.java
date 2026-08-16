package com.attendtrack.repository;

import com.attendtrack.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * ==========================================================
 * 🎓 Spring Boot Learning Note: Spring Data JPA Repositories
 * ==========================================================
 * By extending JpaRepository<User, Long>, Spring automatically generates:
 *   - save(user)              → INSERT or UPDATE
 *   - findById(id)            → SELECT ... WHERE id = ?
 *   - findAll()               → SELECT * FROM users
 *   - deleteById(id)          → DELETE FROM users WHERE id = ?
 * 
 * Derived Query Methods:
 *   findByEmail(email)        → SELECT * FROM users WHERE email = ?
 * ==========================================================
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
}
