package com.examino.ai.controller;

import com.examino.ai.dto.ExamRequest;
import com.examino.ai.model.Exam;
import com.examino.ai.model.ExamResult;
import com.examino.ai.service.TeacherService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/teacher")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TeacherController {

    private final TeacherService teacherService;

    @PostMapping("/create-exam")
    public ResponseEntity<Exam> createExam(@RequestBody ExamRequest request) {
        try {
            Exam exam = teacherService.createExam(request);
            return ResponseEntity.ok(exam);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/exams/{teacherId}")
    public ResponseEntity<List<Exam>> getTeacherExams(@PathVariable String teacherId) {
        List<Exam> exams = teacherService.getExamsByTeacher(teacherId);
        return ResponseEntity.ok(exams);
    }

    @PostMapping("/upload-answer-sheets")
    public ResponseEntity<String> uploadAnswerSheets(
            @RequestParam("examId") String examId,
            @RequestParam("files") MultipartFile[] files) {
        try {
            teacherService.processAnswerSheets(examId, files);
            return ResponseEntity.ok("Answer sheets processed successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error processing answer sheets: " + e.getMessage());
        }
    }

    @GetMapping("/download/question-paper/{examId}")
    public ResponseEntity<Resource> downloadQuestionPaper(@PathVariable String examId) {
        try {
            Resource resource = teacherService.downloadQuestionPaper(examId);
            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/download/answer-paper/{resultId}")
    public ResponseEntity<Resource> downloadAnswerPaper(@PathVariable String resultId) {
        try {
            Resource resource = teacherService.downloadAnswerPaper(resultId);
            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/delete-exam/{examId}")
    public ResponseEntity<Map<String, String>> deleteExam(@PathVariable String examId) {
        try {
            teacherService.deleteExam(examId);
            return ResponseEntity.ok(Map.of("message", "Exam deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to delete exam"));
        }
    }

    @GetMapping("/results/{examId}")
    public ResponseEntity<List<ExamResult>> getExamResults(@PathVariable String examId) {
        List<ExamResult> results = teacherService.getExamResults(examId);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/analytics/{examId}")
    public ResponseEntity<Map<String, Object>> getExamAnalytics(@PathVariable String examId) {
        Map<String, Object> analytics = teacherService.getExamAnalytics(examId);
        return ResponseEntity.ok(analytics);
    }

    @GetMapping("/class-performance/{teacherId}")
    public ResponseEntity<Map<String, Object>> getClassPerformance(@PathVariable String teacherId) {
        Map<String, Object> performance = teacherService.getClassPerformance(teacherId);
        return ResponseEntity.ok(performance);
    }

    @PostMapping("/ai-correct-exam")
    public ResponseEntity<Map<String, Object>> aiCorrectExam(
            @RequestParam("teacherId") String teacherId,
            @RequestParam("title") String title,
            @RequestParam("academicLevel") String academicLevel,
            @RequestParam("grade") String grade,
            @RequestParam("examPaper") MultipartFile examPaper,
            @RequestParam("answerSheets") MultipartFile[] answerSheets,
            @RequestParam("gradingScale") String gradingScale) {
        try {
            Map<String, Object> result = teacherService.aiCorrectExam(
                teacherId, title, academicLevel, grade, examPaper, answerSheets, gradingScale
            );
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}