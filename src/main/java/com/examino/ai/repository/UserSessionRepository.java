package com.examino.ai.repository;

import com.examino.ai.model.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, String> {
    Optional<UserSession> findBySessionIdAndIsActiveTrue(String sessionId);
    void deleteByUserId(String userId);
}
