package com.examino.ai.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User {
    @Id
    private String userId;
    
    @Column(unique = true)
    private String username;
    
    private String password;
    private String role;
    private String fullName;
    private String email;
    private String academicLevel;
    private String grade;
}