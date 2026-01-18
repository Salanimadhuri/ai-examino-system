package com.examino.ai.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionResult {
    private String questionId;
    private String studentAnswer;
    private String correctAnswer;
    private boolean isCorrect;
    private Integer marksObtained;
    private Integer totalMarks;
    private String feedback;
}
