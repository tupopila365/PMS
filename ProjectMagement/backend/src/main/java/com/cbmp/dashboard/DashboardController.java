package com.cbmp.dashboard;

import com.cbmp.auth.JwtAuthFilter;
import com.cbmp.org.UserEntity;
import com.cbmp.project.ProjectAccessService;
import com.cbmp.project.ProjectEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardKpiService dashboardKpiService;
    private final DashboardRecentActivityService recentActivityService;
    private final ProjectAccessService projectAccessService;

    public DashboardController(
            DashboardKpiService dashboardKpiService,
            DashboardRecentActivityService recentActivityService,
            ProjectAccessService projectAccessService
    ) {
        this.dashboardKpiService = dashboardKpiService;
        this.recentActivityService = recentActivityService;
        this.projectAccessService = projectAccessService;
    }

    @GetMapping("/kpis")
    public DashboardKpiDto kpis(
            @RequestParam(required = false) String projectId,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser auth
    ) {
        UserEntity user = projectAccessService.requireUser(auth);
        List<String> allowed = projectAccessService.visibleProjects(user).stream().map(ProjectEntity::getId).toList();
        return dashboardKpiService.aggregate(projectId, allowed);
    }

    @GetMapping("/recent-activity")
    public List<Map<String, Object>> recentActivity(
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) String projectId,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser auth
    ) {
        UserEntity user = projectAccessService.requireUser(auth);
        Set<String> allowed = projectAccessService.visibleProjectIds(user);
        if (projectId != null && !projectId.isBlank() && !allowed.contains(projectId.trim())) {
            return List.of();
        }
        return recentActivityService.recent(limit != null ? limit : 5, projectId, allowed);
    }
}
