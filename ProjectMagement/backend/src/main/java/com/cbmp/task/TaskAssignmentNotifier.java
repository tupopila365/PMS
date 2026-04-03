package com.cbmp.task;

import com.cbmp.notification.InAppNotificationPublisher;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class TaskAssignmentNotifier {

    private final InAppNotificationPublisher publisher;

    public TaskAssignmentNotifier(InAppNotificationPublisher publisher) {
        this.publisher = publisher;
    }

    /**
     * Creates one in-app notification per user id that appears in {@code newAssignees} but not in {@code previousAssignees}.
     */
    public void notifyNewAssignees(
            String taskId,
            String taskTitle,
            String projectId,
            String projectDisplayName,
            String assignerDisplayName,
            String dueDate,
            List<String> previousAssignees,
            List<String> newAssignees
    ) {
        if (taskId == null || taskId.isBlank()) {
            return;
        }
        Set<String> prev = normalizeIds(previousAssignees);
        List<String> added = new ArrayList<>();
        LinkedHashSet<String> seen = new LinkedHashSet<>();
        if (newAssignees != null) {
            for (String raw : newAssignees) {
                if (raw == null) {
                    continue;
                }
                String id = raw.trim();
                if (id.isEmpty() || seen.contains(id)) {
                    continue;
                }
                seen.add(id);
                if (!prev.contains(id)) {
                    added.add(id);
                }
            }
        }
        if (added.isEmpty()) {
            return;
        }

        String safeTaskTitle = taskTitle != null && !taskTitle.isBlank() ? taskTitle.trim() : "Untitled task";
        String safeProject = projectDisplayName != null && !projectDisplayName.isBlank() ? projectDisplayName.trim() : "Unknown project";
        String assigner = assignerDisplayName != null && !assignerDisplayName.isBlank()
                ? assignerDisplayName.trim()
                : "A team member";
        String due = dueDate != null && !dueDate.isBlank() ? dueDate.trim() : null;

        String notifTitle = "Assigned: " + safeTaskTitle;
        String message = "You were added to this task in project \"" + safeProject + "\". "
                + "Assigned by " + assigner + ". "
                + (due != null ? "Due date: " + due + "." : "No due date on this task.");

        for (String userId : added) {
            Map<String, Object> extras = new LinkedHashMap<>();
            extras.put("taskTitle", safeTaskTitle);
            extras.put("projectName", safeProject);
            extras.put("assignedByName", assigner);
            if (due != null) {
                extras.put("dueDate", due);
            }
            publisher.publish(userId, "assignment", notifTitle, message, projectId, taskId, extras);
        }
    }

    private static Set<String> normalizeIds(List<String> ids) {
        Set<String> s = new LinkedHashSet<>();
        if (ids == null) {
            return s;
        }
        for (String raw : ids) {
            if (raw != null) {
                String id = raw.trim();
                if (!id.isEmpty()) {
                    s.add(id);
                }
            }
        }
        return s;
    }
}
