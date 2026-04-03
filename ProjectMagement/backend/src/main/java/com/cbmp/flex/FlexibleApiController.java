package com.cbmp.flex;

import com.cbmp.auth.JwtAuthFilter;
import com.cbmp.org.UserEntity;
import com.cbmp.project.ProjectAccessService;
import com.cbmp.workflow.VariationOrderWorkflowService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class FlexibleApiController {

    private final FlexibleRecordService flex;
    private final ProjectAccessService projectAccessService;
    private final AppRecordRepository appRecordRepository;
    private final VariationOrderWorkflowService variationOrderWorkflowService;

    public FlexibleApiController(
            FlexibleRecordService flex,
            ProjectAccessService projectAccessService,
            AppRecordRepository appRecordRepository,
            VariationOrderWorkflowService variationOrderWorkflowService
    ) {
        this.flex = flex;
        this.projectAccessService = projectAccessService;
        this.appRecordRepository = appRecordRepository;
        this.variationOrderWorkflowService = variationOrderWorkflowService;
    }

    private UserEntity requireDbUser(JwtAuthFilter.AuthUser auth) {
        return projectAccessService.requireUser(auth);
    }

    private void requireProject(UserEntity user, String projectId) {
        projectAccessService.requireAccess(user, projectId);
    }

    private List<Map<String, Object>> filterByVisibleProjects(List<Map<String, Object>> rows, Set<String> visible) {
        return rows.stream()
                .filter(m -> {
                    Object pid = m.get("projectId");
                    return pid != null && !pid.toString().isBlank() && visible.contains(pid.toString());
                })
                .collect(Collectors.toList());
    }

    private void ensureFlexRecordAccess(JwtAuthFilter.AuthUser auth, String id) {
        UserEntity user = requireDbUser(auth);
        AppRecordEntity rec = appRecordRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if ("notification".equals(rec.getKind())) {
            return;
        }
        String pid = rec.getProjectId();
        if (pid == null || pid.isBlank()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        requireProject(user, pid);
    }

    /** Ensures the record exists under {@code pathProjectId} and the user may access that project. */
    private void ensureFlexRecordInProject(JwtAuthFilter.AuthUser auth, String id, String pathProjectId) {
        UserEntity user = requireDbUser(auth);
        AppRecordEntity rec = appRecordRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (rec.getProjectId() == null || !rec.getProjectId().equals(pathProjectId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        requireProject(user, pathProjectId);
    }

    @GetMapping("/projects/{projectId}/stakeholders")
    public List<Map<String, Object>> listStakeholders(
            @PathVariable String projectId,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser auth
    ) {
        UserEntity user = requireDbUser(auth);
        requireProject(user, projectId);
        return flex.list("stakeholder", projectId);
    }

    @PostMapping("/projects/{projectId}/stakeholders")
    public Map<String, Object> createStakeholder(
            @PathVariable String projectId,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser auth
    ) {
        UserEntity user = requireDbUser(auth);
        requireProject(user, projectId);
        body.put("projectId", projectId);
        return flex.save("stakeholder", projectId, body);
    }

    @PutMapping("/projects/{projectId}/stakeholders/{id}")
    public Map<String, Object> updateStakeholder(
            @PathVariable String projectId,
            @PathVariable String id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser auth
    ) {
        ensureFlexRecordInProject(auth, id, projectId);
        return flex.update(id, body);
    }

    @GetMapping("/projects/{projectId}/raid")
    public List<Map<String, Object>> listRaid(
            @PathVariable String projectId,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser auth
    ) {
        UserEntity user = requireDbUser(auth);
        requireProject(user, projectId);
        return flex.list("raid", projectId);
    }

    @PostMapping("/projects/{projectId}/raid")
    public Map<String, Object> createRaid(
            @PathVariable String projectId,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser auth
    ) {
        UserEntity user = requireDbUser(auth);
        requireProject(user, projectId);
        body.put("projectId", projectId);
        return flex.save("raid", projectId, body);
    }

    @PutMapping("/projects/{projectId}/raid/{id}")
    public Map<String, Object> updateRaid(
            @PathVariable String projectId,
            @PathVariable String id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser auth
    ) {
        ensureFlexRecordInProject(auth, id, projectId);
        return flex.update(id, body);
    }

    @GetMapping("/projects/{projectId}/variation-orders")
    public List<Map<String, Object>> listVariationOrders(
            @PathVariable String projectId,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser auth
    ) {
        UserEntity user = requireDbUser(auth);
        requireProject(user, projectId);
        return flex.list("variation_order", projectId);
    }

    @PostMapping("/projects/{projectId}/variation-orders")
    public Map<String, Object> createVariationOrder(
            @PathVariable String projectId,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser authUser
    ) {
        UserEntity user = requireDbUser(authUser);
        requireProject(user, projectId);
        body.put("projectId", projectId);
        body.put("submittedByUserId", user.getId());
        return flex.save("variation_order", projectId, body, authUser);
    }

    @PutMapping("/projects/{projectId}/variation-orders/{id}")
    public Map<String, Object> updateVariationOrder(
            @PathVariable String projectId,
            @PathVariable String id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser authUser
    ) {
        ensureFlexRecordInProject(authUser, id, projectId);
        UserEntity user = requireDbUser(authUser);
        Map<String, Object> before = flex.findPayloadById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Object statusPatch = body.get("status");
        if (statusPatch != null) {
            String from = before.get("status") != null ? before.get("status").toString().trim() : "";
            variationOrderWorkflowService.assertTransition(from, statusPatch.toString(), user.getRole());
        }
        return flex.update(id, body, authUser);
    }

    @GetMapping("/projects/{projectId}/rfis")
    public List<Map<String, Object>> listRfis(
            @PathVariable String projectId,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser auth
    ) {
        UserEntity user = requireDbUser(auth);
        requireProject(user, projectId);
        return flex.list("rfi", projectId);
    }

    @PostMapping("/projects/{projectId}/rfis")
    public Map<String, Object> createRfi(
            @PathVariable String projectId,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser authUser
    ) {
        UserEntity user = requireDbUser(authUser);
        requireProject(user, projectId);
        body.put("projectId", projectId);
        body.put("raisedByUserId", user.getId());
        return flex.save("rfi", projectId, body, authUser);
    }

    @PutMapping("/projects/{projectId}/rfis/{id}")
    public Map<String, Object> updateRfi(
            @PathVariable String projectId,
            @PathVariable String id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser authUser
    ) {
        ensureFlexRecordInProject(authUser, id, projectId);
        return flex.update(id, body, authUser);
    }

    @GetMapping("/projects/{projectId}/raci")
    public List<Map<String, Object>> listRaci(
            @PathVariable String projectId,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser auth
    ) {
        UserEntity user = requireDbUser(auth);
        requireProject(user, projectId);
        return flex.list("raci", projectId);
    }

    @PutMapping("/projects/{projectId}/raci/{id}")
    public Map<String, Object> updateRaci(
            @PathVariable String projectId,
            @PathVariable String id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser auth
    ) {
        ensureFlexRecordInProject(auth, id, projectId);
        return flex.update(id, body);
    }

    @GetMapping("/projects/{projectId}/resources")
    public List<Map<String, Object>> listResources(
            @PathVariable String projectId,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser auth
    ) {
        UserEntity user = requireDbUser(auth);
        requireProject(user, projectId);
        return flex.list("resource", projectId);
    }

    @PostMapping("/projects/{projectId}/resources")
    public Map<String, Object> createResource(
            @PathVariable String projectId,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser auth
    ) {
        UserEntity user = requireDbUser(auth);
        requireProject(user, projectId);
        body.put("projectId", projectId);
        return flex.save("resource", projectId, body);
    }

    @PutMapping("/projects/{projectId}/resources/{id}")
    public Map<String, Object> updateResource(
            @PathVariable String projectId,
            @PathVariable String id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser auth
    ) {
        ensureFlexRecordInProject(auth, id, projectId);
        return flex.update(id, body);
    }

    @DeleteMapping("/resources/{id}")
    public void deleteResource(@PathVariable String id, @AuthenticationPrincipal JwtAuthFilter.AuthUser auth) {
        ensureFlexRecordAccess(auth, id);
        flex.delete(id);
    }

    @GetMapping("/timesheets")
    public List<Map<String, Object>> listTimesheets(
            @RequestParam(required = false) String projectId,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser auth
    ) {
        UserEntity user = requireDbUser(auth);
        Set<String> visible = projectAccessService.visibleProjectIds(user);
        if (projectId != null && !projectId.isBlank()) {
            requireProject(user, projectId);
            return flex.listTimesheets(projectId);
        }
        return filterByVisibleProjects(flex.listTimesheets(null), visible);
    }

    @PostMapping("/timesheets")
    public Map<String, Object> createTimesheet(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser user
    ) {
        UserEntity dbUser = requireDbUser(user);
        String pid = (String) body.get("projectId");
        if (pid == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "projectId required");
        requireProject(dbUser, pid);
        Map<String, Object> saved = flex.save("timesheet", pid, body, user);
        Object uid = body.get("userId");
        Object tid = body.get("taskId");
        if (uid != null && tid != null) {
            flex.dismissTimesheetRemindersForEntry(uid.toString(), pid, tid.toString());
        }
        return saved;
    }

    @PutMapping("/timesheets/{id}")
    public Map<String, Object> updateTimesheet(
            @PathVariable String id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser auth
    ) {
        ensureFlexRecordAccess(auth, id);
        return flex.update(id, body);
    }

    @DeleteMapping("/timesheets/{id}")
    public void deleteTimesheet(@PathVariable String id, @AuthenticationPrincipal JwtAuthFilter.AuthUser auth) {
        ensureFlexRecordAccess(auth, id);
        flex.delete(id);
    }

    @GetMapping("/changes")
    public List<Map<String, Object>> listChanges(
            @RequestParam(required = false) String projectId,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser auth
    ) {
        UserEntity user = requireDbUser(auth);
        Set<String> visible = projectAccessService.visibleProjectIds(user);
        if (projectId != null && !projectId.isBlank()) {
            requireProject(user, projectId);
            return flex.listChanges(projectId);
        }
        return filterByVisibleProjects(flex.listChanges(null), visible);
    }

    @PostMapping("/changes")
    public Map<String, Object> createChange(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser user
    ) {
        UserEntity dbUser = requireDbUser(user);
        String pid = (String) body.get("projectId");
        if (pid == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "projectId required");
        requireProject(dbUser, pid);
        return flex.save("change", pid, body, user);
    }

    @PutMapping("/changes/{id}")
    public Map<String, Object> updateChange(
            @PathVariable String id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser user
    ) {
        ensureFlexRecordAccess(user, id);
        return flex.update(id, body, user);
    }

    @GetMapping("/projects/{projectId}/cost-benefit")
    public Map<String, Object> getCostBenefit(
            @PathVariable String projectId,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser auth
    ) {
        UserEntity user = requireDbUser(auth);
        requireProject(user, projectId);
        return flex.getCostBenefit(projectId);
    }

    @PutMapping("/projects/{projectId}/cost-benefit")
    public Map<String, Object> putCostBenefit(
            @PathVariable String projectId,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser auth
    ) {
        UserEntity user = requireDbUser(auth);
        requireProject(user, projectId);
        return flex.putCostBenefit(projectId, body);
    }

    @GetMapping("/baselines")
    public List<Map<String, Object>> listBaselines(
            @RequestParam(required = false) String projectId,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser auth
    ) {
        UserEntity user = requireDbUser(auth);
        Set<String> visible = projectAccessService.visibleProjectIds(user);
        if (projectId != null && !projectId.isBlank()) {
            requireProject(user, projectId);
            return flex.listBaselines(projectId);
        }
        return filterByVisibleProjects(flex.listBaselines(null), visible);
    }

    @PostMapping("/baselines")
    public Map<String, Object> createBaseline(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser auth
    ) {
        UserEntity user = requireDbUser(auth);
        String pid = (String) body.get("projectId");
        if (pid == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "projectId required");
        requireProject(user, pid);
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
            @RequestParam(required = false) String taskId,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser auth
    ) {
        UserEntity user = requireDbUser(auth);
        Set<String> visible = projectAccessService.visibleProjectIds(user);
        if (projectId == null || projectId.isBlank()) {
            List<Map<String, Object>> all = flex.list("document", null);
            List<Map<String, Object>> filtered = filterByVisibleProjects(all, visible);
            if (taskId == null || taskId.isBlank()) {
                return filtered;
            }
            return filtered.stream()
                    .filter(m -> taskId.equals(String.valueOf(m.get("taskId"))))
                    .toList();
        }
        requireProject(user, projectId);
        return flex.listDocuments(projectId, taskId);
    }

    @PostMapping("/documents")
    public Map<String, Object> createDocument(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser user
    ) {
        UserEntity dbUser = requireDbUser(user);
        String pid = (String) body.get("projectId");
        if (pid == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "projectId required");
        requireProject(dbUser, pid);
        if (user != null && user.id() != null && !body.containsKey("uploadedByUserId")) {
            body.put("uploadedByUserId", user.id());
        }
        return flex.save("document", pid, body, user);
    }

    @DeleteMapping("/documents/{id}")
    public void deleteDocument(@PathVariable String id, @AuthenticationPrincipal JwtAuthFilter.AuthUser auth) {
        ensureFlexRecordAccess(auth, id);
        flex.delete(id);
    }
}
