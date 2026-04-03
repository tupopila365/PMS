package com.cbmp.boq;

import com.cbmp.auth.JwtAuthFilter;
import com.cbmp.flex.FlexibleRecordService;
import com.cbmp.org.UserEntity;
import com.cbmp.project.ProjectAccessService;
import com.cbmp.project.ProjectEntity;
import com.cbmp.project.ProjectRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.util.*;

@RestController
@RequestMapping("/api")
public class BoqController {

    private final FlexibleRecordService flex;
    private final ProjectAccessService projectAccessService;
    private final ProjectRepository projectRepository;

    public BoqController(
            FlexibleRecordService flex,
            ProjectAccessService projectAccessService,
            ProjectRepository projectRepository
    ) {
        this.flex = flex;
        this.projectAccessService = projectAccessService;
        this.projectRepository = projectRepository;
    }

    @GetMapping("/projects/{projectId}/boq")
    public List<Map<String, Object>> listBoq(
            @PathVariable String projectId,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser auth
    ) {
        UserEntity user = projectAccessService.requireUser(auth);
        projectAccessService.requireAccess(user, projectId);
        return flex.list("boq_line", projectId);
    }

    @PostMapping(value = "/projects/{projectId}/boq/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> importBoq(
            @PathVariable String projectId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser auth
    ) throws Exception {
        UserEntity user = projectAccessService.requireUser(auth);
        projectAccessService.requireAccess(user, projectId);
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "file is required");
        }
        String text = new String(file.getBytes(), StandardCharsets.UTF_8);
        List<Map<String, Object>> rows = BoqCsvParser.parse(text);
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No BOQ lines parsed — check CSV headers (itemCode, description, unit, quantity, rate, …)");
        }
        int n = flex.replaceBoqLines(projectId, rows, auth);
        return Map.of("imported", n, "projectId", projectId);
    }

    /**
     * Cross-project BOQ compare: aligns rows by {@code itemCode}. User must have access to every project in the list.
     */
    @GetMapping("/boq/compare")
    public Map<String, Object> compareBoq(
            @RequestParam("projectIds") String projectIdsParam,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser auth
    ) {
        UserEntity user = projectAccessService.requireUser(auth);
        if (projectIdsParam == null || projectIdsParam.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "projectIds is required (comma-separated)");
        }
        String[] raw = projectIdsParam.split(",");
        List<String> projectIds = new ArrayList<>();
        for (String s : raw) {
            if (s != null && !s.isBlank()) {
                projectIds.add(s.trim());
            }
        }
        if (projectIds.size() < 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least two project IDs are required");
        }
        Set<String> visible = projectAccessService.visibleProjectIds(user);
        for (String pid : projectIds) {
            if (!visible.contains(pid)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No access to project " + pid);
            }
        }

        Map<String, Map<String, Object>> projectMeta = new LinkedHashMap<>();
        for (String pid : projectIds) {
            Map<String, Object> meta = new LinkedHashMap<>();
            meta.put("id", pid);
            meta.put("name", projectRepository.findById(pid).map(ProjectEntity::getName).orElse(pid));
            projectMeta.put(pid, meta);
        }

        Map<String, Map<String, Map<String, Object>>> byCode = new TreeMap<>();
        for (String pid : projectIds) {
            List<Map<String, Object>> lines = flex.list("boq_line", pid);
            for (Map<String, Object> line : lines) {
                String code = Objects.toString(line.get("itemCode"), "").trim();
                if (code.isEmpty()) {
                    continue;
                }
                byCode.computeIfAbsent(code, k -> new LinkedHashMap<>());
                Map<String, Object> cell = new LinkedHashMap<>();
                cell.put("quantity", line.get("quantity"));
                cell.put("rate", line.get("rate"));
                cell.put("amount", line.get("amount"));
                cell.put("unit", line.get("unit"));
                cell.put("description", line.get("description"));
                byCode.get(code).put(pid, cell);
            }
        }

        List<Map<String, Object>> rows = new ArrayList<>();
        for (Map.Entry<String, Map<String, Map<String, Object>>> e : byCode.entrySet()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("itemCode", e.getKey());
            String desc = e.getValue().values().stream()
                    .map(m -> Objects.toString(m.get("description"), "").trim())
                    .filter(s -> !s.isEmpty())
                    .findFirst()
                    .orElse("");
            row.put("description", desc);
            row.put("byProject", e.getValue());
            rows.add(row);
        }

        return Map.of(
                "projects", projectIds.stream().map(projectMeta::get).toList(),
                "rows", rows
        );
    }
}
