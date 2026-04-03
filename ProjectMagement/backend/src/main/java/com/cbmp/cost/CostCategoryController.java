package com.cbmp.cost;

import com.cbmp.auth.JwtAuthFilter;
import com.cbmp.notification.InAppNotificationPublisher;
import com.cbmp.notification.NotificationAudienceResolver;
import com.cbmp.org.UserEntity;
import com.cbmp.project.ProjectAccessService;
import com.cbmp.project.ProjectRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/projects/{projectId}/cost-categories")
public class CostCategoryController {

    private final CostCategoryRepository costCategoryRepository;
    private final ProjectRepository projectRepository;
    private final ProjectAccessService projectAccessService;
    private final InAppNotificationPublisher notificationPublisher;
    private final NotificationAudienceResolver audience;

    public CostCategoryController(
            CostCategoryRepository costCategoryRepository,
            ProjectRepository projectRepository,
            ProjectAccessService projectAccessService,
            InAppNotificationPublisher notificationPublisher,
            NotificationAudienceResolver audience
    ) {
        this.costCategoryRepository = costCategoryRepository;
        this.projectRepository = projectRepository;
        this.projectAccessService = projectAccessService;
        this.notificationPublisher = notificationPublisher;
        this.audience = audience;
    }

    @GetMapping
    public List<CostCategoryDto> list(
            @PathVariable String projectId,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser auth
    ) {
        UserEntity user = projectAccessService.requireUser(auth);
        projectAccessService.requireAccess(user, projectId);
        if (!projectRepository.existsById(projectId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "project not found");
        }
        return costCategoryRepository.findByProjectId(projectId).stream().map(this::toDto).toList();
    }

    @PostMapping
    public CostCategoryDto create(
            @PathVariable String projectId,
            @RequestBody CostCategoryUpsertRequest body,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser user
    ) {
        UserEntity dbUser = projectAccessService.requireUser(user);
        projectAccessService.requireAccess(dbUser, projectId);
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
        CostCategoryEntity saved = costCategoryRepository.save(e);
        notifyCostWatchers(projectId, "CBS line added", "Cost category \"" + saved.getName() + "\" was added to " + audience.projectName(projectId) + ".", user);
        return toDto(saved);
    }

    @PutMapping("/{id}")
    public CostCategoryDto update(
            @PathVariable String projectId,
            @PathVariable String id,
            @RequestBody CostCategoryUpsertRequest body,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser user
    ) {
        UserEntity dbUser = projectAccessService.requireUser(user);
        projectAccessService.requireAccess(dbUser, projectId);
        CostCategoryEntity e = costCategoryRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!projectId.equals(e.getProjectId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        if (body.name() != null) e.setName(body.name());
        if (body.parentId() != null) e.setParentId(body.parentId());
        if (body.budget() != null) e.setBudget(body.budget());
        if (body.actualCost() != null) e.setActualCost(body.actualCost());
        CostCategoryEntity saved = costCategoryRepository.save(e);
        notifyCostWatchers(projectId, "CBS updated", "Cost category \"" + saved.getName() + "\" was updated on " + audience.projectName(projectId) + ".", user);
        return toDto(saved);
    }

    private void notifyCostWatchers(String projectId, String title, String message, JwtAuthFilter.AuthUser actor) {
        Set<String> targets = audience.projectTeamAndManagers(projectId);
        String actorId = actor != null ? actor.id() : null;
        for (String uid : targets) {
            if (actorId != null && actorId.equals(uid)) {
                continue;
            }
            notificationPublisher.publish(uid, "general", title, message, projectId, null);
        }
    }

    private CostCategoryDto toDto(CostCategoryEntity e) {
        return new CostCategoryDto(e.getId(), e.getProjectId(), e.getName(), e.getParentId(), e.getBudget(), e.getActualCost());
    }
}
