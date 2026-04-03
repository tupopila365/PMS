package com.cbmp.dashboard;

import com.cbmp.audit.AuditLogEntity;
import com.cbmp.audit.AuditLogRepository;
import com.cbmp.project.ProjectEntity;
import com.cbmp.project.ProjectRepository;
import com.cbmp.risk.RiskEntity;
import com.cbmp.risk.RiskRepository;
import com.cbmp.task.TaskEntity;
import com.cbmp.task.TaskRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class DashboardRecentActivityService {

    private final AuditLogRepository auditLogRepository;
    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final RiskRepository riskRepository;

    public DashboardRecentActivityService(
            AuditLogRepository auditLogRepository,
            TaskRepository taskRepository,
            ProjectRepository projectRepository,
            RiskRepository riskRepository
    ) {
        this.auditLogRepository = auditLogRepository;
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
        this.riskRepository = riskRepository;
    }

    public List<Map<String, Object>> recent(int limit, String projectIdFilter, Set<String> allowedProjectIds) {
        if (allowedProjectIds == null || allowedProjectIds.isEmpty()) {
            return List.of();
        }
        if (limit < 1) {
            limit = 5;
        }
        if (limit > 50) {
            limit = 50;
        }

        final boolean filterByProject = projectIdFilter != null && !projectIdFilter.isBlank();
        final String pid = filterByProject ? projectIdFilter.trim() : null;

        Map<String, String> projectNames = projectRepository.findAllById(allowedProjectIds).stream()
                .collect(Collectors.toMap(ProjectEntity::getId, p -> p.getName() != null ? p.getName() : "Project", (a, b) -> a));

        List<TimedRow> rows = new ArrayList<>();

        for (AuditLogEntity e : auditLogRepository.findTop100ByOrderByTimestampDesc()) {
            if (filterByProject && !pid.equals(nz(e.getProjectId()))) {
                continue;
            }
            if (!filterByProject) {
                String aid = nz(e.getProjectId());
                if (!aid.isEmpty() && !allowedProjectIds.contains(aid)) {
                    continue;
                }
            }
            Instant at = parseInstant(e.getTimestamp());
            rows.add(new TimedRow(at, auditToMap(e)));
        }

        for (TaskEntity t : taskRepository.findTop40ByOrderByCreatedAtDesc()) {
            if (t.getCreatedAt() == null) {
                continue;
            }
            if (t.getProjectId() == null || !allowedProjectIds.contains(t.getProjectId())) {
                continue;
            }
            if (filterByProject && !pid.equals(nz(t.getProjectId()))) {
                continue;
            }
            String projectName = projectNames.getOrDefault(t.getProjectId(), "Unknown project");
            rows.add(new TimedRow(t.getCreatedAt(), syntheticMap(
                    "syn-task-" + t.getId(),
                    "",
                    "—",
                    "task_created",
                    "task",
                    t.getId(),
                    t.getProjectId() != null ? t.getProjectId() : "",
                    projectName,
                    t.getCreatedAt().toString()
            )));
        }

        for (ProjectEntity p : projectRepository.findTop25ByOrderByCreatedAtDesc()) {
            if (p.getCreatedAt() == null) {
                continue;
            }
            if (!allowedProjectIds.contains(p.getId())) {
                continue;
            }
            if (filterByProject && !pid.equals(p.getId())) {
                continue;
            }
            String name = p.getName() != null ? p.getName() : "Project";
            rows.add(new TimedRow(p.getCreatedAt(), syntheticMap(
                    "syn-project-" + p.getId(),
                    "",
                    "—",
                    "project_created",
                    "project",
                    p.getId(),
                    p.getId(),
                    name,
                    p.getCreatedAt().toString()
            )));
        }

        for (RiskEntity r : riskRepository.findTop25ByOrderByCreatedAtDesc()) {
            if (r.getCreatedAt() == null) {
                continue;
            }
            if (r.getProjectId() == null || !allowedProjectIds.contains(r.getProjectId())) {
                continue;
            }
            if (filterByProject && !pid.equals(nz(r.getProjectId()))) {
                continue;
            }
            String projectName = projectNames.getOrDefault(r.getProjectId(), "Unknown project");
            rows.add(new TimedRow(r.getCreatedAt(), syntheticMap(
                    "syn-risk-" + r.getId(),
                    "",
                    "—",
                    "risk_created",
                    "risk",
                    r.getId(),
                    r.getProjectId() != null ? r.getProjectId() : "",
                    projectName,
                    r.getCreatedAt().toString()
            )));
        }

        rows.sort(Comparator.comparing(TimedRow::at).reversed());

        return rows.stream().limit(limit).map(TimedRow::map).toList();
    }

    private static Instant parseInstant(String timestamp) {
        if (timestamp == null || timestamp.isBlank()) {
            return Instant.EPOCH;
        }
        try {
            return Instant.parse(timestamp);
        } catch (DateTimeParseException e) {
            return Instant.EPOCH;
        }
    }

    private static Map<String, Object> auditToMap(AuditLogEntity e) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", nz(e.getId()));
        m.put("userId", nz(e.getUserId()));
        m.put("userName", nz(e.getUserName()));
        m.put("action", nz(e.getAction()));
        m.put("entityType", nz(e.getEntityType()));
        m.put("entityId", nz(e.getEntityId()));
        m.put("projectId", nz(e.getProjectId()));
        m.put("projectName", nz(e.getProjectName()));
        m.put("timestamp", nz(e.getTimestamp()));
        return m;
    }

    private static Map<String, Object> syntheticMap(
            String id,
            String userId,
            String userName,
            String action,
            String entityType,
            String entityId,
            String projectId,
            String projectName,
            String timestamp
    ) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", id);
        m.put("userId", userId);
        m.put("userName", userName);
        m.put("action", action);
        m.put("entityType", entityType);
        m.put("entityId", entityId);
        m.put("projectId", projectId);
        m.put("projectName", projectName);
        m.put("timestamp", timestamp);
        return m;
    }

    private static String nz(String s) {
        return s != null ? s : "";
    }

    private record TimedRow(Instant at, Map<String, Object> map) {
    }
}
