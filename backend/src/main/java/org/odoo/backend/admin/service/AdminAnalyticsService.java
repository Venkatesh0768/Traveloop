package org.odoo.backend.admin.service;



import org.odoo.backend.admin.dto.response.AdminDashboardResponse;
import org.odoo.backend.admin.dto.response.PopularCityResponse;
import org.odoo.backend.admin.dto.response.UserActivityResponse;

import java.util.List;

public interface AdminAnalyticsService {

    AdminDashboardResponse getDashboardStats();

    List<PopularCityResponse> getPopularCities();

    List<UserActivityResponse> getMostActiveUsers();

}