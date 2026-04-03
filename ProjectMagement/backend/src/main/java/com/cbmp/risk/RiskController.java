package com.cbmp.risk;

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
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@RestController
@RequestMapping("/api/risks")
public class RiskController {

    private final RiskRepository riskRepository;
    private final ProjectRepository projectRepository;
    private final ProjectAccessService projectAccessService;
    private final InAppNotificationPublisher notificationPublisher;
    private final NotificationAudienceResolver audience;

    public RiskController(
            RiskRepository riskRepository,
            ProjectRepository projectRepository,
            ProjectAccessService projectAccessService,
            InAppNotificationPublisher notificationPublisher,
            NotificationAudienceResolver audience
    ) {
        this.riskRepository = riskRepository;
        this.projectRepository = projectRepository;
        this.projectAccessService = projectAccessService;
        this.notificationPublisher = notificationPublisher;
        this.audience = audience;
    }

    @GetMapping
    public List<RiskDto> list(
            @RequestParam(required = false) String projectId,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser auth
    ) {
        UserEntity user = projectAccessService.requireUser(auth);
        Set<String> visible = projectAccessService.visibleProjectIds(user);
        if (projectId != null && !projectId.isBlank()) {
            projectAccessService.requireAccess(user, projectId);
            return riskRepository.findByProjectId(projectId).stream().map(this::toDto).toList();
        }
        return riskRepository.findAll().stream()
                .filter(r -> r.getProjectId() != null && visible.contains(r.getProjectId()))
                .map(this::toDto)
                .toList();
    }

    @PostMapping
    public RiskDto create(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser user
    ) {
        UserEntity dbUser = projectAccessService.requireUser(user);
        String pid = (String) body.get("projectId");
        if (pid == null || !projectRepository.existsById(pid)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid project");
        }
        projectAccessService.requireAccess(dbUser, pid);
        RiskEntity e = new RiskEntity();
        e.setProjectId(pid);
        e.setDescription(body.get("description") != null ? body.get("description").toString() : null);
        e.setProbability(asInt(body.get("probability")));
        e.setImpact(asInt(body.get("impact")));
        e.setSeverity(body.get("severity") != null ? body.get("severity").toString() : "medium");
        e.setOwner(body.get("owner") != null ? body.get("owner").toString() : null);
        e.setMitigation(body.get("mitigation") != null ? body.get("mitigation").toString() : null);
        e.setStatus(body.get("status") != null ? body.get("status").toString() : "open");
        RiskEntity saved = riskRepository.save(e);
        notifyRiskWatchers(saved, "New risk logged", user);
        return toDto(saved);
    }

    @PutMapping("/{id}")
    public RiskDto update(
            @PathVariable String id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser user
    ) {
        UserEntity dbUser = projectAccessService.requireUser(user);
        RiskEntity e = riskRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        projectAccessService.requireAccess(dbUser, e.getProjectId());
        String prevDesc = e.getDescription();
        String prevStatus = e.getStatus();
        String prevSev = e.getSeverity();
        String prevMit = e.getMitigation();
        String prevOwner = e.getOwner();
        if (body.containsKey("description")) e.setDescription((String) body.get("description"));
        if (body.containsKey("probability")) e.setProbability(asInt(body.get("probability")));
        if (body.containsKey("impact")) e.setImpact(asInt(body.get("impact")));
        if (body.containsKey("severity")) e.setSeverity((String) body.get("severity"));
        if (body.containsKey("owner")) e.setOwner((String) body.get("owner"));
        if (body.containsKey("mitigation")) e.setMitigation((String) body.get("mitigation"));
        if (body.containsKey("status")) e.setStatus((String) body.get("status"));
        RiskEntity saved = riskRepository.save(e);
        boolean material = !Objects.equals(prevDesc, saved.getDescription())
                || !Objects.equals(prevStatus, saved.getStatus())
                || !Objects.equals(prevSev, saved.getSeverity())
                || !Objects.equals(prevMit, saved.getMitigation())
                || !Objects.equals(prevOwner, saved.getOwner());
        if (material) {
            notifyRiskWatchers(saved, "Risk updated", user);
        }
        return toDto(saved);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id, @AuthenticationPrincipal JwtAuthFilter.AuthUser user) {
        UserEntity dbUser = projectAccessService.requireUser(user);
        RiskEntity e = riskRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        projectAccessService.requireAccess(dbUser, e.getProjectId());
        riskRepository.deleteById(id);
    }

    private void notifyRiskWatchers(RiskEntity r, String title, JwtAuthFilter.AuthUser actor) {
        String pid = r.getProjectId();
        String snippet = r.getDescription();
        if (snippet != null && snippet.length() > 120) {
            snippet = snippet.substring(0, 117) + "...";
        }
        if (snippet == null || snippet.isBlank()) {
            snippet = "Risk entry";
        }
        String msg = snippet + " — " + audience.projectName(pid)
                + (r.getSeverity() != null ? " (severity: " + r.getSeverity() + ")" : "")
                + (r.getStatus() != null ? ", status: " + r.getStatus() : "") + ".";
        Set<String> targets = audience.projectTeamAndManagers(pid);
        String actorId = actor != null ? actor.id() : null;
        for (String uid : targets) {
            if (actorId != null && actorId.equals(uid)) {
                continue;
            }
            notificationPublisher.publish(uid, "risk", title, msg, pid, null);
        }
    }

    private static Integer asInt(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n.intValue();
        return Integer.parseInt(o.toString());
    }

    private RiskDto toDto(RiskEntity e) {
        return new RiskDto(
                e.getId(),
                e.getProjectId(),
                e.getDescription(),
                e.getProbability(),
                e.getImpact(),
                e.getSeverity(),
                e.getOwner(),
                e.getMitigation(),
                e.getStatus(),
                e.getCreatedAt() != null ? e.getCreatedAt().toString() : null
        );
    }
}
