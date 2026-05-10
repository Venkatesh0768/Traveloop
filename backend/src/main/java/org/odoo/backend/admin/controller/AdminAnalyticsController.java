package org.odoo.backend.admin.controller;


import lombok.RequiredArgsConstructor;
import org.odoo.backend.admin.dto.response.AdminDashboardResponse;
import org.odoo.backend.admin.dto.response.PopularCityResponse;
import org.odoo.backend.admin.dto.response.UserActivityResponse;
import org.odoo.backend.admin.service.AdminAnalyticsService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminAnalyticsController {

    private final AdminAnalyticsService adminService;

    @GetMapping("/dashboard")
    public AdminDashboardResponse getDashboardStats() {

        return adminService.getDashboardStats();
    }

    @GetMapping("/popular-cities")
    public List<PopularCityResponse> getPopularCities() {

        return adminService.getPopularCities();
    }

    @GetMapping("/active-users")
    public List<UserActivityResponse> getMostActiveUsers() {

        return adminService.getMostActiveUsers();
    }
}