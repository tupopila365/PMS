package com.cbmp.flex;

import com.cbmp.auth.JwtAuthFilter;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class FlexibleApiController {

    private final FlexibleRecordService flex;

    public FlexibleApiController(FlexibleRecordService flex) {
        this.flex = flex;
    }

    @GetMapping("/projects/{projectId}/stakeholders")
    public List<Map<String, Object>> listStakeholders(@PathVariable String projectId) {
        return flex.list("stakeholder", projectId);
    }

    @PostMapping("/projects/{projectId}/stakeholders")
    public Map<String, Object> createStakeholder(@PathVariable String projectId, @RequestBody Map<String, Object> body) {
        body.put("projectId", projectId);
        return flex.save("stakeholder", projectId, body);
    }

    @PutMapping("/projects/{projectId}/stakeholders/{id}")
    public Map<String, Object> updateStakeholder(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return flex.update(id, body);
    }

    @GetMapping("/projects/{projectId}/raid")
    public List<Map<String, Object>> listRaid(@PathVariable String projectId) {
        return flex.list("raid", projectId);
    }

    @PostMapping("/projects/{projectId}/raid")
    public Map<String, Object> createRaid(@PathVariable String projectId, @RequestBody Map<String, Object> body) {
        body.put("projectId", projectId);
        return flex.save("raid", projectId, body);
    }

    @PutMapping("/projects/{projectId}/raid/{id}")
    public Map<String, Object> updateRaid(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return flex.update(id, body);
    }

    @GetMapping("/projects/{projectId}/raci")
    public List<Map<String, Object>> listRaci(@PathVariable String projectId) {
        return flex.list("raci", projectId);
    }

    @PutMapping("/projects/{projectId}/raci/{id}")
    public Map<String, Object> updateRaci(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return flex.update(id, body);
    }

    @GetMapping("/projects/{projectId}/resources")
    public List<Map<String, Object>> listResources(@PathVariable String projectId) {
        return flex.list("resource", projectId);
    }

    @PostMapping("/projects/{projectId}/resources")
    public Map<String, Object> createResource(@PathVariable String projectId, @RequestBody Map<String, Object> body) {
        body.put("projectId", projectId);
        return flex.save("resource", projectId, body);
    }

    @PutMapping("/projects/{projectId}/resources/{id}")
    public Map<String, Object> updateResource(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return flex.update(id, body);
    }

    @DeleteMapping("/resources/{id}")
    public void deleteResource(@PathVariable String id) {
        flex.delete(id);
    }

    @GetMapping("/timesheets")
    public List<Map<String, Object>> listTimesheets(@RequestParam(required = false) String projectId) {
        return flex.listTimesheets(projectId);
    }

    @PostMapping("/timesheets")
    public Map<String, Object> createTimesheet(@RequestBody Map<String, Object> body) {
        String pid = (String) body.get("projectId");
        if (pid == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "projectId required");
        Map<String, Object> saved = flex.save("timesheet", pid, body);
        Object uid = body.get("userId");
        Object tid = body.get("taskId");
        if (uid != null && tid != null) {
            flex.dismissTimesheetRemindersForEntry(uid.toString(), pid, tid.toString());
        }
        return saved;
    }

    @PutMapping("/timesheets/{id}")
    public Map<String, Object> updateTimesheet(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return flex.update(id, body);
    }

    @DeleteMapping("/timesheets/{id}")
    public void deleteTimesheet(@PathVariable String id) {
        flex.delete(id);
    }

    @GetMapping("/changes")
    public List<Map<String, Object>> listChanges(@RequestParam(required = false) String projectId) {
        return flex.listChanges(projectId);
    }

    @PostMapping("/changes")
    public Map<String, Object> createChange(@RequestBody Map<String, Object> body) {
        String pid = (String) body.get("projectId");
        if (pid == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "projectId required");
        return flex.save("change", pid, body);
    }

    @PutMapping("/changes/{id}")
    public Map<String, Object> updateChange(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return flex.update(id, body);
    }

    @GetMapping("/projects/{projectId}/cost-benefit")
    public Map<String, Object> getCostBenefit(@PathVariable String projectId) {
        return flex.getCostBenefit(projectId);
    }

    @PutMapping("/projects/{projectId}/cost-benefit")
    public Map<String, Object> putCostBenefit(@PathVariable String projectId, @RequestBody Map<String, Object> body) {
        return flex.putCostBenefit(projectId, body);
    }

    @GetMapping("/baselines")
    public List<Map<String, Object>> listBaselines(@RequestParam(required = false) String projectId) {
        return flex.listBaselines(projectId);
    }

    @PostMapping("/baselines")
    public Map<String, Object> createBaseline(@RequestBody Map<String, Object> body) {
        String pid = (String) body.get("projectId");
        if (pid == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "projectId required");
        return flex.save("baseline", pid, body);
    }

    @GetMapping("/notifications")
    public List<Map<String, Object>> listNotifications(@AuthenticationPrincipal JwtAuthFilter.AuthUser user) {
        if (user == null) {
            return flex.list("notification", null);
        }
        return flex.listNotificationsForUser(user.id());
    }

    @PatchMapping("/notifications/{id}")
    public Map<String, Object> patchNotification(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return flex.patchNotification(id, body);
    }

    @PostMapping("/notifications/read-all")
    public void readAllNotifications() {
        flex.markAllNotificationsRead();
    }

    @GetMapping("/documents")
    public List<Map<String, Object>> listDocuments(
            @RequestParam(required = false) String projectId,
            @RequestParam(required = false) String taskId
    ) {
        if (projectId == null || projectId.isBlank()) {
            return flex.list("document", null);
        }
        return flex.listDocuments(projectId, taskId);
    }

    @PostMapping("/documents")
    public Map<String, Object> createDocument(@RequestBody Map<String, Object> body) {
        String pid = (String) body.get("projectId");
        if (pid == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "projectId required");
        return flex.save("document", pid, body);
    }

    @DeleteMapping("/documents/{id}")
    public void deleteDocument(@PathVariable String id) {
        flex.delete(id);
    }
}
