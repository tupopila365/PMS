package com.cbmp.notification;

import com.cbmp.auth.JwtAuthFilter;
import com.cbmp.org.UserEntity;
import com.cbmp.org.UserRepository;
import com.cbmp.workflow.ErpWebhookPublisher;
import com.cbmp.workflow.WorkflowEmailService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * In-app (and optional email) notifications for flexible records.
 */
@Service
public class FlexibleRecordLifecycleNotifier {

    private final InAppNotificationPublisher publisher;
    private final NotificationAudienceResolver audience;
    private final WorkflowEmailService workflowEmail;
    private final UserRepository userRepository;
    private final ErpWebhookPublisher erpWebhookPublisher;

    public FlexibleRecordLifecycleNotifier(
            InAppNotificationPublisher publisher,
            NotificationAudienceResolver audience,
            WorkflowEmailService workflowEmail,
            UserRepository userRepository,
            ErpWebhookPublisher erpWebhookPublisher
    ) {
        this.publisher = publisher;
        this.audience = audience;
        this.workflowEmail = workflowEmail;
        this.userRepository = userRepository;
        this.erpWebhookPublisher = erpWebhookPublisher;
    }

    public void afterSave(String kind, Map<String, Object> saved, JwtAuthFilter.AuthUser actor) {
        if (saved == null || kind == null) {
            return;
        }
        String projectId = str(saved.get("projectId"));
        switch (kind) {
            case "change" -> notifyNewChange(saved, projectId, actor);
            case "timesheet" -> notifyNewTimesheet(saved, projectId, actor);
            case "document" -> notifyNewDocument(saved, projectId, actor);
            case "image" -> notifyNewImage(saved, projectId, actor);
            case "variation_order" -> notifyNewVariationOrder(saved, projectId, actor);
            case "rfi" -> notifyNewRfi(saved, projectId, actor);
            case "boq_line" -> { /* bulk import — no per-line notify */ }
            default -> { }
        }
    }

    public void afterUpdate(String kind, Map<String, Object> before, Map<String, Object> after, JwtAuthFilter.AuthUser actor) {
        if (before == null || after == null) {
            return;
        }
        if ("change".equals(kind)) {
            String oldStatus = normStatus(before.get("status"));
            String newStatus = normStatus(after.get("status"));
            if (("approved".equals(newStatus) || "rejected".equals(newStatus)) && !newStatus.equals(oldStatus)) {
                String requesterId = str(after.get("requesterUserId"));
                if (requesterId.isBlank()) {
                    return;
                }
                String title = str(after.get("title"));
                if (title.isBlank()) {
                    title = "Change request";
                }
                String projectName = audience.projectName(str(after.get("projectId")));
                String verb = "approved".equals(newStatus) ? "approved" : "rejected";
                String reviewer = actor != null && actor.name() != null && !actor.name().isBlank()
                        ? actor.name()
                        : (actor != null && actor.email() != null ? actor.email() : "A reviewer");
                publisher.publish(
                        requesterId,
                        "change",
                        "Change request " + verb,
                        "\"" + title + "\" on " + projectName + " was " + verb + " by " + reviewer + ".",
                        str(after.get("projectId")),
                        null
                );
            }
            return;
        }
        if ("rfi".equals(kind)) {
            handleRfiUpdate(before, after, actor);
            return;
        }
        if ("variation_order".equals(kind)) {
            handleVariationOrderUpdate(before, after, actor);
        }
    }

    private void handleRfiUpdate(Map<String, Object> before, Map<String, Object> after, JwtAuthFilter.AuthUser actor) {
        String oldS = rfiStatusNorm(before.get("status"));
        String newS = rfiStatusNorm(after.get("status"));
        if (newS.equals(oldS)) {
            return;
        }
        String projectId = str(after.get("projectId"));
        if ("draft".equals(oldS) && ("open".equals(newS) || "issued".equals(newS))) {
            notifyRfiIssued(after, projectId);
            return;
        }
        String projectName = audience.projectName(projectId);
        String subject = str(after.get("subject"));
        if (subject.isBlank()) {
            subject = "RFI";
        }
        final String rfiSubject = subject;
        String raiser = str(after.get("raisedByUserId"));

        if (("open".equals(oldS) || "issued".equals(oldS)) && "answered".equals(newS)) {
            if (!raiser.isBlank()) {
                String msg = "\"" + rfiSubject + "\" on " + projectName + " was marked answered.";
                publisher.publish(raiser, "general", "RFI answered", msg, projectId, null);
                userRepository.findById(raiser).ifPresent(u -> emailUser(u,
                        "RFI answered: " + rfiSubject,
                        msg + "\n\nYou can review the RFI in CBMP."));
            }
            return;
        }
        if ("closed".equals(newS) && !"closed".equals(oldS)) {
            Object raw = after.get("responderUserIds");
            if (raw instanceof List<?> list) {
                for (Object o : list) {
                    String uid = str(o);
                    if (!uid.isBlank() && !uid.equals(raiser)) {
                        String msg = "\"" + rfiSubject + "\" on " + projectName + " was closed.";
                        publisher.publish(uid, "general", "RFI closed", msg, projectId, null);
                    }
                }
            }
        }
    }

    private void handleVariationOrderUpdate(Map<String, Object> before, Map<String, Object> after, JwtAuthFilter.AuthUser actor) {
        String oldS = voStatusNorm(before.get("status"));
        String newS = voStatusNorm(after.get("status"));
        if (newS.equals(oldS)) {
            return;
        }
        String projectId = str(after.get("projectId"));
        String companyId = audience.companyIdForProject(projectId);
        String projectName = audience.projectName(projectId);
        String title = str(after.get("title"));
        if (title.isBlank()) {
            title = "(variation order)";
        }
        String ref = str(after.get("reference"));
        String label = ref.isBlank() ? title : ref + " — " + title;
        String submitter = str(after.get("submittedByUserId"));

        if ("draft".equals(oldS) && "submitted".equals(newS)) {
            notifyPmVariationOrder(companyId, projectId, label, "Variation submitted for review", submitter);
            return;
        }
        if ("submitted".equals(oldS) && "pm_approved".equals(newS)) {
            notifyFinanceVariationOrder(companyId, projectId, label);
            return;
        }
        if ("pm_approved".equals(oldS) && "finance_approved".equals(newS)) {
            for (UserEntity u : audience.usersInCompanyWithRoles(companyId, "admin", "project_manager")) {
                if (u.getId() == null) {
                    continue;
                }
                publisher.publish(u.getId(), "change", "Variation ready for final approval",
                        label + " on " + projectName + " — finance approved; final sign-off needed.", projectId, null);
            }
            return;
        }
        if ("finance_approved".equals(oldS) && "approved".equals(newS)) {
            if (!submitter.isBlank()) {
                publisher.publish(submitter, "change", "Variation order approved",
                        label + " on " + projectName + " is fully approved.", projectId, null);
                userRepository.findById(submitter).ifPresent(u -> emailUser(u,
                        "Variation approved: " + label,
                        "Your variation order on " + projectName + " has been fully approved."));
            }
            erpWebhookPublisher.onVariationOrderApproved(after);
            return;
        }
        if ("rejected".equals(newS) && !"rejected".equals(oldS)) {
            if (!submitter.isBlank()) {
                publisher.publish(submitter, "change", "Variation order rejected",
                        label + " on " + projectName + " was rejected.", projectId, null);
                userRepository.findById(submitter).ifPresent(u -> emailUser(u,
                        "Variation rejected: " + label,
                        "Your variation order on " + projectName + " was rejected."));
            }
            return;
        }
        // Legacy: submitted → approved in one step
        if ("submitted".equals(oldS) && "approved".equals(newS)) {
            if (!submitter.isBlank()) {
                publisher.publish(submitter, "change", "Variation order approved",
                        label + " on " + projectName + " was approved.", projectId, null);
                userRepository.findById(submitter).ifPresent(u -> emailUser(u,
                        "Variation approved: " + label,
                        "Your variation order on " + projectName + " was approved."));
            }
            erpWebhookPublisher.onVariationOrderApproved(after);
        }
    }

    private void notifyPmVariationOrder(String companyId, String projectId, String label, String title, String submitterId) {
        for (UserEntity u : audience.usersInCompanyWithRoles(companyId, "admin", "project_manager")) {
            if (u.getId() == null || u.getId().equals(submitterId)) {
                continue;
            }
            publisher.publish(u.getId(), "change", title, label + " on " + audience.projectName(projectId) + ".", projectId, null);
        }
    }

    private void notifyFinanceVariationOrder(String companyId, String projectId, String label) {
        String projectName = audience.projectName(projectId);
        for (UserEntity u : audience.usersInCompanyWithRoles(companyId, "admin", "accountant")) {
            if (u.getId() == null) {
                continue;
            }
            publisher.publish(u.getId(), "change", "Variation — finance review",
                    label + " on " + projectName + " — PM approved; finance review required.", projectId, null);
        }
    }

    private void emailUser(UserEntity u, String subject, String body) {
        if (u.getEmail() == null || u.getEmail().isBlank()) {
            return;
        }
        workflowEmail.send(u.getEmail().trim(), subject, body);
    }

    private void notifyNewChange(Map<String, Object> saved, String projectId, JwtAuthFilter.AuthUser actor) {
        String companyId = audience.companyIdForProject(projectId);
        String title = str(saved.get("title"));
        if (title.isBlank()) {
            title = "(no title)";
        }
        String requester = str(saved.get("requester"));
        if (requester.isBlank()) {
            requester = "Someone";
        }
        String requesterUserId = str(saved.get("requesterUserId"));
        String projectName = audience.projectName(projectId);
        String msg = "\"" + title + "\" — requested by " + requester + " on " + projectName + ".";

        var managers = audience.usersInCompanyWithRoles(companyId, "admin", "project_manager");
        if (!managers.isEmpty()) {
            for (UserEntity u : managers) {
                if (u.getId() == null || u.getId().equals(requesterUserId)) {
                    continue;
                }
                publisher.publish(u.getId(), "change", "New change request", msg, projectId, null);
            }
            return;
        }
        for (String uid : audience.taskAssigneeIdsForProject(projectId)) {
            if (uid.equals(requesterUserId)) {
                continue;
            }
            publisher.publish(uid, "change", "New change request", msg, projectId, null);
        }
    }

    private void notifyNewTimesheet(Map<String, Object> saved, String projectId, JwtAuthFilter.AuthUser actor) {
        String companyId = audience.companyIdForProject(projectId);
        String submitterId = str(saved.get("userId"));
        String hours = saved.get("hours") != null ? saved.get("hours").toString() : "?";
        String taskId = str(saved.get("taskId"));
        String msg = "Time logged: " + hours + " h on project " + audience.projectName(projectId) + ".";

        audience.managerAndFinanceUserIds(companyId).forEach(uid -> {
            if (uid.equals(submitterId)) {
                return;
            }
            publisher.publish(uid, "timesheet_reminder", "Timesheet entry", msg, projectId, taskId.isBlank() ? null : taskId);
        });
    }

    private void notifyNewDocument(Map<String, Object> saved, String projectId, JwtAuthFilter.AuthUser actor) {
        String uploaderId = str(saved.get("uploadedByUserId"));
        String name = str(saved.get("name"));
        if (name.isBlank()) {
            name = "Document";
        }
        String uploader = str(saved.get("uploadedBy"));
        if (uploader.isBlank() && actor != null) {
            uploader = actor.name() != null && !actor.name().isBlank() ? actor.name() : actor.email();
        }
        if (uploader.isBlank()) {
            uploader = "Someone";
        }
        String msg = uploader + " uploaded \"" + name + "\" to " + audience.projectName(projectId) + ".";
        Set<String> targets = audience.projectTeamAndManagers(projectId);
        for (String uid : targets) {
            if (uid.equals(uploaderId)) {
                continue;
            }
            publisher.publish(uid, "general", "New document", msg, projectId, str(saved.get("taskId")));
        }
    }

    private void notifyNewVariationOrder(Map<String, Object> saved, String projectId, JwtAuthFilter.AuthUser actor) {
        String st = voStatusNorm(saved.get("status"));
        if ("draft".equals(st)) {
            return;
        }
        String companyId = audience.companyIdForProject(projectId);
        String ref = str(saved.get("reference"));
        String title = str(saved.get("title"));
        if (title.isBlank()) {
            title = "(variation order)";
        }
        String projectName = audience.projectName(projectId);
        String msg = (ref.isBlank() ? "" : ref + " — ") + title + " on " + projectName + ".";
        String submitter = str(saved.get("submittedByUserId"));
        for (UserEntity u : audience.usersInCompanyWithRoles(companyId, "admin", "project_manager")) {
            if (u.getId() == null || u.getId().equals(submitter)) {
                continue;
            }
            publisher.publish(u.getId(), "change", "New variation order", msg, projectId, null);
        }
    }

    private void notifyNewRfi(Map<String, Object> saved, String projectId, JwtAuthFilter.AuthUser actor) {
        String st = rfiStatusNorm(saved.get("status"));
        if ("draft".equals(st)) {
            return;
        }
        notifyRfiIssued(saved, projectId);
    }

    private void notifyRfiIssued(Map<String, Object> saved, String projectId) {
        String subject = str(saved.get("subject"));
        if (subject.isBlank()) {
            subject = str(saved.get("title"));
        }
        if (subject.isBlank()) {
            subject = "RFI";
        }
        final String rfiSubjectNew = subject;
        String criticality = str(saved.get("criticality"));
        String projectName = audience.projectName(projectId);
        String msg = "\"" + rfiSubjectNew + "\" on " + projectName
                + (criticality.isBlank() ? "." : " — " + criticality + ".");

        Object raw = saved.get("responderUserIds");
        if (raw instanceof List<?> list) {
            for (Object o : list) {
                String uid = str(o);
                if (!uid.isBlank()) {
                    publisher.publish(uid, "general", "RFI: your input is requested", msg, projectId, null);
                    userRepository.findById(uid).ifPresent(u -> emailUser(u,
                            "RFI: input requested — " + rfiSubjectNew,
                            "You were tagged on an RFI for " + projectName + ".\n\n" + msg + "\n\nOpen CBMP to respond."));
                }
            }
        }

        if ("high".equalsIgnoreCase(criticality) || "critical".equalsIgnoreCase(criticality)) {
            String companyId = audience.companyIdForProject(projectId);
            for (UserEntity u : audience.usersInCompanyWithRoles(companyId, "admin", "project_manager")) {
                if (u.getId() == null) {
                    continue;
                }
                publisher.publish(u.getId(), "general", "RFI (high priority)", msg, projectId, null);
            }
        }
    }

    private void notifyNewImage(Map<String, Object> saved, String projectId, JwtAuthFilter.AuthUser actor) {
        String uploaderId = str(saved.get("uploadedByUserId"));
        String fileName = str(saved.get("fileName"));
        if (fileName.isBlank()) {
            fileName = "Image";
        }
        String uploader = str(saved.get("uploadedBy"));
        if (uploader.isBlank() && actor != null) {
            uploader = actor.name() != null && !actor.name().isBlank() ? actor.name() : actor.email();
        }
        if (uploader.isBlank()) {
            uploader = "Someone";
        }
        String msg = uploader + " uploaded \"" + fileName + "\" to " + audience.projectName(projectId) + ".";
        Set<String> targets = audience.projectTeamAndManagers(projectId);
        for (String uid : targets) {
            if (uid.equals(uploaderId)) {
                continue;
            }
            publisher.publish(uid, "general", "New site image", msg, projectId, null);
        }
    }

    private static String str(Object o) {
        return o != null ? o.toString().trim() : "";
    }

    private static String normStatus(Object o) {
        String s = str(o).toLowerCase();
        return s.isBlank() ? "pending" : s;
    }

    /** Legacy RFIs often omit status — treat as open (issued), not draft. */
    private static String rfiStatusNorm(Object o) {
        String s = str(o).toLowerCase();
        return s.isBlank() ? "open" : s;
    }

    private static String voStatusNorm(Object o) {
        String s = str(o).toLowerCase();
        return s.isBlank() ? "draft" : s;
    }
}
