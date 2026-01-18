package com.examino.ai.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class S3Service {

    private final S3Client s3Client;

    @Value("${aws.s3.bucket-name}")
    private String bucketName;

    public String uploadExamScan(MultipartFile file) throws IOException {
        String objectKey = generateUniqueObjectKey(file.getOriginalFilename());
        
        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(objectKey)
                .contentType(file.getContentType())
                .build();

        s3Client.putObject(putObjectRequest, RequestBody.fromBytes(file.getBytes()));
        
        String s3Url = String.format("https://%s.s3.amazonaws.com/%s", bucketName, objectKey);
        log.info("Uploaded exam scan to S3: {}", s3Url);
        
        return objectKey;
    }

    private String generateUniqueObjectKey(String originalFilename) {
        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        return "exam-scans/" + UUID.randomUUID() + extension;
    }
}