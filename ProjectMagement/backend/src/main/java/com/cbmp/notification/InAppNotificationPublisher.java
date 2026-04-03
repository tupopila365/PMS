package com.cbmp.notification;

import com.cbmp.flex.AppRecordEntity;
import com.cbmp.flex.AppRecordRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class InAppNotificationPublisher {

    private final AppRecordRepository repository;
    private final ObjectMapper objectMapper;

    public InAppNotificationPublisher(AppRecordRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    /**
     * In-app notification visible only to {@code targetUserId}.
     */
    public void publish(
            String targetUserId,
            String type,
            String title,
            String message,
            String projectId,
            String taskId,
            Map<String, Object> extraFields
    ) {
        if (targetUserId == null || targetUserId.isBlank()) {
            return;
        }
        String id = UUID.randomUUID().toString();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", id);
        body.put("type", type != null ? type : "general");
        body.put("title", title != null ? title : "Notification");
        body.put("message", message != null ? message : "");
        body.put("targetUserId", targetUserId);
        body.put("projectId", projectId != null ? projectId : "");
        if (taskId != null && !taskId.isBlank()) {
            body.put("taskId", taskId);
        }
        body.put("read", false);
        body.put("createdAt", Instant.now().toString());
        if (extraFields != null) {
            for (Map.Entry<String, Object> e : extraFields.entrySet()) {
                if (e.getValue() != null && !body.containsKey(e.getKey())) {
                    body.put(e.getKey(), e.getValue());
                }
            }
        }
        persist(id, projectId, body);
    }

    public void publish(String targetUserId, String type, String title, String message, String projectId, String taskId) {
        publish(targetUserId, type, title, message, projectId, taskId, null);
    }

    private void persist(String id, String projectId, Map<String, Object> body) {
        try {
            AppRecordEntity e = new AppRecordEntity();
            e.setId(id);
            e.setKind("notification");
            e.setProjectId(projectId);
            e.setPayloadJson(objectMapper.writeValueAsString(body));
            repository.save(e);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to persist notification", ex);
        }
    }
}
