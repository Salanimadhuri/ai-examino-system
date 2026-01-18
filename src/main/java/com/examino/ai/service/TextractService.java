package com.examino.ai.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.textract.TextractClient;
import software.amazon.awssdk.services.textract.model.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class TextractService {

    private final TextractClient textractClient;

    @Value("${aws.s3.bucket-name}")
    private String bucketName;

    public String extractTextFromImage(String s3ObjectKey) {
        try {
            S3Object s3Object = S3Object.builder()
                    .bucket(bucketName)
                    .name(s3ObjectKey)
                    .build();

            Document document = Document.builder()
                    .s3Object(s3Object)
                    .build();

            AnalyzeDocumentRequest request = AnalyzeDocumentRequest.builder()
                    .document(document)
                    .featureTypes(FeatureType.FORMS, FeatureType.TABLES)
                    .build();

            AnalyzeDocumentResponse response = textractClient.analyzeDocument(request);
            
            StringBuilder extractedText = new StringBuilder();
            
            for (Block block : response.blocks()) {
                if (block.blockType() == BlockType.LINE) {
                    extractedText.append(block.text()).append(" ");
                }
            }
            
            String result = extractedText.toString().trim();
            log.info("Extracted text from image: {} characters", result.length());
            
            return result;
            
        } catch (Exception e) {
            log.error("Error extracting text from image: {}", e.getMessage());
            throw new RuntimeException("Failed to extract text from image", e);
        }
    }
}