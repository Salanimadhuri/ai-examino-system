package com.examino.ai.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;
import software.amazon.awssdk.services.bedrockruntime.model.InvokeModelRequest;
import software.amazon.awssdk.services.bedrockruntime.model.InvokeModelResponse;
import software.amazon.awssdk.core.SdkBytes;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiGradingService {

    private final BedrockRuntimeClient bedrockClient;
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @Value("${ai.grading.enabled:true}")
    private boolean aiGradingEnabled;
    
    @Value("${ai.grading.fallback.enabled:true}")
    private boolean fallbackEnabled;
    
    @Value("${ai.grading.timeout:30000}")
    private long timeoutMs;

    public GradingResult gradeAnswer(String question, String expectedAnswer, String studentAnswer, int totalMarks) {
        // Input validation
        if (question == null || question.trim().isEmpty()) {
            log.warn("Question is null or empty");
            return new GradingResult(0, 0, "Invalid question", false);
        }
        
        if (expectedAnswer == null || expectedAnswer.trim().isEmpty()) {
            log.warn("Expected answer is null or empty");
            return new GradingResult(0, 0, "No expected answer provided", false);
        }
        
        if (studentAnswer == null || studentAnswer.trim().isEmpty()) {
            return new GradingResult(0, 0, "No answer provided", false);
        }
        
        if (totalMarks <= 0) {
            log.warn("Invalid total marks: {}", totalMarks);
            return new GradingResult(0, 0, "Invalid marking scheme", false);
        }

        // Try AI grading if enabled
        if (aiGradingEnabled) {
            try {
                log.debug("Attempting AI grading for question: {}", question.substring(0, Math.min(50, question.length())));
                String prompt = buildGradingPrompt(question, expectedAnswer, studentAnswer, totalMarks);
                String aiResponse = invokeBedrockModelWithTimeout(prompt);
                GradingResult result = parseGradingResponse(aiResponse, totalMarks);
                log.info("AI grading successful: {}% accuracy, {} marks", result.getAccuracy(), result.getMarksEarned());
                return result;
            } catch (Exception e) {
                log.warn("AI grading failed: {}", e.getMessage());
                if (!fallbackEnabled) {
                    return new GradingResult(0, 0, "Grading service unavailable", false);
                }
            }
        }
        
        // Use enhanced fallback grading
        log.info("Using fallback grading system");
        return enhancedFallbackGrading(question, expectedAnswer, studentAnswer, totalMarks);
    }

    private String buildGradingPrompt(String question, String expectedAnswer, String studentAnswer, int totalMarks) {
        return String.format("""
            You are an expert exam grader. Grade the following student answer:
            
            QUESTION: %s
            EXPECTED ANSWER: %s
            STUDENT ANSWER: %s
            TOTAL MARKS: %d
            
            Evaluate the student's answer and provide:
            1. Marks earned (0 to %d)
            2. Percentage accuracy (0-100)
            3. Brief feedback explaining the grading
            4. Whether the answer is correct (true/false)
            
            Consider:
            - Semantic similarity (synonyms, paraphrasing)
            - Partial credit for partially correct answers
            - Key concepts covered
            - Mathematical accuracy if applicable
            
            Respond in JSON format:
            {
                "marksEarned": number,
                "accuracy": number,
                "feedback": "string",
                "isCorrect": boolean
            }
            """, question, expectedAnswer, studentAnswer, totalMarks, totalMarks);
    }

    private String invokeBedrockModelWithTimeout(String prompt) throws Exception {
        long startTime = System.currentTimeMillis();
        
        try {
            Map<String, Object> requestBody = Map.of(
                "anthropic_version", "bedrock-2023-05-31",
                "max_tokens", 1000,
                "temperature", 0.1, // Low temperature for consistent grading
                "messages", new Object[]{
                    Map.of("role", "user", "content", prompt)
                }
            );

            String jsonBody = objectMapper.writeValueAsString(requestBody);
            
            InvokeModelRequest request = InvokeModelRequest.builder()
                    .modelId("anthropic.claude-3-sonnet-20240229-v1:0")
                    .body(SdkBytes.fromUtf8String(jsonBody))
                    .contentType("application/json")
                    .build();

            // Check timeout
            if (System.currentTimeMillis() - startTime > timeoutMs) {
                throw new RuntimeException("Request timeout before sending");
            }

            InvokeModelResponse response = bedrockClient.invokeModel(request);
            String responseBody = response.body().asUtf8String();
            
            JsonNode jsonResponse = objectMapper.readTree(responseBody);
            String result = jsonResponse.path("content").get(0).path("text").asText();
            
            long duration = System.currentTimeMillis() - startTime;
            log.debug("AI grading completed in {}ms", duration);
            
            return result;
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("AI grading failed after {}ms: {}", duration, e.getMessage());
            throw e;
        }
    }

    private GradingResult parseGradingResponse(String aiResponse, int totalMarks) {
        try {
            if (aiResponse == null || aiResponse.trim().isEmpty()) {
                throw new RuntimeException("Empty AI response");
            }
            
            // Extract JSON from AI response
            int jsonStart = aiResponse.indexOf("{");
            int jsonEnd = aiResponse.lastIndexOf("}") + 1;
            
            if (jsonStart == -1 || jsonEnd <= jsonStart) {
                throw new RuntimeException("No valid JSON found in response");
            }
            
            String jsonStr = aiResponse.substring(jsonStart, jsonEnd);
            JsonNode result = objectMapper.readTree(jsonStr);
            
            int marksEarned = Math.max(0, Math.min(totalMarks, result.path("marksEarned").asInt(0)));
            int accuracy = Math.max(0, Math.min(100, result.path("accuracy").asInt(0)));
            String feedback = result.path("feedback").asText("AI grading completed");
            boolean isCorrect = result.path("isCorrect").asBoolean(false);
            
            // Validate results
            if (feedback.length() > 500) {
                feedback = feedback.substring(0, 500) + "...";
            }
            
            return new GradingResult(marksEarned, accuracy, feedback, isCorrect);
        } catch (Exception e) {
            log.error("Failed to parse AI response: {}", aiResponse, e);
            throw new RuntimeException("AI response parsing failed: " + e.getMessage());
        }
    }

    private GradingResult enhancedFallbackGrading(String question, String expectedAnswer, String studentAnswer, int totalMarks) {
        try {
            String expected = expectedAnswer.toLowerCase().trim();
            String student = studentAnswer.toLowerCase().trim();
            
            // Exact match
            if (student.equals(expected)) {
                return new GradingResult(totalMarks, 100, "Exact match - Full marks", true);
            }
            
            // Check for partial matches and common variations
            int similarity = calculateSimilarity(expected, student);
            
            if (similarity >= 95) {
                return new GradingResult(totalMarks, similarity, "Excellent match - Full marks", true);
            } else if (similarity >= 85) {
                int partialMarks = (int) Math.round(totalMarks * 0.9); // 90% marks
                return new GradingResult(partialMarks, similarity, "Very good match - High marks", true);
            } else if (similarity >= 70) {
                int partialMarks = (int) Math.round(totalMarks * 0.75); // 75% marks
                return new GradingResult(partialMarks, similarity, "Good match - Partial credit", false);
            } else if (similarity >= 50) {
                int partialMarks = (int) Math.round(totalMarks * 0.5); // 50% marks
                return new GradingResult(partialMarks, similarity, "Partial match - Some credit", false);
            } else if (similarity >= 25) {
                int partialMarks = (int) Math.round(totalMarks * 0.25); // 25% marks
                return new GradingResult(partialMarks, similarity, "Minimal match - Limited credit", false);
            } else {
                return new GradingResult(0, similarity, "Answer does not match expected response", false);
            }
        } catch (Exception e) {
            log.error("Fallback grading failed", e);
            return new GradingResult(0, 0, "Grading system error", false);
        }
    }
    
    private int calculateSimilarity(String expected, String student) {
        try {
            // Handle edge cases
            if (expected.isEmpty() && student.isEmpty()) return 100;
            if (expected.isEmpty() || student.isEmpty()) return 0;
            
            // Simple similarity calculation based on common words and character overlap
            String[] expectedWords = expected.split("\\s+");
            String[] studentWords = student.split("\\s+");
            
            int commonWords = 0;
            for (String expectedWord : expectedWords) {
                if (expectedWord.length() < 2) continue; // Skip very short words
                
                for (String studentWord : studentWords) {
                    if (studentWord.length() < 2) continue;
                    
                    if (expectedWord.equals(studentWord) || 
                        (expectedWord.length() > 3 && studentWord.contains(expectedWord)) ||
                        (studentWord.length() > 3 && expectedWord.contains(studentWord)) ||
                        calculateLevenshteinDistance(expectedWord, studentWord) <= 1) {
                        commonWords++;
                        break;
                    }
                }
            }
            
            // Calculate percentage based on common words and length similarity
            double wordSimilarity = expectedWords.length > 0 ? (double) commonWords / expectedWords.length : 0;
            double lengthSimilarity = 1.0 - Math.abs(expected.length() - student.length()) / (double) Math.max(expected.length(), student.length());
            
            // Character-level similarity for short answers
            double charSimilarity = 0;
            if (expected.length() <= 20 && student.length() <= 20) {
                int distance = calculateLevenshteinDistance(expected, student);
                charSimilarity = 1.0 - (double) distance / Math.max(expected.length(), student.length());
            }
            
            // Weighted combination
            double finalSimilarity = wordSimilarity * 0.5 + lengthSimilarity * 0.3 + charSimilarity * 0.2;
            return Math.max(0, Math.min(100, (int) Math.round(finalSimilarity * 100)));
        } catch (Exception e) {
            log.error("Similarity calculation failed", e);
            return 0;
        }
    }
    
    private int calculateLevenshteinDistance(String s1, String s2) {
        int[][] dp = new int[s1.length() + 1][s2.length() + 1];
        
        for (int i = 0; i <= s1.length(); i++) {
            for (int j = 0; j <= s2.length(); j++) {
                if (i == 0) {
                    dp[i][j] = j;
                } else if (j == 0) {
                    dp[i][j] = i;
                } else {
                    dp[i][j] = Math.min(Math.min(
                        dp[i - 1][j] + 1,
                        dp[i][j - 1] + 1),
                        dp[i - 1][j - 1] + (s1.charAt(i - 1) == s2.charAt(j - 1) ? 0 : 1)
                    );
                }
            }
        }
        
        return dp[s1.length()][s2.length()];
    }

    public static class GradingResult {
        private final int marksEarned;
        private final int accuracy;
        private final String feedback;
        private final boolean isCorrect;

        public GradingResult(int marksEarned, int accuracy, String feedback, boolean isCorrect) {
            this.marksEarned = marksEarned;
            this.accuracy = accuracy;
            this.feedback = feedback;
            this.isCorrect = isCorrect;
        }

        public int getMarksEarned() { return marksEarned; }
        public int getAccuracy() { return accuracy; }
        public String getFeedback() { return feedback; }
        public boolean isCorrect() { return isCorrect; }
    }
}