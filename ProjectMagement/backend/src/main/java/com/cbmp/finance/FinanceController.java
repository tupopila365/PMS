package com.cbmp.finance;

import com.cbmp.project.ProjectRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class FinanceController {

    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final ProjectRepository projectRepository;

    public FinanceController(
            InvoiceRepository invoiceRepository,
            PaymentRepository paymentRepository,
            ProjectRepository projectRepository
    ) {
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
        this.projectRepository = projectRepository;
    }

    @GetMapping("/invoices")
    public List<Map<String, Object>> listInvoices() {
        return invoiceRepository.findAll().stream().map(this::invoiceToJson).toList();
    }

    @PostMapping("/invoices")
    public Map<String, Object> createInvoice(@RequestBody Map<String, Object> body) {
        String projectId = (String) body.get("projectId");
        if (projectId == null || !projectRepository.existsById(projectId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid project");
        }
        InvoiceEntity e = new InvoiceEntity();
        e.setProjectId(projectId);
        e.setAmount(toBd(body.get("amount")));
        e.setStatus(body.get("status") != null ? body.get("status").toString() : "pending");
        return invoiceToJson(invoiceRepository.save(e));
    }

    @GetMapping("/payments")
    public List<Map<String, Object>> listPayments() {
        return paymentRepository.findAll().stream().map(this::paymentToJson).toList();
    }

    @PostMapping("/payments")
    public Map<String, Object> createPayment(@RequestBody Map<String, Object> body) {
        String invoiceId = (String) body.get("invoiceId");
        InvoiceEntity inv = invoiceRepository.findById(invoiceId).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid invoice"));
        PaymentEntity p = new PaymentEntity();
        p.setInvoiceId(invoiceId);
        p.setAmountPaid(toBd(body.get("amountPaid")));
        PaymentEntity saved = paymentRepository.save(p);
        inv.setStatus("paid");
        invoiceRepository.save(inv);
        return paymentToJson(saved);
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
