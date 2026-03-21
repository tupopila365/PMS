package com.cbmp.task;

import com.cbmp.project.ProjectRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;

    public TaskController(TaskRepository taskRepository, ProjectRepository projectRepository) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
    }

    @GetMapping
    public List<TaskDto> list(@RequestParam(required = false) String projectId) {
        if (projectId != null && !projectId.isBlank()) {
            return taskRepository.findByProjectIdOrderBySortOrderAscIdAsc(projectId).stream().map(this::toDto).toList();
        }
        return taskRepository.findAll().stream().map(this::toDto).toList();
    }

    @PostMapping
    public TaskDto create(@RequestBody TaskUpsertRequest body) {
        if (body.projectId() == null || body.projectId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "projectId is required");
        }
        if (!projectRepository.existsById(body.projectId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "project not found");
        }
        if (body.title() == null || body.title().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "title is required");
        }
        TaskEntity e = new TaskEntity();
        e.setProjectId(body.projectId());
        e.setTitle(body.title().trim());
        e.setDescription(body.description());
        e.setStatus(body.status());
        e.setAssignedTo(body.assignedTo());
        e.setDueDate(body.dueDate());
        e.setStartDate(body.startDate());
        e.setEndDate(body.endDate());
        e.setDuration(body.duration());
        e.setPredecessors(body.predecessors());
        e.setParentId(body.parentId());
        e.setSortOrder(body.order());
        e.setIsMilestone(body.isMilestone());
        return toDto(taskRepository.save(e));
    }

    @PutMapping("/{id}")
    public TaskDto update(@PathVariable String id, @RequestBody TaskUpsertRequest body) {
        TaskEntity e = taskRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (body.title() != null) e.setTitle(body.title());
        if (body.description() != null) e.setDescription(body.description());
        if (body.status() != null) e.setStatus(body.status());
        if (body.assignedTo() != null) e.setAssignedTo(body.assignedTo());
        if (body.dueDate() != null) e.setDueDate(body.dueDate());
        if (body.startDate() != null) e.setStartDate(body.startDate());
        if (body.endDate() != null) e.setEndDate(body.endDate());
        if (body.duration() != null) e.setDuration(body.duration());
        if (body.predecessors() != null) e.setPredecessors(body.predecessors());
        if (body.parentId() != null) e.setParentId(body.parentId());
        if (body.order() != null) e.setSortOrder(body.order());
        if (body.isMilestone() != null) e.setIsMilestone(body.isMilestone());
        return toDto(taskRepository.save(e));
    }

    private TaskDto toDto(TaskEntity e) {
        return new TaskDto(
                e.getId(),
                e.getProjectId(),
                e.getTitle(),
                e.getDescription(),
                e.getStatus(),
                e.getAssignedTo(),
                e.getDueDate(),
                e.getStartDate(),
                e.getEndDate(),
                e.getDuration(),
                e.getPredecessors(),
                e.getParentId(),
                e.getSortOrder(),
                e.getIsMilestone(),
                e.getCreatedAt() != null ? e.getCreatedAt().toString() : null
        );
    }
}
