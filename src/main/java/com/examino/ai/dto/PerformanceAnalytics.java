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
public class PerformanceAnalytics {
    private Integer totalExams;
    private Double averageScore;
    private Integer highestScore;
    private Integer lowestScore;
    private String mostCommonGrade;
    private Integer totalQuestionsAttempted;
    private Integer totalCorrectAnswers;
    private Integer totalWrongAnswers;
    private Double accuracyRate;
    private Map<String, Integer> gradeDistribution;
    private Map<String, Double> subjectPerformance;
}
