package com.examino.ai.dto;

import com.examino.ai.model.Question;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamRequest {
    private String teacherId;
    private String title;
    private String description;
    private List<Question> questions;
    private Integer duration;
    private String academicLevel;
    private String grade;
    private String gradingScale;
}