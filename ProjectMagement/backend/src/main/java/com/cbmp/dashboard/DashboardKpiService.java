package com.cbmp.dashboard;

import com.cbmp.cost.CostCategoryEntity;
import com.cbmp.cost.CostCategoryRepository;
import com.cbmp.finance.InvoiceEntity;
import com.cbmp.finance.InvoiceRepository;
import com.cbmp.finance.PaymentEntity;
import com.cbmp.finance.PaymentRepository;
import com.cbmp.project.ProjectEntity;
import com.cbmp.project.ProjectRepository;
import com.cbmp.risk.RiskEntity;
import com.cbmp.risk.RiskRepository;
import com.cbmp.task.TaskEntity;
import com.cbmp.task.TaskRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DashboardKpiService {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final CostCategoryRepository costCategoryRepository;
    private final RiskRepository riskRepository;

    public DashboardKpiService(
            ProjectRepository projectRepository,
            TaskRepository taskRepository,
            InvoiceRepository invoiceRepository,
            PaymentRepository paymentRepository,
            CostCategoryRepository costCategoryRepository,
            RiskRepository riskRepository
    ) {
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
        this.costCategoryRepository = costCategoryRepository;
        this.riskRepository = riskRepository;
    }

    public DashboardKpiDto aggregate() {
        List<ProjectEntity> projects = projectRepository.findAll();
        List<TaskEntity> tasks = taskRepository.findAll();
        List<RiskEntity> risks = riskRepository.findAll();
        Map<String, List<RiskEntity>> risksByProject = risks.stream().collect(Collectors.groupingBy(RiskEntity::getProjectId));

        long totalProjects = projects.size();
        long activeProjects = projects.stream().filter(p -> "active".equalsIgnoreCase(p.getStatus())).count();

        long onTrack = 0;
        long atRisk = 0;
        for (ProjectEntity p : projects) {
            String level = riskLevelForProject(p, risksByProject.getOrDefault(p.getId(), List.of()));
            if ("low".equals(level)) onTrack++;
            else if ("medium".equals(level) || "high".equals(level)) atRisk++;
        }

        long completedTasks = tasks.stream().filter(t -> "completed".equals(t.getStatus())).count();
        int completionRate = tasks.isEmpty() ? 0 : (int) Math.round((completedTasks * 100.0) / tasks.size());

        BigDecimal totalBudget = projects.stream()
                .map(ProjectEntity::getBudget)
                .filter(b -> b != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPaid = paymentRepository.findAll().stream()
                .map(PaymentEntity::getAmountPaid)
                .filter(a -> a != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalActualCost = BigDecimal.ZERO;
        for (ProjectEntity p : projects) {
            totalActualCost = totalActualCost.add(getProjectActualCost(p.getId()));
        }

        BigDecimal outstanding = totalBudget.subtract(totalPaid).setScale(2, RoundingMode.HALF_UP);
        BigDecimal variance = totalBudget.subtract(totalActualCost).setScale(2, RoundingMode.HALF_UP);

        return new DashboardKpiDto(
                totalProjects,
                activeProjects,
                onTrack,
                atRisk,
                completionRate,
                totalBudget,
                totalPaid,
                outstanding,
                variance
        );
    }

    private BigDecimal getProjectActualCost(String projectId) {
        BigDecimal cbs = costCategoryRepository.findByProjectId(projectId).stream()
                .map(CostCategoryEntity::getActualCost)
                .filter(a -> a != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (cbs.compareTo(BigDecimal.ZERO) > 0) return cbs;

        List<InvoiceEntity> invs = invoiceRepository.findByProjectId(projectId);
        BigDecimal paid = BigDecimal.ZERO;
        for (InvoiceEntity inv : invs) {
            for (PaymentEntity pay : paymentRepository.findByInvoiceId(inv.getId())) {
                if (pay.getAmountPaid() != null) paid = paid.add(pay.getAmountPaid());
            }
        }
        if (paid.compareTo(BigDecimal.ZERO) > 0) return paid;

        return projectRepository.findById(projectId).map(ProjectEntity::getActualCost).orElse(BigDecimal.ZERO);
    }

    private static String riskLevelForProject(ProjectEntity project, List<RiskEntity> projectRisks) {
        List<RiskEntity> open = projectRisks.stream().filter(r -> !"closed".equalsIgnoreCase(r.getStatus())).toList();
        if (open.isEmpty()) {
            String fb = project.getRiskLevel();
            return fb != null ? fb : "low";
        }
        int worst = 0;
        for (RiskEntity r : open) {
            int ord = severityOrder(r.getSeverity());
            if (ord > worst) worst = ord;
        }
        if (worst >= 3) return "high";
        if (worst >= 2) return "medium";
        return "low";
    }

    private static int severityOrder(String severity) {
        if (severity == null) return 0;
        return switch (severity.toLowerCase()) {
            case "low" -> 1;
            case "medium" -> 2;
            case "high" -> 3;
            case "critical" -> 4;
            default -> 0;
        };
    }
}
