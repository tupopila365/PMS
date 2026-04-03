package com.cbmp.task;

import com.cbmp.auth.JwtAuthFilter;
import com.cbmp.org.UserEntity;
import com.cbmp.project.ProjectAccessService;
import com.cbmp.project.ProjectEntity;
import com.cbmp.project.ProjectRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final ProjectAccessService projectAccessService;
    private final TaskAssignmentNotifier assignmentNotifier;

    public TaskController(
            TaskRepository taskRepository,
            ProjectRepository projectRepository,
            ProjectAccessService projectAccessService,
            TaskAssignmentNotifier assignmentNotifier
    ) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
        this.projectAccessService = projectAccessService;
        this.assignmentNotifier = assignmentNotifier;
    }

    @GetMapping
    public List<TaskDto> list(
            @RequestParam(required = false) String projectId,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser auth
    ) {
        UserEntity user = projectAccessService.requireUser(auth);
        Set<String> visible = projectAccessService.visibleProjectIds(user);
        if (projectId != null && !projectId.isBlank()) {
            projectAccessService.requireAccess(user, projectId);
            return taskRepository.findByProjectIdOrderBySortOrderAscIdAsc(projectId).stream().map(this::toDto).toList();
        }
        return taskRepository.findAll().stream()
                .filter(t -> t.getProjectId() != null && visible.contains(t.getProjectId()))
                .map(this::toDto)
                .toList();
    }

    @PostMapping
    public TaskDto create(@RequestBody TaskUpsertRequest body, @AuthenticationPrincipal JwtAuthFilter.AuthUser authUser) {
        UserEntity user = projectAccessService.requireUser(authUser);
        if (body.projectId() == null || body.projectId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "projectId is required");
        }
        projectAccessService.requireAccess(user, body.projectId());
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
        if (body.sampleRequired() != null) e.setSampleRequired(body.sampleRequired());
        if (body.approvalRequired() != null) e.setApprovalRequired(body.approvalRequired());
        if (body.archived() != null) e.setArchived(body.archived());
        TaskEntity saved = taskRepository.save(e);
        String projectName = projectRepository.findById(saved.getProjectId()).map(ProjectEntity::getName).orElse("Project");
        assignmentNotifier.notifyNewAssignees(
                saved.getId(),
                saved.getTitle(),
                saved.getProjectId(),
                projectName,
                assignerLabel(authUser),
                saved.getDueDate(),
                List.of(),
                saved.getAssignedTo()
        );
        return toDto(saved);
    }

    @PutMapping("/{id}")
    public TaskDto update(@PathVariable String id, @RequestBody TaskUpsertRequest body, @AuthenticationPrincipal JwtAuthFilter.AuthUser authUser) {
        UserEntity user = projectAccessService.requireUser(authUser);
        TaskEntity e = taskRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        projectAccessService.requireAccess(user, e.getProjectId());
        List<String> previousAssignees = e.getAssignedTo() != null ? new ArrayList<>(e.getAssignedTo()) : List.of();
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
        if (body.sampleRequired() != null) e.setSampleRequired(body.sampleRequired());
        if (body.approvalRequired() != null) e.setApprovalRequired(body.approvalRequired());
        if (body.archived() != null) e.setArchived(body.archived());
        TaskEntity saved = taskRepository.save(e);
        if (body.assignedTo() != null) {
            String projectName = projectRepository.findById(saved.getProjectId()).map(ProjectEntity::getName).orElse("Project");
            assignmentNotifier.notifyNewAssignees(
                    saved.getId(),
                    saved.getTitle(),
                    saved.getProjectId(),
                    projectName,
                    assignerLabel(authUser),
                    saved.getDueDate(),
                    previousAssignees,
                    saved.getAssignedTo()
            );
        }
        return toDto(saved);
    }

    private static String assignerLabel(JwtAuthFilter.AuthUser authUser) {
        if (authUser == null) {
            return "A team member";
        }
        if (authUser.name() != null && !authUser.name().isBlank()) {
            return authUser.name().trim();
        }
        if (authUser.email() != null && !authUser.email().isBlank()) {
            return authUser.email().trim();
        }
        return "A team member";
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
                e.getSampleRequired() != null ? e.getSampleRequired() : false,
                e.getApprovalRequired() != null ? e.getApprovalRequired() : false,
                e.getArchived() != null ? e.getArchived() : false,
                e.getCreatedAt() != null ? e.getCreatedAt().toString() : null
        );
    }
}
