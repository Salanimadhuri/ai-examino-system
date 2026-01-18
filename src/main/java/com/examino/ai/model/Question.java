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
@Table(name = "questions")
public class Question {
    @Id
    private String questionId;
    
    @Column(length = 1000)
    private String questionText;
    
    @Column(length = 2000)
    private String expectedAnswer;
    
    private Integer marks;
    private String type;
}