package com.examino.ai.controller;

import com.examino.ai.dto.ExamEvaluationResponse;
import com.examino.ai.model.ExamResult;
import com.examino.ai.service.BedrockService;
import com.examino.ai.service.DynamoDbService;
import com.examino.ai.service.S3Service;
import com.examino.ai.service.TextractService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ExamController {

    private final S3Service s3Service;
    private final TextractService textractService;
    private final BedrockService bedrockService;
    private final DynamoDbService dynamoDbService;

    @PostMapping("/evaluate")
    public ResponseEntity<ExamEvaluationResponse> evaluateExam(
            @RequestParam("file") MultipartFile file,
            @RequestParam("rubric") String rubricJson,
            @RequestParam(value = "studentId", required = false) String studentId) {
        
        try {
            log.info("Starting exam evaluation for file: {}", file.getOriginalFilename());
            
            // Generate student ID if not provided
            if (studentId == null || studentId.trim().isEmpty()) {
                studentId = "student-" + UUID.randomUUID().toString().substring(0, 8);
            }
            
            // Step 1: Upload to S3
            String s3ObjectKey = s3Service.uploadExamScan(file);
            
            // Step 2: Extract text using Textract
            String extractedText = textractService.extractTextFromImage(s3ObjectKey);
            
            // Step 3: Grade using Bedrock (Claude 3 Haiku)
            Map<String, Object> gradingResult = bedrockService.gradeExam(extractedText, rubricJson);
            
            Integer score = (Integer) gradingResult.get("score");
            String feedback = (String) gradingResult.get("feedback");
            
            // Step 4: Save to DynamoDB
            ExamResult examResult = ExamResult.builder()
                    .studentId(studentId)
                    .examId(UUID.randomUUID().toString())
                    .score(score)
                    .feedback(feedback)
                    .extractedText(extractedText)
                    .createdAt(Instant.now())
                    .build();
            
            dynamoDbService.saveExamResult(examResult);
            
            // Step 5: Return response
            ExamEvaluationResponse response = ExamEvaluationResponse.builder()
                    .studentId(studentId)
                    .score(score)
                    .feedback(feedback)
                    .extractedText(extractedText)
                    .build();
            
            log.info("Exam evaluation completed for student: {} with score: {}", studentId, score);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error evaluating exam: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ExamEvaluationResponse.builder()
                            .studentId(studentId)
                            .score(0)
                            .feedback("Error processing exam: " + e.getMessage())
                            .extractedText("")
                            .build());
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "healthy", "service", "AI Examino System"));
    }
}