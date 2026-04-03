package com.cbmp.workflow;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * Validates multi-step variation order approval. Admins may override any transition.
 */
@Service
public class VariationOrderWorkflowService {

    private static String norm(String s) {
        return s == null ? "" : s.trim().toLowerCase();
    }

    private static boolean isAdmin(String role) {
        return "admin".equalsIgnoreCase(role);
    }

    private static boolean isPm(String role) {
        return isAdmin(role) || "project_manager".equalsIgnoreCase(role);
    }

    private static boolean isFinance(String role) {
        return isAdmin(role) || "accountant".equalsIgnoreCase(role);
    }

    public void assertTransition(String fromStatus, String toStatus, String userRole) {
        if (toStatus == null || toStatus.isBlank()) {
            return;
        }
        String to = norm(toStatus);
        String from = norm(fromStatus);
        if (from.isBlank()) {
            from = "draft";
        }
        if (to.equals(from)) {
            return;
        }
        String r = userRole == null ? "" : userRole.trim();

        if (isAdmin(r)) {
            return;
        }

        // draft → submitted: any project member with access (caller already authorized)
        if ("draft".equals(from) && "submitted".equals(to)) {
            return;
        }
        // submitted → pm_approved | rejected
        if ("submitted".equals(from) && ("pm_approved".equals(to) || "rejected".equals(to))) {
            if (!isPm(r)) {
                throw forbidden("Only a project manager can move a submitted variation from submitted.");
            }
            return;
        }
        // pm_approved → finance_approved | rejected
        if ("pm_approved".equals(from) && ("finance_approved".equals(to) || "rejected".equals(to))) {
            if (!isFinance(r)) {
                throw forbidden("Only finance (accountant) can approve at this stage.");
            }
            return;
        }
        // finance_approved → approved | rejected
        if ("finance_approved".equals(from) && ("approved".equals(to) || "rejected".equals(to))) {
            if (!isPm(r)) {
                throw forbidden("Only a project manager (or admin) can give final approval.");
            }
            return;
        }
        // Legacy single-step: submitted → approved | rejected (PM)
        if ("submitted".equals(from) && ("approved".equals(to) || "rejected".equals(to))) {
            if (!isPm(r)) {
                throw forbidden("Only a project manager can approve or reject at this stage.");
            }
            return;
        }

        throw forbidden("Invalid variation order status transition: " + from + " → " + to);
    }

    private static ResponseStatusException forbidden(String msg) {
        return new ResponseStatusException(HttpStatus.FORBIDDEN, msg);
    }
}
