package com.examino.ai.service;

import com.examino.ai.dto.ExamRequest;
import com.examino.ai.model.Exam;
import com.examino.ai.model.ExamResult;
import com.examino.ai.repository.ExamRepository;
import com.examino.ai.repository.ExamResultRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TeacherService {

    private final FileStorageService fileStorageService;
    private final ExamRepository examRepository;
    private final ExamResultRepository examResultRepository;

    public Exam createExam(ExamRequest request) {
        String examId = UUID.randomUUID().toString();
        
        Exam exam = Exam.builder()
                .examId(examId)
                .teacherId(request.getTeacherId())
                .title(request.getTitle())
                .description(request.getDescription())
                .questions(request.getQuestions() != null ? request.getQuestions() : new ArrayList<>())
                .duration(request.getDuration())
                .academicLevel(request.getAcademicLevel())
                .grade(request.getGrade())
                .gradingScale(request.getGradingScale())
                .createdAt(Instant.now())
                .isActive(true)
                .build();

        examRepository.save(exam);
        
        log.info("Created exam: {} - {} for level: {}, grade: {}", examId, request.getTitle(), request.getAcademicLevel(), request.getGrade());
        
        return exam;
    }

    public List<Exam> getExamsByTeacher(String teacherId) {
        return examRepository.findByTeacherId(teacherId);
    }

    @Transactional
    public void deleteExam(String examId) {
        // Delete related exam results first
        examResultRepository.deleteByExamId(examId);
        // Then delete the exam
        examRepository.deleteById(examId);
        log.info("Deleted exam and related results: {}", examId);
    }

    public List<ExamResult> getExamResults(String examId) {
        return examResultRepository.findByExamId(examId);
    }

    public void processAnswerSheets(String examId, MultipartFile[] files) throws Exception {
        log.info("Processing {} answer sheets for exam: {}", files.length, examId);
    }

    public Exam getExamById(String examId) {
        return examRepository.findById(examId).orElse(null);
    }

    public List<Exam> getAllExams() {
        return examRepository.findAll();
    }

    public Resource downloadQuestionPaper(String examId) {
        Exam exam = examRepository.findById(examId).orElse(null);
        if (exam == null || exam.getQuestionPaperPath() == null) {
            throw new RuntimeException("Question paper not found");
        }
        return fileStorageService.loadFileAsResource(exam.getQuestionPaperPath());
    }

    public Resource downloadAnswerPaper(String resultId) {
        ExamResult result = examResultRepository.findById(resultId)
                .orElseThrow(() -> new RuntimeException("Answer paper not found"));
        
        if (result.getAnswerPaperPath() == null) {
            throw new RuntimeException("Answer paper not found");
        }
        return fileStorageService.loadFileAsResource(result.getAnswerPaperPath());
    }

    public Map<String, Object> getExamAnalytics(String examId) {
        List<ExamResult> results = examResultRepository.findByExamId(examId);
        
        if (results.isEmpty()) {
            return Map.of("message", "No submissions yet");
        }
        
        Map<String, Object> analytics = new HashMap<>();
        analytics.put("totalSubmissions", results.size());
        analytics.put("averageScore", results.stream().mapToInt(ExamResult::getScore).average().orElse(0.0));
        analytics.put("highestScore", results.stream().mapToInt(ExamResult::getScore).max().orElse(0));
        analytics.put("lowestScore", results.stream().mapToInt(ExamResult::getScore).min().orElse(0));
        analytics.put("passRate", results.stream().filter(r -> r.getScore() >= 50).count() * 100.0 / results.size());
        
        Map<String, Long> gradeDistribution = results.stream()
                .collect(Collectors.groupingBy(ExamResult::getGrade, Collectors.counting()));
        analytics.put("gradeDistribution", gradeDistribution);
        
        Map<String, Double> scoreRanges = new HashMap<>();
        scoreRanges.put("90-100", results.stream().filter(r -> r.getScore() >= 90).count() * 100.0 / results.size());
        scoreRanges.put("80-89", results.stream().filter(r -> r.getScore() >= 80 && r.getScore() < 90).count() * 100.0 / results.size());
        scoreRanges.put("70-79", results.stream().filter(r -> r.getScore() >= 70 && r.getScore() < 80).count() * 100.0 / results.size());
        scoreRanges.put("60-69", results.stream().filter(r -> r.getScore() >= 60 && r.getScore() < 70).count() * 100.0 / results.size());
        scoreRanges.put("50-59", results.stream().filter(r -> r.getScore() >= 50 && r.getScore() < 60).count() * 100.0 / results.size());
        scoreRanges.put("Below 50", results.stream().filter(r -> r.getScore() < 50).count() * 100.0 / results.size());
        analytics.put("scoreRanges", scoreRanges);
        
        return analytics;
    }

    public Map<String, Object> getClassPerformance(String teacherId) {
        List<Exam> teacherExams = getExamsByTeacher(teacherId);
        List<ExamResult> allResults = examResultRepository.findAll().stream()
                .filter(r -> teacherExams.stream().anyMatch(e -> e.getExamId().equals(r.getExamId())))
                .collect(Collectors.toList());
        
        if (allResults.isEmpty()) {
            return Map.of("message", "No student submissions yet");
        }
        
        Map<String, Object> performance = new HashMap<>();
        performance.put("totalExams", teacherExams.size());
        performance.put("totalStudents", allResults.stream().map(ExamResult::getStudentId).distinct().count());
        performance.put("totalSubmissions", allResults.size());
        performance.put("overallAverageScore", allResults.stream().mapToInt(ExamResult::getScore).average().orElse(0.0));
        performance.put("overallPassRate", allResults.stream().filter(r -> r.getScore() >= 50).count() * 100.0 / allResults.size());
        
        Map<String, Double> examAverages = new HashMap<>();
        for (Exam exam : teacherExams) {
            double avg = allResults.stream()
                    .filter(r -> r.getExamId().equals(exam.getExamId()))
                    .mapToInt(ExamResult::getScore)
                    .average()
                    .orElse(0.0);
            examAverages.put(exam.getTitle(), avg);
        }
        performance.put("examAverages", examAverages);
        
        Map<String, Long> overallGradeDistribution = allResults.stream()
                .collect(Collectors.groupingBy(ExamResult::getGrade, Collectors.counting()));
        performance.put("gradeDistribution", overallGradeDistribution);
        
        return performance;
    }

    public Map<String, Object> aiCorrectExam(String teacherId, String title, String academicLevel, String grade,
                                              MultipartFile examPaper, MultipartFile[] answerSheets,
                                              String gradingScale) throws Exception {
        log.info("Starting AI exam correction: {} - {} answer sheets", title, answerSheets.length);
        
        // Create exam in database first
        String examId = UUID.randomUUID().toString();
        // Create sample questions for AI corrected exam (since we processed the exam paper)
        List<Map<String, Object>> sampleQuestions = Arrays.asList(
            Map.of(
                "questionId", "q1",
                "questionText", "Question extracted from exam paper",
                "expectedAnswer", "AI analyzed expected answer",
                "marks", 10,
                "type", "TEXT"
            ),
            Map.of(
                "questionId", "q2", 
                "questionText", "Question extracted from exam paper",
                "expectedAnswer", "AI analyzed expected answer",
                "marks", 10,
                "type", "TEXT"
            ),
            Map.of(
                "questionId", "q3",
                "questionText", "Question extracted from exam paper", 
                "expectedAnswer", "AI analyzed expected answer",
                "marks", 10,
                "type", "TEXT"
            )
        );
        
        Exam exam = Exam.builder()
                .examId(examId)
                .teacherId(teacherId)
                .title(title)
                .description("AI Corrected Exam")
                .academicLevel(academicLevel)
                .grade(grade)
                .duration(60)
                .gradingScale(gradingScale)
                .questions(new ArrayList<>()) // Convert to proper Question objects later
                .createdAt(Instant.now())
                .isActive(true)
                .build();
        
        // Store exam paper
        String examPaperPath = fileStorageService.storeFile(examPaper);
        exam.setQuestionPaperPath(examPaperPath);
        
        // Save exam to database
        examRepository.save(exam);
        log.info("Exam created in database: {}", examId);
        
        List<Map<String, Object>> results = new ArrayList<>();
        int creditsUsed = answerSheets.length;
        
        // Process each answer sheet and save results to database
        for (int i = 0; i < answerSheets.length; i++) {
            MultipartFile answerSheet = answerSheets[i];
            String answerPath = fileStorageService.storeFile(answerSheet);
            
            // Simulate AI grading (replace with actual AWS Textract + Bedrock integration)
            int score = 60 + (int)(Math.random() * 40); // Random score 60-100
            String gradeResult;
            String feedback;
            if (score >= 90) {
                gradeResult = "A";
                feedback = "Excellent";
            } else if (score >= 80) {
                gradeResult = "B";
                feedback = "Very Good";
            } else if (score >= 70) {
                gradeResult = "C";
                feedback = "Good";
            } else if (score >= 60) {
                gradeResult = "D";
                feedback = "Satisfactory";
            } else {
                gradeResult = "F";
                feedback = "Needs Improvement";
            }
            
            // Create and save ExamResult entity
            ExamResult examResult = ExamResult.builder()
                    .resultId(UUID.randomUUID().toString())
                    .examId(examId)
                    .studentId("ai-student-" + (i + 1)) // Synthetic student ID for AI corrections
                    .score(score)
                    .grade(gradeResult)
                    .feedback(feedback)
                    .extractedText("AI|Corrected|Student " + (i + 1) + "|" + title) // Store student name in extractedText
                    .answerPaperPath(answerPath)
                    .createdAt(Instant.now())
                    .build();
            
            examResultRepository.save(examResult);
            log.info("Saved AI correction result for Student {}: {}% - {}", (i + 1), score, gradeResult);
            
            results.add(Map.of(
                "studentName", "Student " + (i + 1),
                "score", score,
                "grade", gradeResult,
                "answerPath", answerPath
            ));
        }
        
        int remainingCredits = 100 - creditsUsed; // Simplified credit tracking
        
        return Map.of(
            "results", results,
            "remainingCredits", remainingCredits,
            "creditsUsed", creditsUsed,
            "examId", examId
        );
    }
}