package com.cbmp.cost;

import java.math.BigDecimal;

public record CostCategoryUpsertRequest(
        String name,
        String parentId,
        BigDecimal budget,
        BigDecimal actualCost
) {
}
