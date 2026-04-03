package com.cbmp.alert;

import com.cbmp.auth.JwtAuthFilter;
import com.cbmp.org.UserEntity;
import com.cbmp.project.ProjectAccessService;
import com.cbmp.project.ProjectEntity;
import com.cbmp.project.ProjectRepository;
import com.cbmp.risk.RiskEntity;
import com.cbmp.risk.RiskRepository;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    private final RiskRepository riskRepository;
    private final ProjectRepository projectRepository;
    private final ProjectAccessService projectAccessService;

    public AlertController(
            RiskRepository riskRepository,
            ProjectRepository projectRepository,
            ProjectAccessService projectAccessService
    ) {
        this.riskRepository = riskRepository;
        this.projectRepository = projectRepository;
        this.projectAccessService = projectAccessService;
    }

    @GetMapping("/risk")
    public List<Map<String, Object>> riskAlerts(
            @RequestParam(required = false) String projectId,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser auth
    ) {
        UserEntity user = projectAccessService.requireUser(auth);
        Set<String> visible = projectAccessService.visibleProjectIds(user);
        final boolean filter = projectId != null && !projectId.isBlank();
        final String pid = filter ? projectId.trim() : null;
        if (filter) {
            projectAccessService.requireAccess(user, pid);
        }
        List<Map<String, Object>> out = new ArrayList<>();
        for (RiskEntity r : riskRepository.findAll()) {
            if (r.getProjectId() == null || !visible.contains(r.getProjectId())) {
                continue;
            }
            if (filter && (r.getProjectId() == null || !pid.equals(r.getProjectId()))) {
                continue;
            }
            if (r.getStatus() != null && "closed".equalsIgnoreCase(r.getStatus())) continue;
            String sev = r.getSeverity();
            if (sev == null || (!"high".equalsIgnoreCase(sev) && !"critical".equalsIgnoreCase(sev))) continue;
            ProjectEntity p = projectRepository.findById(r.getProjectId()).orElse(null);
            out.add(Map.of(
                    "id", "alert-from-" + r.getId(),
                    "projectId", r.getProjectId(),
                    "projectName", p != null ? p.getName() : "Unknown",
                    "message", r.getDescription() != null ? r.getDescription() : "",
                    "type", "cost",
                    "severity", "critical".equalsIgnoreCase(sev) ? "high" : "medium"
            ));
        }
        return out.size() > 10 ? out.subList(0, 10) : out;
    }
}
