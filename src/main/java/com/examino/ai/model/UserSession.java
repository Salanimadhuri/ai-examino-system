package com.examino.ai.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "user_sessions")
public class UserSession {
    @Id
    private String sessionId;
    
    private String userId;
    private String username;
    private String role;
    private String fullName;
    private String email;
    private String academicLevel;
    private String grade;
    
    private Instant createdAt;
    private Instant expiresAt;
    private boolean isActive;
}
