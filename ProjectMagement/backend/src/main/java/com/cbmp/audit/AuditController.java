package com.cbmp.audit;

import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/audit")
public class AuditController {

    private final AuditLogRepository auditLogRepository;

    public AuditController(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @GetMapping("/recent")
    public List<Map<String, Object>> recent(@RequestParam(required = false) Integer limit) {
        List<AuditLogEntity> rows = auditLogRepository.findTop100ByOrderByTimestampDesc();
        if (limit != null && limit > 0 && rows.size() > limit) {
            rows = rows.subList(0, limit);
        }
        return rows.stream().map(this::toJson).collect(Collectors.toList());
    }

    @PostMapping("/log")
    public void log(@RequestBody Map<String, Object> body) {
        AuditLogEntity e = new AuditLogEntity();
        if (body.get("id") != null) e.setId(body.get("id").toString());
        e.setUserId(body.get("userId") != null ? body.get("userId").toString() : null);
        e.setUserName(body.get("userName") != null ? body.get("userName").toString() : null);
        e.setAction(body.get("action") != null ? body.get("action").toString() : null);
        e.setEntityType(body.get("entityType") != null ? body.get("entityType").toString() : null);
        e.setEntityId(body.get("entityId") != null ? body.get("entityId").toString() : null);
        e.setProjectId(body.get("projectId") != null ? body.get("projectId").toString() : null);
        e.setProjectName(body.get("projectName") != null ? body.get("projectName").toString() : null);
        e.setTimestamp(body.get("timestamp") != null ? body.get("timestamp").toString() : Instant.now().toString());
        auditLogRepository.save(e);
    }

    private Map<String, Object> toJson(AuditLogEntity e) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", e.getId() != null ? e.getId() : "");
        m.put("userId", e.getUserId() != null ? e.getUserId() : "");
        m.put("userName", e.getUserName() != null ? e.getUserName() : "");
        m.put("action", e.getAction() != null ? e.getAction() : "");
        m.put("entityType", e.getEntityType() != null ? e.getEntityType() : "");
        m.put("entityId", e.getEntityId() != null ? e.getEntityId() : "");
        m.put("projectId", e.getProjectId() != null ? e.getProjectId() : "");
        m.put("projectName", e.getProjectName() != null ? e.getProjectName() : "");
        m.put("timestamp", e.getTimestamp() != null ? e.getTimestamp() : "");
        return m;
    }
}
