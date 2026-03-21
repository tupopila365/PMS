package com.cbmp.template;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectTemplateRepository extends JpaRepository<ProjectTemplateEntity, String> {
    List<ProjectTemplateEntity> findByProjectType(String projectType);
}
