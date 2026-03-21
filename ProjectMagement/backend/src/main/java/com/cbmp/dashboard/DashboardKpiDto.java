package com.cbmp.dashboard;

import java.math.BigDecimal;

public record DashboardKpiDto(
        long totalProjects,
        long activeProjects,
        long onTrackCount,
        long atRiskCount,
        int completionRate,
        BigDecimal totalBudget,
        BigDecimal totalPaid,
        BigDecimal outstandingBalance,
        BigDecimal aggregateVariance
) {
}
