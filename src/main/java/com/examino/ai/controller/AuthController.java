package com.examino.ai.controller;

import com.examino.ai.dto.LoginRequest;
import com.examino.ai.dto.LoginResponse;
import com.examino.ai.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        try {
            LoginResponse response = authService.authenticate(request.getUsername(), request.getPassword(), request.getRole());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(LoginResponse.builder()
                            .success(false)
                            .message(e.getMessage())
                            .build());
        }
    }

    @PostMapping("/register")
    public ResponseEntity<LoginResponse> register(@RequestBody LoginRequest request) {
        try {
            LoginResponse response = authService.register(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(LoginResponse.builder()
                            .success(false)
                            .message("Registration failed: " + e.getMessage())
                            .build());
        }
    }

    @GetMapping("/validate-session")
    public ResponseEntity<LoginResponse> validateSession(@RequestParam String sessionId) {
        var session = authService.validateSession(sessionId);
        if (session != null) {
            return ResponseEntity.ok(LoginResponse.builder()
                    .success(true)
                    .userId(session.getUserId())
                    .username(session.getUsername())
                    .role(session.getRole())
                    .fullName(session.getFullName())
                    .email(session.getEmail())
                    .academicLevel(session.getAcademicLevel())
                    .grade(session.getGrade())
                    .token(sessionId)
                    .build());
        }
        return ResponseEntity.status(401).body(LoginResponse.builder().success(false).build());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestParam String sessionId) {
        authService.logout(sessionId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Map<String, String>> getUserById(@PathVariable String userId) {
        var user = authService.getUserById(userId);
        if (user != null) {
            return ResponseEntity.ok(Map.of(
                "userId", user.getUserId(),
                "username", user.getUsername(),
                "fullName", user.getFullName(),
                "role", user.getRole()
            ));
        }
        return ResponseEntity.notFound().build();
    }
}