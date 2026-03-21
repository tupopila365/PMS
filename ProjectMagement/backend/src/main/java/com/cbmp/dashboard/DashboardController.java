package com.cbmp.dashboard;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardKpiService dashboardKpiService;

    public DashboardController(DashboardKpiService dashboardKpiService) {
        this.dashboardKpiService = dashboardKpiService;
    }

    @GetMapping("/kpis")
    public DashboardKpiDto kpis() {
        return dashboardKpiService.aggregate();
    }
}
