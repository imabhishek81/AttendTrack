package com.attendtrack.repository;

import com.attendtrack.entity.Semester;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SemesterRepository extends JpaRepository<Semester, Long> {
    List<Semester> findByUserId(Long userId);
    Optional<Semester> findFirstByUserIdOrderByIdDesc(Long userId);
}
