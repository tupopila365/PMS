package com.cbmp.cost;

import java.math.BigDecimal;

public record CostCategoryDto(
        String id,
        String projectId,
        String name,
        String parentId,
        BigDecimal budget,
        BigDecimal actualCost
) {
}
