package com.examino.ai.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "exam_results")
public class ExamResult {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String resultId;
    
    private String studentId;
    private String examId;
    private Integer score;
    private String feedback;
    
    @Column(length = 2000)
    private String extractedText;
    
    private String answerPaperPath;
    private Integer totalQuestions;
    private Integer correctAnswers;
    private Integer wrongAnswers;
    private Integer unanswered;
    private String grade;
    
    @Transient
    private Map<String, QuestionResult> questionResults;
    
    private Instant createdAt;
}