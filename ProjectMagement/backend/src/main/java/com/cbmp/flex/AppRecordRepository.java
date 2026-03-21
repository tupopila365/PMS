package com.cbmp.flex;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AppRecordRepository extends JpaRepository<AppRecordEntity, String> {
    List<AppRecordEntity> findByKindAndProjectIdOrderById(String kind, String projectId);

    List<AppRecordEntity> findByKindOrderById(String kind);

    Optional<AppRecordEntity> findFirstByKindAndProjectId(String kind, String projectId);
}
