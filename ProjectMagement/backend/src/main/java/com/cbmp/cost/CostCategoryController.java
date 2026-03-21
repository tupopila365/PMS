package com.cbmp.cost;

import com.cbmp.project.ProjectRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}/cost-categories")
public class CostCategoryController {

    private final CostCategoryRepository costCategoryRepository;
    private final ProjectRepository projectRepository;

    public CostCategoryController(CostCategoryRepository costCategoryRepository, ProjectRepository projectRepository) {
        this.costCategoryRepository = costCategoryRepository;
        this.projectRepository = projectRepository;
    }

    @GetMapping
    public List<CostCategoryDto> list(@PathVariable String projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "project not found");
        }
        return costCategoryRepository.findByProjectId(projectId).stream().map(this::toDto).toList();
    }

    @PostMapping
    public CostCategoryDto create(@PathVariable String projectId, @RequestBody CostCategoryUpsertRequest body) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "project not found");
        }
        if (body.name() == null || body.name().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name is required");
        }
        CostCategoryEntity e = new CostCategoryEntity();
        e.setProjectId(projectId);
        e.setName(body.name().trim());
        e.setParentId(body.parentId());
        e.setBudget(body.budget());
        e.setActualCost(body.actualCost());
        return toDto(costCategoryRepository.save(e));
    }

    @PutMapping("/{id}")
    public CostCategoryDto update(
            @PathVariable String projectId,
            @PathVariable String id,
            @RequestBody CostCategoryUpsertRequest body
    ) {
        CostCategoryEntity e = costCategoryRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!projectId.equals(e.getProjectId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        if (body.name() != null) e.setName(body.name());
        if (body.parentId() != null) e.setParentId(body.parentId());
        if (body.budget() != null) e.setBudget(body.budget());
        if (body.actualCost() != null) e.setActualCost(body.actualCost());
        return toDto(costCategoryRepository.save(e));
    }

    private CostCategoryDto toDto(CostCategoryEntity e) {
        return new CostCategoryDto(e.getId(), e.getProjectId(), e.getName(), e.getParentId(), e.getBudget(), e.getActualCost());
    }
}
