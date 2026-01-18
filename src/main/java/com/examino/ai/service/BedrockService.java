package com.examino.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;
import software.amazon.awssdk.services.bedrockruntime.model.InvokeModelRequest;
import software.amazon.awssdk.services.bedrockruntime.model.InvokeModelResponse;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class BedrockService {

    private final BedrockRuntimeClient bedrockRuntimeClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String CLAUDE_MODEL_ID = "anthropic.claude-3-haiku-20240307-v1:0";

    public Map<String, Object> gradeExam(String extractedText, String rubricJson) {
        try {
            String prompt = buildGradingPrompt(extractedText, rubricJson);
            
            Map<String, Object> requestBody = Map.of(
                "anthropic_version", "bedrock-2023-05-31",
                "max_tokens", 1000,
                "messages", new Object[]{
                    Map.of(
                        "role", "user",
                        "content", prompt
                    )
                }
            );

            String requestBodyJson = objectMapper.writeValueAsString(requestBody);

            InvokeModelRequest request = InvokeModelRequest.builder()
                    .modelId(CLAUDE_MODEL_ID)
                    .body(SdkBytes.fromUtf8String(requestBodyJson))
                    .build();

            InvokeModelResponse response = bedrockRuntimeClient.invokeModel(request);
            String responseBody = response.body().asUtf8String();
            
            JsonNode responseJson = objectMapper.readTree(responseBody);
            String aiResponse = responseJson.get("content").get(0).get("text").asText();
            
            return parseGradingResponse(aiResponse);
            
        } catch (Exception e) {
            log.error("Error grading exam with Bedrock: {}", e.getMessage());
            throw new RuntimeException("Failed to grade exam", e);
        }
    }

    private String buildGradingPrompt(String extractedText, String rubricJson) {
        return String.format("""
            You are a strict academic grader. Grade the following student answer based on the provided rubric.
            
            RUBRIC (JSON format):
            %s
            
            STUDENT ANSWER (extracted from handwriting OCR):
            %s
            
            Instructions:
            1. Ignore minor OCR typos (e.g., 'teh' instead of 'the')
            2. Focus on conceptual understanding, not just keywords
            3. Provide a score out of 100
            4. Give constructive feedback
            
            Respond in this exact JSON format:
            {
                "score": <number 0-100>,
                "feedback": "<detailed feedback explaining the grade>"
            }
            """, rubricJson, extractedText);
    }

    private Map<String, Object> parseGradingResponse(String aiResponse) {
        try {
            // Extract JSON from AI response
            int jsonStart = aiResponse.indexOf("{");
            int jsonEnd = aiResponse.lastIndexOf("}") + 1;
            
            if (jsonStart >= 0 && jsonEnd > jsonStart) {
                String jsonResponse = aiResponse.substring(jsonStart, jsonEnd);
                JsonNode responseJson = objectMapper.readTree(jsonResponse);
                
                return Map.of(
                    "score", responseJson.get("score").asInt(),
                    "feedback", responseJson.get("feedback").asText()
                );
            }
            
            // Fallback if JSON parsing fails
            return Map.of(
                "score", 0,
                "feedback", "Unable to parse AI response: " + aiResponse
            );
            
        } catch (Exception e) {
            log.error("Error parsing AI response: {}", e.getMessage());
            return Map.of(
                "score", 0,
                "feedback", "Error processing AI response"
            );
        }
    }
}