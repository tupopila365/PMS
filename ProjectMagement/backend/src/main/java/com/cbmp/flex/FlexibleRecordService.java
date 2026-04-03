package com.cbmp.flex;

import com.cbmp.auth.JwtAuthFilter;
import com.cbmp.notification.FlexibleRecordLifecycleNotifier;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class FlexibleRecordService {

    private static final Path DOCUMENT_UPLOAD_DIR = Paths.get("uploads", "documents").toAbsolutePath().normalize();

    private final AppRecordRepository repository;
    private final ObjectMapper objectMapper;
    private final FlexibleRecordLifecycleNotifier lifecycleNotifier;

    public FlexibleRecordService(
            AppRecordRepository repository,
            ObjectMapper objectMapper,
            @Lazy FlexibleRecordLifecycleNotifier lifecycleNotifier
    ) {
        this.repository = repository;
        this.objectMapper = objectMapper;
        this.lifecycleNotifier = lifecycleNotifier;
    }

    public java.util.Optional<Map<String, Object>> findPayloadById(String id) {
        return repository.findById(id).map(this::toMap);
    }

    @Transactional
    public int replaceBoqLines(String projectId, java.util.List<Map<String, Object>> lines, JwtAuthFilter.AuthUser actor) {
        repository.deleteByKindAndProjectId("boq_line", projectId);
        int n = 0;
        for (Map<String, Object> line : lines) {
            Map<String, Object> copy = new LinkedHashMap<>(line);
            copy.remove("id");
            save("boq_line", projectId, copy, actor);
            n++;
        }
        return n;
    }

    public List<Map<String, Object>> list(String kind, String projectId) {
        List<AppRecordEntity> rows = projectId != null && !projectId.isBlank()
                ? repository.findByKindAndProjectIdOrderById(kind, projectId)
                : repository.findByKindOrderById(kind);
        return rows.stream().map(this::toMap).toList();
    }

    public List<Map<String, Object>> listDocuments(String projectId, String taskId) {
        List<Map<String, Object>> all = list("document", projectId);
        if (taskId == null || taskId.isBlank()) return all;
        return all.stream()
                .filter(m -> taskId.equals(String.valueOf(m.get("taskId"))))
                .toList();
    }

    public List<Map<String, Object>> listChanges(String projectId) {
        if (projectId != null && !projectId.isBlank()) {
            return list("change", projectId);
        }
        return repository.findByKindOrderById("change").stream().map(this::toMap).toList();
    }

    public List<Map<String, Object>> listTimesheets(String projectId) {
        if (projectId != null && !projectId.isBlank()) {
            return list("timesheet", projectId);
        }
        return repository.findByKindOrderById("timesheet").stream().map(this::toMap).toList();
    }

    public List<Map<String, Object>> listBaselines(String projectId) {
        if (projectId != null && !projectId.isBlank()) {
            return list("baseline", projectId);
        }
        return repository.findByKindOrderById("baseline").stream().map(this::toMap).toList();
    }

    public Map<String, Object> getCostBenefit(String projectId) {
        return repository.findFirstByKindAndProjectId("cost_benefit", projectId)
                .map(this::toMap)
                .orElse(null);
    }

    public Map<String, Object> save(String kind, String projectId, Map<String, Object> body) {
        return save(kind, projectId, body, null);
    }

    public Map<String, Object> save(String kind, String projectId, Map<String, Object> body, JwtAuthFilter.AuthUser actor) {
        String id = body.get("id") != null ? body.get("id").toString() : UUID.randomUUID().toString();
        body.put("id", id);
        AppRecordEntity e = new AppRecordEntity();
        e.setId(id);
        e.setKind(kind);
        e.setProjectId(projectId);
        try {
            e.setPayloadJson(objectMapper.writeValueAsString(body));
        } catch (Exception ex) {
            throw new IllegalStateException(ex);
        }
        Map<String, Object> result = toMap(repository.save(e));
        lifecycleNotifier.afterSave(kind, result, actor);
        return result;
    }

    public Map<String, Object> update(String id, Map<String, Object> body) {
        return update(id, body, null);
    }

    public Map<String, Object> update(String id, Map<String, Object> body, JwtAuthFilter.AuthUser actor) {
        AppRecordEntity e = repository.findById(id).orElseThrow();
        Map<String, Object> before = new LinkedHashMap<>(toMap(e));
        Map<String, Object> merged = new LinkedHashMap<>(before);
        merged.putAll(body);
        merged.put("id", id);
        try {
            e.setPayloadJson(objectMapper.writeValueAsString(merged));
        } catch (Exception ex) {
            throw new IllegalStateException(ex);
        }
        Map<String, Object> after = toMap(repository.save(e));
        lifecycleNotifier.afterUpdate(e.getKind(), before, after, actor);
        return after;
    }

    public void delete(String id) {
        repository.findById(id).ifPresent(e -> {
            if ("document".equals(e.getKind())) {
                try {
                    Map<String, Object> m = objectMapper.readValue(e.getPayloadJson(), new TypeReference<>() {});
                    Object disk = m.get("_diskName");
                    if (disk != null) {
                        Path p = DOCUMENT_UPLOAD_DIR.resolve(disk.toString());
                        Files.deleteIfExists(p);
                    }
                } catch (Exception ignored) {
                }
            }
            repository.delete(e);
        });
    }

    public Map<String, Object> putCostBenefit(String projectId, Map<String, Object> body) {
        repository.findFirstByKindAndProjectId("cost_benefit", projectId).ifPresent(repository::delete);
        body.put("projectId", projectId);
        return save("cost_benefit", projectId, body);
    }

    public void markAllNotificationsRead() {
        for (AppRecordEntity e : repository.findByKindOrderById("notification")) {
            try {
                Map<String, Object> m = objectMapper.readValue(e.getPayloadJson(), new TypeReference<>() {});
                m.put("read", true);
                e.setPayloadJson(objectMapper.writeValueAsString(m));
                repository.save(e);
            } catch (Exception ignored) {
            }
        }
    }

    public Map<String, Object> patchNotification(String id, Map<String, Object> patch) {
        return update(id, patch);
    }

    /** Notifications without targetUserId are visible to everyone; otherwise only to that user. */
    public List<Map<String, Object>> listNotificationsForUser(String userId) {
        List<Map<String, Object>> all = list("notification", null);
        return all.stream()
                .filter(m -> {
                    Object t = m.get("targetUserId");
                    if (t == null || t.toString().isBlank()) {
                        return true;
                    }
                    return userId != null && t.toString().equals(userId);
                })
                .sorted((a, b) -> {
                    String ca = String.valueOf(a.getOrDefault("createdAt", ""));
                    String cb = String.valueOf(b.getOrDefault("createdAt", ""));
                    return cb.compareTo(ca);
                })
                .collect(Collectors.toList());
    }

    /** Marks matching timesheet reminder notifications read after the user logs time on that task. */
    public void dismissTimesheetRemindersForEntry(String userId, String projectId, String taskId) {
        if (userId == null || userId.isBlank() || taskId == null || taskId.isBlank()) {
            return;
        }
        for (AppRecordEntity e : repository.findByKindOrderById("notification")) {
            try {
                Map<String, Object> m = objectMapper.readValue(e.getPayloadJson(), new TypeReference<>() {});
                if (!"timesheet_reminder".equals(String.valueOf(m.get("type")))) {
                    continue;
                }
                if (!userId.equals(String.valueOf(m.get("targetUserId")))) {
                    continue;
                }
                if (!taskId.equals(String.valueOf(m.get("taskId")))) {
                    continue;
                }
                Object np = m.get("projectId");
                if (np != null && !np.toString().isBlank() && projectId != null && !projectId.equals(np.toString())) {
                    continue;
                }
                m.put("read", true);
                e.setPayloadJson(objectMapper.writeValueAsString(m));
                repository.save(e);
            } catch (Exception ignored) {
            }
        }
    }

    private Map<String, Object> toMap(AppRecordEntity e) {
        try {
            Map<String, Object> m = objectMapper.readValue(e.getPayloadJson(), new TypeReference<>() {});
            m.put("id", e.getId());
            return m;
        } catch (Exception ex) {
            throw new IllegalStateException(ex);
        }
    }
}
