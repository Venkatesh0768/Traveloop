package org.odoo.backend.itinerary.dto.request;



import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateTripStopRequest {

    @NotBlank(message = "City name is required")
    private String cityName;

    @NotBlank(message = "Country is required")
    private String country;

    @NotNull(message = "Arrival date is required")
    private LocalDate arrivalDate;

    @NotNull(message = "Departure date is required")
    private LocalDate departureDate;

    private Integer orderIndex;

    private String notes;
}