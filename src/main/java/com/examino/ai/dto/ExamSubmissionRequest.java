package com.examino.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamSubmissionRequest {
    private String studentId;
    private String examId;
    private Map<String, String> answers; // questionId -> answer
}