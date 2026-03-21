package com.cbmp.template;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;

@Component
public class TemplateDataLoader implements ApplicationRunner {

    private final ProjectTemplateRepository templateRepository;
    private final ObjectMapper objectMapper;

    public TemplateDataLoader(ProjectTemplateRepository templateRepository, ObjectMapper objectMapper) {
        this.templateRepository = templateRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (templateRepository.count() > 0) return;
        ClassPathResource res = new ClassPathResource("data/project-templates.json");
        if (!res.exists()) return;
        try (InputStream in = res.getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            if (!root.isArray()) return;
            for (JsonNode node : root) {
                ProjectTemplateEntity e = new ProjectTemplateEntity();
                e.setId(node.get("id").asText());
                e.setName(node.get("name").asText());
                e.setProjectType(node.get("projectType").asText());
                e.setDescription(node.has("description") ? node.get("description").asText() : "");
                e.setTemplateJson(objectMapper.writeValueAsString(node));
                templateRepository.save(e);
            }
        }
    }
}
