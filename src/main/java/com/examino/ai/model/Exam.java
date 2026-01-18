package com.examino.ai.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "exams")
public class Exam {
    @Id
    private String examId;
    
    private String teacherId;
    private String title;
    
    @Column(length = 1000)
    private String description;
    
    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "exam_id")
    private List<Question> questions;
    
    private Integer duration;
    private String academicLevel;
    private String grade;
    
    @Column(length = 1000)
    private String gradingScale;
    
    private String questionPaperPath;
    private Instant createdAt;
    private boolean isActive;
}