package com.attendtrack.service;

import com.attendtrack.dto.UserProfileDTO;
import com.attendtrack.entity.Semester;
import com.attendtrack.entity.User;
import com.attendtrack.exception.ResourceNotFoundException;
import com.attendtrack.repository.SemesterRepository;
import com.attendtrack.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final SemesterRepository semesterRepository;

    public UserService(UserRepository userRepository, SemesterRepository semesterRepository) {
        this.userRepository = userRepository;
        this.semesterRepository = semesterRepository;
    }

    public UserProfileDTO getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Double requiredAttendance = 75.0;
        var semesterOpt = semesterRepository.findFirstByUserIdOrderByIdDesc(userId);
        if (semesterOpt.isPresent()) {
            requiredAttendance = semesterOpt.get().getRequiredAttendance();
        }

        return new UserProfileDTO(user.getId(), user.getName(), user.getEmail(), user.getAvatarUrl(), requiredAttendance);
    }

    @Transactional
    public UserProfileDTO updateProfile(Long userId, UserProfileDTO updateRequest) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (updateRequest.getName() != null && !updateRequest.getName().isBlank()) {
            user.setName(updateRequest.getName().trim());
        }
        if (updateRequest.getAvatarUrl() != null) {
            user.setAvatarUrl(updateRequest.getAvatarUrl());
        }
        userRepository.save(user);

        if (updateRequest.getRequiredAttendance() != null) {
            var semesterOpt = semesterRepository.findFirstByUserIdOrderByIdDesc(userId);
            if (semesterOpt.isPresent()) {
                Semester semester = semesterOpt.get();
                semester.setRequiredAttendance(updateRequest.getRequiredAttendance());
                semesterRepository.save(semester);
            }
        }

        return getUserProfile(userId);
    }
}
