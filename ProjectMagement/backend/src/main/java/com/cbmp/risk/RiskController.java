package com.cbmp.risk;

import com.cbmp.project.ProjectRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/risks")
public class RiskController {

    private final RiskRepository riskRepository;
    private final ProjectRepository projectRepository;

    public RiskController(RiskRepository riskRepository, ProjectRepository projectRepository) {
        this.riskRepository = riskRepository;
        this.projectRepository = projectRepository;
    }

    @GetMapping
    public List<RiskDto> list(@RequestParam(required = false) String projectId) {
        if (projectId != null && !projectId.isBlank()) {
            return riskRepository.findByProjectId(projectId).stream().map(this::toDto).toList();
        }
        return riskRepository.findAll().stream().map(this::toDto).toList();
    }

    @PostMapping
    public RiskDto create(@RequestBody Map<String, Object> body) {
        String pid = (String) body.get("projectId");
        if (pid == null || !projectRepository.existsById(pid)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid project");
        }
        RiskEntity e = new RiskEntity();
        e.setProjectId(pid);
        e.setDescription(body.get("description") != null ? body.get("description").toString() : null);
        e.setProbability(asInt(body.get("probability")));
        e.setImpact(asInt(body.get("impact")));
        e.setSeverity(body.get("severity") != null ? body.get("severity").toString() : "medium");
        e.setOwner(body.get("owner") != null ? body.get("owner").toString() : null);
        e.setMitigation(body.get("mitigation") != null ? body.get("mitigation").toString() : null);
        e.setStatus(body.get("status") != null ? body.get("status").toString() : "open");
        return toDto(riskRepository.save(e));
    }

    @PutMapping("/{id}")
    public RiskDto update(@PathVariable String id, @RequestBody Map<String, Object> body) {
        RiskEntity e = riskRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (body.containsKey("description")) e.setDescription((String) body.get("description"));
        if (body.containsKey("probability")) e.setProbability(asInt(body.get("probability")));
        if (body.containsKey("impact")) e.setImpact(asInt(body.get("impact")));
        if (body.containsKey("severity")) e.setSeverity((String) body.get("severity"));
        if (body.containsKey("owner")) e.setOwner((String) body.get("owner"));
        if (body.containsKey("mitigation")) e.setMitigation((String) body.get("mitigation"));
        if (body.containsKey("status")) e.setStatus((String) body.get("status"));
        return toDto(riskRepository.save(e));
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        riskRepository.deleteById(id);
    }

    private static Integer asInt(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n.intValue();
        return Integer.parseInt(o.toString());
    }

    private RiskDto toDto(RiskEntity e) {
        return new RiskDto(
                e.getId(),
                e.getProjectId(),
                e.getDescription(),
                e.getProbability(),
                e.getImpact(),
                e.getSeverity(),
                e.getOwner(),
                e.getMitigation(),
                e.getStatus(),
                e.getCreatedAt() != null ? e.getCreatedAt().toString() : null
        );
    }
}
