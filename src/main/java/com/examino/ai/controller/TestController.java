package com.examino.ai.controller;

import com.examino.ai.service.GradingTestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class TestController {

    private final GradingTestService gradingTestService;

    @GetMapping("/grading")
    public ResponseEntity<Map<String, Object>> testGrading() {
        try {
            log.info("Running AI grading tests...");
            Map<String, Object> results = gradingTestService.runGradingTests();
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            log.error("Grading test failed", e);
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Test execution failed: " + e.getMessage()));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        return ResponseEntity.ok(Map.of(
            "status", "healthy",
            "service", "AI Examino System",
            "timestamp", System.currentTimeMillis()
        ));
    }
}