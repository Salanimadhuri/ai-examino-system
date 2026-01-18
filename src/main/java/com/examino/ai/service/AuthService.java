package com.examino.ai.service;

import com.examino.ai.dto.LoginRequest;
import com.examino.ai.dto.LoginResponse;
import com.examino.ai.model.User;
import com.examino.ai.model.UserSession;
import com.examino.ai.repository.UserRepository;
import com.examino.ai.repository.UserSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final UserSessionRepository sessionRepository;

    @Transactional
    public LoginResponse authenticate(String username, String password, String requestedRole) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));
        
        if (!user.getPassword().equals(password)) {
            throw new RuntimeException("Invalid credentials");
        }

        if (!user.getRole().equals(requestedRole)) {
            if ("TEACHER".equals(requestedRole)) {
                throw new RuntimeException("Not a teacher account");
            } else if ("STUDENT".equals(requestedRole)) {
                throw new RuntimeException("Not a student account");
            }
        }

        // Create session in database
        String sessionId = UUID.randomUUID().toString();
        UserSession session = UserSession.builder()
                .sessionId(sessionId)
                .userId(user.getUserId())
                .username(user.getUsername())
                .role(user.getRole())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .academicLevel(user.getAcademicLevel())
                .grade(user.getGrade())
                .createdAt(Instant.now())
                .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
                .isActive(true)
                .build();
        
        sessionRepository.save(session);

        log.info("User authenticated: {} with role: {}, sessionId: {}", username, user.getRole(), sessionId);

        return LoginResponse.builder()
                .success(true)
                .message("Login successful")
                .userId(user.getUserId())
                .username(user.getUsername())
                .role(user.getRole())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .academicLevel(user.getAcademicLevel())
                .grade(user.getGrade())
                .token(sessionId)
                .build();
    }

    @Transactional
    public LoginResponse register(LoginRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        if (!"TEACHER".equals(request.getRole()) && !"STUDENT".equals(request.getRole())) {
            throw new RuntimeException("Invalid role. Must be TEACHER or STUDENT");
        }

        String userId = UUID.randomUUID().toString();
        User user = User.builder()
                .userId(userId)
                .username(request.getUsername())
                .password(request.getPassword())
                .role(request.getRole())
                .fullName(request.getFullName())
                .email(request.getEmail())
                .academicLevel(request.getAcademicLevel())
                .grade(request.getGrade())
                .build();

        userRepository.save(user);

        // Create session
        String sessionId = UUID.randomUUID().toString();
        UserSession session = UserSession.builder()
                .sessionId(sessionId)
                .userId(userId)
                .username(user.getUsername())
                .role(user.getRole())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .academicLevel(user.getAcademicLevel())
                .grade(user.getGrade())
                .createdAt(Instant.now())
                .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
                .isActive(true)
                .build();
        
        sessionRepository.save(session);

        log.info("User registered: {} with role: {}, level: {}, grade: {}", request.getUsername(), request.getRole(), request.getAcademicLevel(), request.getGrade());

        return LoginResponse.builder()
                .success(true)
                .message("Registration successful")
                .userId(userId)
                .username(user.getUsername())
                .role(user.getRole())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .academicLevel(user.getAcademicLevel())
                .grade(user.getGrade())
                .token(sessionId)
                .build();
    }

    public UserSession validateSession(String sessionId) {
        return sessionRepository.findBySessionIdAndIsActiveTrue(sessionId)
                .filter(session -> session.getExpiresAt().isAfter(Instant.now()))
                .orElse(null);
    }

    @Transactional
    public void logout(String sessionId) {
        sessionRepository.findById(sessionId).ifPresent(session -> {
            session.setActive(false);
            sessionRepository.save(session);
            log.info("Session logged out: {}", sessionId);
        });
    }

    public User getUserById(String userId) {
        return userRepository.findById(userId).orElse(null);
    }
}