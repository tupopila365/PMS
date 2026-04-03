package com.cbmp.project;

import com.cbmp.auth.JwtAuthFilter;
import com.cbmp.notification.InAppNotificationPublisher;
import com.cbmp.notification.NotificationAudienceResolver;
import com.cbmp.org.UserEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectRepository projectRepository;
    private final ProjectAccessService projectAccessService;
    private final InAppNotificationPublisher notificationPublisher;
    private final NotificationAudienceResolver audience;

    public ProjectController(
            ProjectRepository projectRepository,
            ProjectAccessService projectAccessService,
            InAppNotificationPublisher notificationPublisher,
            NotificationAudienceResolver audience
    ) {
        this.projectRepository = projectRepository;
        this.projectAccessService = projectAccessService;
        this.notificationPublisher = notificationPublisher;
        this.audience = audience;
    }

    @GetMapping
    public List<ProjectDto> list(@AuthenticationPrincipal JwtAuthFilter.AuthUser auth) {
        UserEntity user = projectAccessService.requireUser(auth);
        return projectAccessService.visibleProjects(user).stream().map(this::toDto).toList();
    }

    @GetMapping("/{id}")
    public ProjectDto get(@PathVariable String id, @AuthenticationPrincipal JwtAuthFilter.AuthUser auth) {
        UserEntity user = projectAccessService.requireUser(auth);
        projectAccessService.requireAccess(user, id);
        return projectRepository.findById(id).map(this::toDto).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    @PostMapping
    public ProjectDto create(
            @RequestBody CreateProjectRequest body,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser auth
    ) {
        UserEntity user = projectAccessService.requireUser(auth);
        if (body.name() == null || body.name().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name is required");
        }
        if (body.type() == null || body.type().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "type is required");
        }
        if (body.companyId() == null || body.companyId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "companyId is required");
        }
        String companyTrim = body.companyId().trim();
        if (!"admin".equalsIgnoreCase(user.getRole())) {
            if (user.getCompanyId() == null || !user.getCompanyId().equals(companyTrim)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "company mismatch");
            }
        }
        if (projectAccessService.restrictsToDiscipline(user)) {
            String d = user.getDiscipline().trim().toLowerCase(Locale.ROOT);
            if (!d.equals(body.type().trim().toLowerCase(Locale.ROOT))) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "project type must match your discipline");
            }
        }
        ProjectEntity e = new ProjectEntity();
        e.setName(body.name().trim());
        e.setType(body.type().trim());
        e.setCompanyId(companyTrim);
        e.setStatus(body.status());
        e.setRegion(body.region());
        e.setClient(body.client());
        e.setRiskLevel(body.riskLevel());
        e.setBudget(body.budget());
        e.setActualCost(body.actualCost());
        e.setPlannedEndDate(body.plannedEndDate());
        e.setActualEndDate(body.actualEndDate());
        ProjectEntity saved = projectRepository.save(e);
        notifyCompanyManagers(saved.getCompanyId(), saved.getId(), "New project", "Project \"" + saved.getName() + "\" was created.", auth);
        return toDto(saved);
    }

    @PutMapping("/{id}")
    public ProjectDto update(
            @PathVariable String id,
            @RequestBody CreateProjectRequest body,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser auth
    ) {
        UserEntity user = projectAccessService.requireUser(auth);
        projectAccessService.requireAccess(user, id);
        ProjectEntity e = projectRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (body.name() != null) e.setName(body.name());
        if (body.type() != null) {
            if (projectAccessService.restrictsToDiscipline(user)) {
                String d = user.getDiscipline().trim().toLowerCase(Locale.ROOT);
                if (!d.equals(body.type().trim().toLowerCase(Locale.ROOT))) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "project type must match your discipline");
                }
            }
            e.setType(body.type());
        }
        if (body.companyId() != null) {
            if (!"admin".equalsIgnoreCase(user.getRole())) {
                if (user.getCompanyId() == null || !user.getCompanyId().equals(body.companyId().trim())) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "company mismatch");
                }
            }
            e.setCompanyId(body.companyId());
        }
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

    private void notifyCompanyManagers(String companyId, String projectId, String title, String message, JwtAuthFilter.AuthUser actor) {
        if (companyId == null || companyId.isBlank()) {
            return;
        }
        String actorId = actor != null ? actor.id() : null;
        for (UserEntity u : audience.usersInCompanyWithRoles(companyId, "admin", "project_manager")) {
            if (u.getId() == null || u.getId().equals(actorId)) {
                continue;
            }
            notificationPublisher.publish(u.getId(), "general", title, message, projectId, null);
        }
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
