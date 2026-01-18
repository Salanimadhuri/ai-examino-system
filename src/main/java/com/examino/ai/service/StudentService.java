package com.examino.ai.service;

import com.examino.ai.dto.ExamSubmissionRequest;
import com.examino.ai.model.Exam;
import com.examino.ai.model.ExamResult;
import com.examino.ai.model.Question;
import com.examino.ai.model.QuestionResult;
import com.examino.ai.model.User;
import com.examino.ai.repository.ExamResultRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudentService {

    private final AuthService authService;
    private final FileStorageService fileStorageService;
    private final TeacherService teacherService;
    private final ExamResultRepository examResultRepository;
    private final AiGradingService aiGradingService;
    
    public static void addExam(Exam exam) {
        // No longer needed with database
    }

    public List<Exam> getAvailableExamsForStudent(String studentId) {
        User student = authService.getUserById(studentId);
        if (student == null) {
            log.warn("Student not found: {}", studentId);
            return new ArrayList<>();
        }
        
        log.info("Finding exams for student: {} (Level: {}, Grade: {})", studentId, student.getAcademicLevel(), student.getGrade());
        
        List<Exam> allExams = teacherService.getAllExams();
        log.info("Total exams in database: {}", allExams.size());
        
        // Show all exam details
        for (Exam exam : allExams) {
            log.info("Exam: {} - Active: {}, Level: '{}', Grade: '{}'", 
                exam.getTitle(), exam.isActive(), exam.getAcademicLevel(), exam.getGrade());
        }
        
        // TEMPORARY: Return all active exams to debug
        List<Exam> activeExams = allExams.stream()
                .filter(Exam::isActive)
                .collect(Collectors.toList());
        
        log.info("Returning {} active exams (filtering disabled for debugging)", activeExams.size());
        return activeExams;
        
        /* Original filtering code - uncomment after debugging:
        List<Exam> filteredExams = allExams.stream()
                .filter(Exam::isActive)
                .filter(exam -> exam.getAcademicLevel() != null && exam.getAcademicLevel().equals(student.getAcademicLevel()))
                .filter(exam -> exam.getGrade() != null && exam.getGrade().equals(student.getGrade()))
                .collect(Collectors.toList());
        
        log.info("Filtered exams for student: {}", filteredExams.size());
        return filteredExams;
        */
    }

    public Exam getExamById(String examId) {
        Exam exam = teacherService.getExamById(examId);
        if (exam == null) {
            throw new RuntimeException("Exam not found");
        }
        return exam;
    }

    public ExamResult submitExam(ExamSubmissionRequest request) {
        Exam exam = getExamById(request.getExamId());
        
        int totalQuestions = exam.getQuestions().size();
        int correctAnswers = 0;
        int wrongAnswers = 0;
        int unanswered = 0;
        Map<String, QuestionResult> questionResults = new HashMap<>();
        
        // Grade each question using AI
        for (Question question : exam.getQuestions()) {
            String studentAnswer = request.getAnswers().get(question.getQuestionId());
            
            try {
                if (studentAnswer == null || studentAnswer.trim().isEmpty()) {
                    unanswered++;
                    QuestionResult qResult = QuestionResult.builder()
                            .questionId(question.getQuestionId())
                            .studentAnswer("")
                            .correctAnswer(question.getExpectedAnswer())
                            .isCorrect(false)
                            .marksObtained(0)
                            .totalMarks(question.getMarks())
                            .feedback("No answer provided")
                            .build();
                    questionResults.put(question.getQuestionId(), qResult);
                    continue;
                }
                
                // Use AI grading service with error handling
                AiGradingService.GradingResult gradingResult = aiGradingService.gradeAnswer(
                        question.getQuestionText(),
                        question.getExpectedAnswer(),
                        studentAnswer,
                        question.getMarks()
                );
                
                if (gradingResult.isCorrect()) {
                    correctAnswers++;
                } else {
                    wrongAnswers++;
                }
                
                QuestionResult qResult = QuestionResult.builder()
                        .questionId(question.getQuestionId())
                        .studentAnswer(studentAnswer)
                        .correctAnswer(question.getExpectedAnswer())
                        .isCorrect(gradingResult.isCorrect())
                        .marksObtained(gradingResult.getMarksEarned())
                        .totalMarks(question.getMarks())
                        .feedback(gradingResult.getFeedback())
                        .build();
                
                questionResults.put(question.getQuestionId(), qResult);
                
                log.debug("Graded question {}: {}/{} marks ({}%)", 
                    question.getQuestionId(), gradingResult.getMarksEarned(), 
                    question.getMarks(), gradingResult.getAccuracy());
                    
            } catch (Exception e) {
                log.error("Failed to grade question {}: {}", question.getQuestionId(), e.getMessage());
                wrongAnswers++;
                
                // Fallback grading result
                QuestionResult qResult = QuestionResult.builder()
                        .questionId(question.getQuestionId())
                        .studentAnswer(studentAnswer)
                        .correctAnswer(question.getExpectedAnswer())
                        .isCorrect(false)
                        .marksObtained(0)
                        .totalMarks(question.getMarks())
                        .feedback("Grading error - please review manually")
                        .build();
                
                questionResults.put(question.getQuestionId(), qResult);
            }
        }
        
        int totalMarks = exam.getQuestions().stream().mapToInt(Question::getMarks).sum();
        int obtainedMarks = questionResults.values().stream().mapToInt(QuestionResult::getMarksObtained).sum();
        int score = totalMarks > 0 ? (int) Math.round((obtainedMarks * 100.0) / totalMarks) : 0;
        
        String grade;
        String status;
        if (score >= 90) {
            grade = "A+";
            status = "Excellent";
        } else if (score >= 80) {
            grade = "A";
            status = "Very Good";
        } else if (score >= 70) {
            grade = "B";
            status = "Good";
        } else if (score >= 60) {
            grade = "C";
            status = "Satisfactory";
        } else if (score >= 50) {
            grade = "D";
            status = "Pass";
        } else {
            grade = "F";
            status = "Fail";
        }
        
        ExamResult result = ExamResult.builder()
                .studentId(request.getStudentId())
                .examId(request.getExamId())
                .score(score)
                .feedback(status)
                .extractedText(totalQuestions + "|" + correctAnswers + "|" + exam.getTitle())
                .totalQuestions(totalQuestions)
                .correctAnswers(correctAnswers)
                .wrongAnswers(wrongAnswers)
                .unanswered(unanswered)
                .grade(grade)
                .questionResults(questionResults)
                .createdAt(Instant.now())
                .build();

        examResultRepository.save(result);
        
        log.info("Exam graded and saved: studentId={}, examId={}, score={}, grade={}", 
                request.getStudentId(), request.getExamId(), score, grade);
        
        return result;
    }

    public List<ExamResult> getStudentResults(String studentId) {
        return examResultRepository.findByStudentId(studentId);
    }

    public List<ExamResult> getAllResults() {
        return examResultRepository.findAll();
    }

    public Object getStudentDashboard(String studentId) {
        List<ExamResult> results = getStudentResults(studentId);
        
        if (results.isEmpty()) {
            return Map.of(
                "totalExams", 0,
                "averageScore", 0.0,
                "message", "No exams attempted yet"
            );
        }
        
        // Calculate analytics
        int totalCorrect = results.stream().mapToInt(ExamResult::getCorrectAnswers).sum();
        int totalWrong = results.stream().mapToInt(ExamResult::getWrongAnswers).sum();
        int totalAttempted = totalCorrect + totalWrong;
        double accuracyRate = totalAttempted > 0 ? (totalCorrect * 100.0) / totalAttempted : 0;
        
        Map<String, Integer> gradeDistribution = new HashMap<>();
        results.forEach(r -> gradeDistribution.merge(r.getGrade(), 1, Integer::sum));
        
        String mostCommonGrade = gradeDistribution.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("N/A");
        
        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("totalExams", results.size());
        dashboard.put("averageScore", results.stream().mapToInt(ExamResult::getScore).average().orElse(0.0));
        dashboard.put("highestScore", results.stream().mapToInt(ExamResult::getScore).max().orElse(0));
        dashboard.put("lowestScore", results.stream().mapToInt(ExamResult::getScore).min().orElse(0));
        dashboard.put("mostCommonGrade", mostCommonGrade);
        dashboard.put("totalQuestionsAttempted", totalAttempted);
        dashboard.put("totalCorrectAnswers", totalCorrect);
        dashboard.put("totalWrongAnswers", totalWrong);
        dashboard.put("accuracyRate", Math.round(accuracyRate * 100.0) / 100.0);
        dashboard.put("gradeDistribution", gradeDistribution);
        dashboard.put("recentResults", results.stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(5)
                .collect(Collectors.toList()));
        
        return dashboard;
    }

    public Resource downloadStudentAnswer(String studentId, String examId) {
        ExamResult result = examResultRepository.findByStudentId(studentId).stream()
                .filter(r -> r.getExamId().equals(examId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Answer paper not found"));
        
        if (result.getAnswerPaperPath() == null) {
            throw new RuntimeException("Answer paper not found");
        }
        return fileStorageService.loadFileAsResource(result.getAnswerPaperPath());
    }
}