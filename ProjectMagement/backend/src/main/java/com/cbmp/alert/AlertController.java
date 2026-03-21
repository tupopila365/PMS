package com.cbmp.alert;

import com.cbmp.project.ProjectEntity;
import com.cbmp.project.ProjectRepository;
import com.cbmp.risk.RiskEntity;
import com.cbmp.risk.RiskRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    private final RiskRepository riskRepository;
    private final ProjectRepository projectRepository;

    public AlertController(RiskRepository riskRepository, ProjectRepository projectRepository) {
        this.riskRepository = riskRepository;
        this.projectRepository = projectRepository;
    }

    @GetMapping("/risk")
    public List<Map<String, Object>> riskAlerts() {
        List<Map<String, Object>> out = new ArrayList<>();
        for (RiskEntity r : riskRepository.findAll()) {
            if (r.getStatus() != null && "closed".equalsIgnoreCase(r.getStatus())) continue;
            String sev = r.getSeverity();
            if (sev == null || (!"high".equalsIgnoreCase(sev) && !"critical".equalsIgnoreCase(sev))) continue;
            ProjectEntity p = projectRepository.findById(r.getProjectId()).orElse(null);
            out.add(Map.of(
                    "id", "alert-from-" + r.getId(),
                    "projectId", r.getProjectId(),
                    "projectName", p != null ? p.getName() : "Unknown",
                    "message", r.getDescription() != null ? r.getDescription() : "",
                    "type", "cost",
                    "severity", "critical".equalsIgnoreCase(sev) ? "high" : "medium"
            ));
        }
        return out.size() > 10 ? out.subList(0, 10) : out;
    }
}
