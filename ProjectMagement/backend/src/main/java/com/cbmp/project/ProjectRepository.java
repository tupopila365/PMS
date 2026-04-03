package com.cbmp.project;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectRepository extends JpaRepository<ProjectEntity, String> {
    List<ProjectEntity> findTop25ByOrderByCreatedAtDesc();

    List<ProjectEntity> findByCompanyId(String companyId);
}
