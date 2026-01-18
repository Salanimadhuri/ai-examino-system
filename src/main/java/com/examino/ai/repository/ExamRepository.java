package com.examino.ai.repository;

import com.examino.ai.model.Exam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamRepository extends JpaRepository<Exam, String> {
    List<Exam> findByTeacherId(String teacherId);
    List<Exam> findByAcademicLevelAndGradeAndIsActiveTrue(String academicLevel, String grade);
}
