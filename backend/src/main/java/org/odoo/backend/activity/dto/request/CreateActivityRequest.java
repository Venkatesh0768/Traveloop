package org.odoo.backend.activity.dto.request;


import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.odoo.backend.activity.enums.ActivityCategory;

import java.math.BigDecimal;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateActivityRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    private ActivityCategory category;

    private BigDecimal estimatedCost;

    private String location;

    private LocalTime startTime;

    private LocalTime endTime;

    private Integer durationMinutes;
}