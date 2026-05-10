package org.odoo.backend.itinerary.dto.response;


import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TripStopResponse {

    private UUID id;

    private String cityName;

    private String country;

    private LocalDate arrivalDate;

    private LocalDate departureDate;

    private Integer orderIndex;

    private String notes;

    private LocalDateTime createdAt;
}