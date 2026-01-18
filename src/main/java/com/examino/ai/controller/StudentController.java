package com.examino.ai.controller;

import com.examino.ai.dto.ExamSubmissionRequest;
import com.examino.ai.model.Exam;
import com.examino.ai.model.ExamResult;
import com.examino.ai.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StudentController {

    private final StudentService studentService;

    @GetMapping("/available-exams")
    public ResponseEntity<List<Exam>> getAvailableExams(@RequestParam String studentId) {
        List<Exam> exams = studentService.getAvailableExamsForStudent(studentId);
        return ResponseEntity.ok(exams);
    }

    @GetMapping("/exam/{examId}")
    public ResponseEntity<Exam> getExam(@PathVariable String examId) {
        try {
            Exam exam = studentService.getExamById(examId);
            return ResponseEntity.ok(exam);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/submit-exam")
    public ResponseEntity<ExamResult> submitExam(@RequestBody ExamSubmissionRequest request) {
        try {
            ExamResult result = studentService.submitExam(request);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/results/{studentId}")
    public ResponseEntity<List<ExamResult>> getStudentResults(@PathVariable String studentId) {
        List<ExamResult> results = studentService.getStudentResults(studentId);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/dashboard/{studentId}")
    public ResponseEntity<Object> getStudentDashboard(@PathVariable String studentId) {
        Object dashboard = studentService.getStudentDashboard(studentId);
        return ResponseEntity.ok(dashboard);
    }

    @GetMapping("/download/my-answer/{examId}")
    public ResponseEntity<Resource> downloadMyAnswer(@PathVariable String examId, @RequestParam String studentId) {
        try {
            Resource resource = studentService.downloadStudentAnswer(studentId, examId);
            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}