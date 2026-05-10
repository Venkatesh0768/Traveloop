package org.odoo.backend.shared.dto.response;

import lombok.*;
import org.odoo.backend.itinerary.dto.response.TripStopResponse;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublicTripResponse {

    private UUID tripId;

    private String title;

    private String description;

    private LocalDate startDate;

    private LocalDate endDate;

    private String createdBy;

    /** Share token — used to build the public URL on the frontend. */
    private String shareToken;

    private List<TripStopResponse> stops;
}
