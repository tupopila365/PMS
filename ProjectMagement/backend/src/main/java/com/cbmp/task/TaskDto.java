package com.cbmp.task;

import java.util.List;

public record TaskDto(
        String id,
        String projectId,
        String title,
        String description,
        String status,
        List<String> assignedTo,
        String dueDate,
        String startDate,
        String endDate,
        Integer duration,
        List<String> predecessors,
        String parentId,
        Integer order,
        Boolean isMilestone,
        Boolean sampleRequired,
        Boolean approvalRequired,
        Boolean archived,
        String createdAt
) {
}
