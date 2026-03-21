package com.cbmp.template;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/templates")
public class ProjectTemplateController {

    private final ProjectTemplateRepository templateRepository;
    private final ObjectMapper objectMapper;

    public ProjectTemplateController(ProjectTemplateRepository templateRepository, ObjectMapper objectMapper) {
        this.templateRepository = templateRepository;
        this.objectMapper = objectMapper;
    }

    @GetMapping
    public List<Map<String, Object>> list(@RequestParam(required = false) String projectType) throws Exception {
        List<ProjectTemplateEntity> rows = projectType != null && !projectType.isBlank()
                ? templateRepository.findByProjectType(projectType)
                : templateRepository.findAll();
        return rows.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public Map<String, Object> get(@PathVariable String id) throws Exception {
        ProjectTemplateEntity e = templateRepository.findById(id).orElseThrow();
        return toResponse(e);
    }

    private Map<String, Object> toResponse(ProjectTemplateEntity e) {
        try {
            Map<String, Object> root = objectMapper.readValue(e.getTemplateJson(), new TypeReference<>() {});
            root.put("id", e.getId());
            root.put("name", e.getName());
            root.put("projectType", e.getProjectType());
            root.put("description", e.getDescription());
            return root;
        } catch (Exception ex) {
            throw new IllegalStateException(ex);
        }
    }
}
