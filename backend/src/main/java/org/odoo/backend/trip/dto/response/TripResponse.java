package org.odoo.backend.trip.dto.response;


import lombok.*;
import org.odoo.backend.trip.enums.TripStatus;
import org.odoo.backend.trip.enums.Visibility;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TripResponse {

    private UUID id;

    private String title;

    private String description;

    private LocalDate startDate;

    private LocalDate endDate;

    private String coverImage;

    private Visibility visibility;

    private TripStatus status;

    private BigDecimal totalBudget;

    private BigDecimal estimatedCost;

    private LocalDateTime createdAt;

}