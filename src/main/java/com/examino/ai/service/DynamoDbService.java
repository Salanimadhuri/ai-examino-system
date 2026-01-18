package com.examino.ai.service;

import com.examino.ai.model.ExamResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DynamoDbService {

    private final DynamoDbClient dynamoDbClient;
    private static final String TABLE_NAME = "ExamResults";

    public void saveExamResult(ExamResult examResult) {
        try {
            Map<String, AttributeValue> item = new HashMap<>();
            item.put("studentId", AttributeValue.builder().s(examResult.getStudentId()).build());
            item.put("examId", AttributeValue.builder().s(examResult.getExamId()).build());
            item.put("score", AttributeValue.builder().n(examResult.getScore().toString()).build());
            item.put("feedback", AttributeValue.builder().s(examResult.getFeedback()).build());
            item.put("extractedText", AttributeValue.builder().s(examResult.getExtractedText()).build());
            item.put("createdAt", AttributeValue.builder().s(examResult.getCreatedAt().toString()).build());

            PutItemRequest request = PutItemRequest.builder()
                    .tableName(TABLE_NAME)
                    .item(item)
                    .build();

            dynamoDbClient.putItem(request);
            log.info("Saved exam result for student: {}", examResult.getStudentId());
            
        } catch (Exception e) {
            log.error("Error saving exam result to DynamoDB: {}", e.getMessage());
            throw new RuntimeException("Failed to save exam result", e);
        }
    }

    public ExamResult getExamResult(String studentId, String examId) {
        try {
            Map<String, AttributeValue> key = new HashMap<>();
            key.put("studentId", AttributeValue.builder().s(studentId).build());
            key.put("examId", AttributeValue.builder().s(examId).build());

            GetItemRequest request = GetItemRequest.builder()
                    .tableName(TABLE_NAME)
                    .key(key)
                    .build();

            GetItemResponse response = dynamoDbClient.getItem(request);
            
            if (response.hasItem()) {
                Map<String, AttributeValue> item = response.item();
                return ExamResult.builder()
                        .studentId(item.get("studentId").s())
                        .examId(item.get("examId").s())
                        .score(Integer.parseInt(item.get("score").n()))
                        .feedback(item.get("feedback").s())
                        .extractedText(item.get("extractedText").s())
                        .createdAt(Instant.parse(item.get("createdAt").s()))
                        .build();
            }
            
            return null;
            
        } catch (Exception e) {
            log.error("Error retrieving exam result from DynamoDB: {}", e.getMessage());
            throw new RuntimeException("Failed to retrieve exam result", e);
        }
    }

    public void createTableIfNotExists() {
        try {
            DescribeTableRequest describeRequest = DescribeTableRequest.builder()
                    .tableName(TABLE_NAME)
                    .build();
            
            dynamoDbClient.describeTable(describeRequest);
            log.info("Table {} already exists", TABLE_NAME);
            
        } catch (ResourceNotFoundException e) {
            log.info("Creating DynamoDB table: {}", TABLE_NAME);
            
            CreateTableRequest createRequest = CreateTableRequest.builder()
                    .tableName(TABLE_NAME)
                    .keySchema(
                            KeySchemaElement.builder()
                                    .attributeName("studentId")
                                    .keyType(KeyType.HASH)
                                    .build(),
                            KeySchemaElement.builder()
                                    .attributeName("examId")
                                    .keyType(KeyType.RANGE)
                                    .build()
                    )
                    .attributeDefinitions(
                            AttributeDefinition.builder()
                                    .attributeName("studentId")
                                    .attributeType(ScalarAttributeType.S)
                                    .build(),
                            AttributeDefinition.builder()
                                    .attributeName("examId")
                                    .attributeType(ScalarAttributeType.S)
                                    .build()
                    )
                    .billingMode(BillingMode.PAY_PER_REQUEST)
                    .build();

            dynamoDbClient.createTable(createRequest);
            log.info("Created DynamoDB table: {}", TABLE_NAME);
        }
    }
}