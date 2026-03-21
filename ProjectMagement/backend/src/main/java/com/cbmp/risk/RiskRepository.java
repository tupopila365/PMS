package com.cbmp.risk;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RiskRepository extends JpaRepository<RiskEntity, String> {
    List<RiskEntity> findByProjectId(String projectId);
}
