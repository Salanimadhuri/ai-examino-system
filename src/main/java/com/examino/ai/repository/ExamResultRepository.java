package com.examino.ai.repository;

import com.examino.ai.model.ExamResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamResultRepository extends JpaRepository<ExamResult, String> {
    List<ExamResult> findByExamId(String examId);
    List<ExamResult> findByStudentId(String studentId);
    
    @Modifying
    void deleteByExamId(String examId);
}
