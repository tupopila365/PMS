package com.cbmp.risk;

public record RiskDto(
        String id,
        String projectId,
        String description,
        Integer probability,
        Integer impact,
        String severity,
        String owner,
        String mitigation,
        String status,
        String createdAt
) {
}
