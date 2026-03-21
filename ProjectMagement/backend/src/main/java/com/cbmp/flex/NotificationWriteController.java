package com.cbmp.flex;

import com.cbmp.auth.JwtAuthFilter;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Map;

/**
 * Creates in-app notifications (e.g. timesheet reminders to a specific user).
 */
@RestController
@RequestMapping("/api")
public class NotificationWriteController {

    private final FlexibleRecordService flex;

    public NotificationWriteController(FlexibleRecordService flex) {
        this.flex = flex;
    }

    @PostMapping("/notifications")
    public Map<String, Object> createNotification(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser currentUser
    ) {
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        String role = currentUser.role();
        if (!"admin".equals(role) && !"project_manager".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        Object target = body.get("targetUserId");
        if (target == null || target.toString().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "targetUserId required");
        }
        body.putIfAbsent("read", false);
        body.putIfAbsent("createdAt", Instant.now().toString());
        body.put("createdByUserId", currentUser.id());
        String pid = body.get("projectId") != null ? body.get("projectId").toString() : null;
        return flex.save("notification", pid, body);
    }
}
