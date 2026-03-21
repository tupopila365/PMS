package com.cbmp.project;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectRepository projectRepository;

    public ProjectController(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    @GetMapping
    public List<ProjectDto> list() {
        return projectRepository.findAll().stream().map(this::toDto).toList();
    }

    @GetMapping("/{id}")
    public ProjectDto get(@PathVariable String id) {
        return projectRepository.findById(id).map(this::toDto).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    @PostMapping
    public ProjectDto create(@RequestBody CreateProjectRequest body) {
        if (body.name() == null || body.name().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name is required");
        }
        if (body.type() == null || body.type().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "type is required");
        }
        if (body.companyId() == null || body.companyId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "companyId is required");
        }
        ProjectEntity e = new ProjectEntity();
        e.setName(body.name().trim());
        e.setType(body.type().trim());
        e.setCompanyId(body.companyId().trim());
        e.setStatus(body.status());
        e.setRegion(body.region());
        e.setClient(body.client());
        e.setRiskLevel(body.riskLevel());
        e.setBudget(body.budget());
        e.setActualCost(body.actualCost());
        e.setPlannedEndDate(body.plannedEndDate());
        e.setActualEndDate(body.actualEndDate());
        return toDto(projectRepository.save(e));
    }

    @PutMapping("/{id}")
    public ProjectDto update(@PathVariable String id, @RequestBody CreateProjectRequest body) {
        ProjectEntity e = projectRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (body.name() != null) e.setName(body.name());
        if (body.type() != null) e.setType(body.type());
        if (body.companyId() != null) e.setCompanyId(body.companyId());
        if (body.status() != null) e.setStatus(body.status());
        if (body.region() != null) e.setRegion(body.region());
        if (body.client() != null) e.setClient(body.client());
        if (body.riskLevel() != null) e.setRiskLevel(body.riskLevel());
        if (body.budget() != null) e.setBudget(body.budget());
        if (body.actualCost() != null) e.setActualCost(body.actualCost());
        if (body.plannedEndDate() != null) e.setPlannedEndDate(body.plannedEndDate());
        if (body.actualEndDate() != null) e.setActualEndDate(body.actualEndDate());
        return toDto(projectRepository.save(e));
    }

    private ProjectDto toDto(ProjectEntity e) {
        return new ProjectDto(
                e.getId(),
                e.getName(),
                e.getType(),
                e.getCompanyId(),
                e.getStatus(),
                e.getRegion(),
                e.getClient(),
                e.getRiskLevel(),
                e.getBudget(),
                e.getActualCost(),
                e.getPlannedEndDate(),
                e.getActualEndDate(),
                e.getCreatedAt() != null ? e.getCreatedAt().toString() : null
        );
    }
}
