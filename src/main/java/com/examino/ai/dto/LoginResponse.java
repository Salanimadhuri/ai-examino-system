package com.examino.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private boolean success;
    private String message;
    private String userId;
    private String username;
    private String role;
    private String fullName;
    private String email;
    private String academicLevel;
    private String grade;
    private String token;
}