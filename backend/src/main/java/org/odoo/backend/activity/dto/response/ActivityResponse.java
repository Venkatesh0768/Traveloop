package org.odoo.backend.activity.dto.response;


import lombok.*;
import org.odoo.backend.activity.enums.ActivityCategory;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityResponse {

    private UUID id;

    private String title;

    private String description;

    private ActivityCategory category;

    private BigDecimal estimatedCost;

    private String location;

    private LocalTime startTime;

    private LocalTime endTime;

    private Integer durationMinutes;

    private LocalDateTime createdAt;
}