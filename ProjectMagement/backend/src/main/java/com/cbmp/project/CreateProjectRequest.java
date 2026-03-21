package com.cbmp.project;

import java.math.BigDecimal;

public record CreateProjectRequest(
        String name,
        String type,
        String companyId,
        String status,
        String region,
        String client,
        String riskLevel,
        BigDecimal budget,
        BigDecimal actualCost,
        String plannedEndDate,
        String actualEndDate
) {
}
