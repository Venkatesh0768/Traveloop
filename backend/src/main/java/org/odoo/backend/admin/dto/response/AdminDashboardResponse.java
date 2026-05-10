package org.odoo.backend.admin.dto.response;



import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminDashboardResponse {

    private Long totalUsers;

    private Long totalTrips;

    private Long totalActivities;

    private Long totalExpenses;

    private BigDecimal totalRevenueTracked;

    private Long totalSharedTrips;
}