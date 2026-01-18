package com.examino.ai.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class GradingTestService {

    private final AiGradingService aiGradingService;

    public Map<String, Object> runGradingTests() {
        log.info("Starting comprehensive AI grading tests...");
        
        List<TestCase> testCases = createTestCases();
        List<Map<String, Object>> results = new ArrayList<>();
        int passed = 0;
        int failed = 0;

        for (TestCase testCase : testCases) {
            try {
                AiGradingService.GradingResult result = aiGradingService.gradeAnswer(
                    testCase.question,
                    testCase.expectedAnswer,
                    testCase.studentAnswer,
                    testCase.totalMarks
                );

                boolean testPassed = validateResult(result, testCase);
                if (testPassed) {
                    passed++;
                } else {
                    failed++;
                }

                results.add(Map.of(
                    "testName", testCase.name,
                    "passed", testPassed,
                    "expectedMarks", testCase.expectedMarksRange,
                    "actualMarks", result.getMarksEarned(),
                    "accuracy", result.getAccuracy(),
                    "feedback", result.getFeedback()
                ));

                log.info("Test '{}': {} - Marks: {}/{}, Accuracy: {}%", 
                    testCase.name, testPassed ? "PASSED" : "FAILED", 
                    result.getMarksEarned(), testCase.totalMarks, result.getAccuracy());

            } catch (Exception e) {
                failed++;
                results.add(Map.of(
                    "testName", testCase.name,
                    "passed", false,
                    "error", e.getMessage()
                ));
                log.error("Test '{}' failed with exception: {}", testCase.name, e.getMessage());
            }
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalTests", testCases.size());
        summary.put("passed", passed);
        summary.put("failed", failed);
        summary.put("successRate", (double) passed / testCases.size() * 100);
        summary.put("results", results);

        log.info("Grading tests completed: {}/{} passed ({}%)", 
            passed, testCases.size(), Math.round((double) passed / testCases.size() * 100));

        return summary;
    }

    private List<TestCase> createTestCases() {
        return Arrays.asList(
            // Exact matches
            new TestCase("Exact Match", 
                "What is the capital of France?", 
                "Paris", 
                "Paris", 
                10, new int[]{10, 10}),
            
            // Case variations
            new TestCase("Case Insensitive", 
                "What is the capital of France?", 
                "Paris", 
                "paris", 
                10, new int[]{9, 10}),
            
            // Synonyms
            new TestCase("Synonyms", 
                "What is a large body of water?", 
                "Ocean", 
                "Sea", 
                10, new int[]{7, 10}),
            
            // Paraphrasing
            new TestCase("Paraphrasing", 
                "Explain photosynthesis", 
                "Plants convert sunlight into energy", 
                "Plants use sunlight to make energy", 
                10, new int[]{7, 10}),
            
            // Partial answers
            new TestCase("Partial Answer", 
                "List three primary colors", 
                "Red, Blue, Yellow", 
                "Red, Blue", 
                10, new int[]{5, 8}),
            
            // Spelling errors
            new TestCase("Minor Spelling Error", 
                "What is the largest planet?", 
                "Jupiter", 
                "Jupitor", 
                10, new int[]{7, 10}),
            
            // Mathematical expressions
            new TestCase("Math Expression", 
                "What is 2 + 2?", 
                "4", 
                "Four", 
                5, new int[]{4, 5}),
            
            // Wrong answers
            new TestCase("Wrong Answer", 
                "What is the capital of France?", 
                "Paris", 
                "London", 
                10, new int[]{0, 2}),
            
            // Empty answers
            new TestCase("Empty Answer", 
                "What is the capital of France?", 
                "Paris", 
                "", 
                10, new int[]{0, 0}),
            
            // Complex answers
            new TestCase("Complex Answer", 
                "Explain the water cycle", 
                "Water evaporates from oceans, forms clouds, and falls as rain", 
                "Water goes up from the sea, makes clouds, then comes down as precipitation", 
                15, new int[]{10, 15})
        );
    }

    private boolean validateResult(AiGradingService.GradingResult result, TestCase testCase) {
        // Check if marks are within expected range
        boolean marksValid = result.getMarksEarned() >= testCase.expectedMarksRange[0] && 
                           result.getMarksEarned() <= testCase.expectedMarksRange[1];
        
        // Check if accuracy is reasonable
        boolean accuracyValid = result.getAccuracy() >= 0 && result.getAccuracy() <= 100;
        
        // Check if feedback is provided
        boolean feedbackValid = result.getFeedback() != null && !result.getFeedback().trim().isEmpty();
        
        return marksValid && accuracyValid && feedbackValid;
    }

    private static class TestCase {
        final String name;
        final String question;
        final String expectedAnswer;
        final String studentAnswer;
        final int totalMarks;
        final int[] expectedMarksRange; // [min, max]

        TestCase(String name, String question, String expectedAnswer, String studentAnswer, 
                int totalMarks, int[] expectedMarksRange) {
            this.name = name;
            this.question = question;
            this.expectedAnswer = expectedAnswer;
            this.studentAnswer = studentAnswer;
            this.totalMarks = totalMarks;
            this.expectedMarksRange = expectedMarksRange;
        }
    }
}