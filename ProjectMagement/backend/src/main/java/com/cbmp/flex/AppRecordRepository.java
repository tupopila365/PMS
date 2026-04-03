package com.cbmp.flex;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AppRecordRepository extends JpaRepository<AppRecordEntity, String> {
    List<AppRecordEntity> findByKindAndProjectIdOrderById(String kind, String projectId);

    List<AppRecordEntity> findByKindOrderById(String kind);

    Optional<AppRecordEntity> findFirstByKindAndProjectId(String kind, String projectId);

    @Modifying
    @Query("DELETE FROM AppRecordEntity r WHERE r.kind = :kind AND r.projectId = :projectId")
    void deleteByKindAndProjectId(@Param("kind") String kind, @Param("projectId") String projectId);
}
