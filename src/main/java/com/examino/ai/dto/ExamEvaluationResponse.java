package com.examino.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamEvaluationResponse {
    private String studentId;
    private Integer score;
    private String feedback;
    private String extractedText;
}