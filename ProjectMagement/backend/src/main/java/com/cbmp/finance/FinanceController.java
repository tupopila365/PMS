package com.cbmp.finance;

import com.cbmp.auth.JwtAuthFilter;
import com.cbmp.notification.InAppNotificationPublisher;
import com.cbmp.notification.NotificationAudienceResolver;
import com.cbmp.org.UserEntity;
import com.cbmp.project.ProjectAccessService;
import com.cbmp.project.ProjectRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api")
public class FinanceController {

    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final ProjectRepository projectRepository;
    private final ProjectAccessService projectAccessService;
    private final InAppNotificationPublisher notificationPublisher;
    private final NotificationAudienceResolver audience;

    public FinanceController(
            InvoiceRepository invoiceRepository,
            PaymentRepository paymentRepository,
            ProjectRepository projectRepository,
            ProjectAccessService projectAccessService,
            InAppNotificationPublisher notificationPublisher,
            NotificationAudienceResolver audience
    ) {
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
        this.projectRepository = projectRepository;
        this.projectAccessService = projectAccessService;
        this.notificationPublisher = notificationPublisher;
        this.audience = audience;
    }

    @GetMapping("/invoices")
    public List<Map<String, Object>> listInvoices(@AuthenticationPrincipal JwtAuthFilter.AuthUser auth) {
        UserEntity user = projectAccessService.requireUser(auth);
        Set<String> visible = projectAccessService.visibleProjectIds(user);
        return invoiceRepository.findAll().stream()
                .filter(inv -> inv.getProjectId() != null && visible.contains(inv.getProjectId()))
                .map(this::invoiceToJson)
                .toList();
    }

    @PostMapping("/invoices")
    public Map<String, Object> createInvoice(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser user
    ) {
        UserEntity dbUser = projectAccessService.requireUser(user);
        String projectId = (String) body.get("projectId");
        if (projectId == null || !projectRepository.existsById(projectId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid project");
        }
        projectAccessService.requireAccess(dbUser, projectId);
        InvoiceEntity e = new InvoiceEntity();
        e.setProjectId(projectId);
        e.setAmount(toBd(body.get("amount")));
        e.setStatus(body.get("status") != null ? body.get("status").toString() : "pending");
        InvoiceEntity saved = invoiceRepository.save(e);
        notifyFinanceUsers(
                projectId,
                "New invoice",
                "Invoice for " + audience.projectName(projectId) + ": " + (saved.getAmount() != null ? saved.getAmount().toPlainString() : "0") + " (" + saved.getStatus() + ").",
                user
        );
        return invoiceToJson(saved);
    }

    @GetMapping("/payments")
    public List<Map<String, Object>> listPayments(@AuthenticationPrincipal JwtAuthFilter.AuthUser auth) {
        UserEntity user = projectAccessService.requireUser(auth);
        Set<String> visible = projectAccessService.visibleProjectIds(user);
        return paymentRepository.findAll().stream()
                .filter(pay -> {
                    InvoiceEntity inv = invoiceRepository.findById(pay.getInvoiceId()).orElse(null);
                    return inv != null && inv.getProjectId() != null && visible.contains(inv.getProjectId());
                })
                .map(this::paymentToJson)
                .toList();
    }

    @PostMapping("/payments")
    public Map<String, Object> createPayment(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser user
    ) {
        UserEntity dbUser = projectAccessService.requireUser(user);
        String invoiceId = (String) body.get("invoiceId");
        InvoiceEntity inv = invoiceRepository.findById(invoiceId).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid invoice"));
        String invPid = inv.getProjectId();
        if (invPid == null || invPid.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid invoice");
        }
        projectAccessService.requireAccess(dbUser, invPid);
        PaymentEntity p = new PaymentEntity();
        p.setInvoiceId(invoiceId);
        p.setAmountPaid(toBd(body.get("amountPaid")));
        PaymentEntity saved = paymentRepository.save(p);
        inv.setStatus("paid");
        invoiceRepository.save(inv);
        String projectId = inv.getProjectId();
        notifyFinanceUsers(
                projectId,
                "Payment recorded",
                "Payment of " + (saved.getAmountPaid() != null ? saved.getAmountPaid().toPlainString() : "0") + " for " + audience.projectName(projectId) + " (invoice marked paid).",
                user
        );
        return paymentToJson(saved);
    }

    private void notifyFinanceUsers(String projectId, String title, String message, JwtAuthFilter.AuthUser actor) {
        String companyId = audience.companyIdForProject(projectId);
        if (companyId == null) {
            return;
        }
        String actorId = actor != null ? actor.id() : null;
        for (UserEntity u : audience.usersInCompanyWithRoles(companyId, "admin", "accountant", "project_manager")) {
            if (u.getId() == null || u.getId().equals(actorId)) {
                continue;
            }
            notificationPublisher.publish(u.getId(), "general", title, message, projectId, null);
        }
    }

    private static BigDecimal toBd(Object o) {
        if (o == null) return BigDecimal.ZERO;
        if (o instanceof BigDecimal n) return n;
        if (o instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        return new BigDecimal(o.toString());
    }

    private Map<String, Object> invoiceToJson(InvoiceEntity e) {
        return Map.of(
                "id", e.getId(),
                "projectId", e.getProjectId(),
                "amount", e.getAmount() != null ? e.getAmount() : BigDecimal.ZERO,
                "status", e.getStatus() != null ? e.getStatus() : "pending",
                "createdAt", e.getCreatedAt() != null ? e.getCreatedAt().toString() : ""
        );
    }

    private Map<String, Object> paymentToJson(PaymentEntity e) {
        return Map.of(
                "id", e.getId(),
                "invoiceId", e.getInvoiceId(),
                "amountPaid", e.getAmountPaid() != null ? e.getAmountPaid() : BigDecimal.ZERO,
                "paidAt", e.getPaidAt() != null ? e.getPaidAt().toString() : ""
        );
    }
}
