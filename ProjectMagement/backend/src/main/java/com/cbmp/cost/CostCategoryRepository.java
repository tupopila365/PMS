package com.cbmp.cost;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CostCategoryRepository extends JpaRepository<CostCategoryEntity, String> {
    List<CostCategoryEntity> findByProjectId(String projectId);
}
