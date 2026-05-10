package org.odoo.backend.admin.service.impl;


import lombok.RequiredArgsConstructor;
import org.odoo.backend.activity.repository.ActivityRepository;
import org.odoo.backend.admin.dto.response.AdminDashboardResponse;
import org.odoo.backend.admin.dto.response.PopularCityResponse;
import org.odoo.backend.admin.dto.response.UserActivityResponse;
import org.odoo.backend.admin.service.AdminAnalyticsService;
import org.odoo.backend.auth.repository.UserRepository;
import org.odoo.backend.expense.repository.ExpenseRepository;
import org.odoo.backend.shared.repository.SharedTripRepository;
import org.odoo.backend.trip.repository.TripRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminAnalyticsServiceImpl implements AdminAnalyticsService {

    private final UserRepository userRepository;
    private final TripRepository tripRepository;
    private final ActivityRepository activityRepository;
    private final ExpenseRepository expenseRepository;
    private final SharedTripRepository sharedTripRepository;

    @Override
    public AdminDashboardResponse getDashboardStats() {

        Long totalUsers = userRepository.count();

        Long totalTrips = tripRepository.count();

        Long totalActivities = activityRepository.count();

        Long totalExpenses = expenseRepository.count();

        Long totalSharedTrips = sharedTripRepository.count();

        BigDecimal totalRevenueTracked =
                expenseRepository.getTotalExpensesAmount();

        return AdminDashboardResponse.builder()
                .totalUsers(totalUsers)
                .totalTrips(totalTrips)
                .totalActivities(totalActivities)
                .totalExpenses(totalExpenses)
                .totalRevenueTracked(totalRevenueTracked)
                .totalSharedTrips(totalSharedTrips)
                .build();
    }

    @Override
    public List<PopularCityResponse> getPopularCities() {

        List<Object[]> results =
                tripRepository.findPopularCities();

        return results.stream()
                .map(result ->
                        PopularCityResponse.builder()
                                .cityName((String) result[0])
                                .totalTrips((Long) result[1])
                                .build()
                )
                .toList();
    }

    @Override
    public List<UserActivityResponse> getMostActiveUsers() {

        List<Object[]> results =
                userRepository.findMostActiveUsers();

        return results.stream()
                .map(result ->
                        UserActivityResponse.builder()
                                .userEmail((String) result[0])
                                .totalTrips((Long) result[1])
                                .build()
                )
                .toList();
    }
}