package org.odoo.backend.itinerary.controller;


import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.odoo.backend.itinerary.dto.request.CreateTripStopRequest;
import org.odoo.backend.itinerary.dto.response.TripStopResponse;
import org.odoo.backend.itinerary.service.TripStopService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/trips")
@RequiredArgsConstructor
public class TripStopController {

    private final TripStopService tripStopService;

    @PostMapping("/{tripId}/stops")
    @ResponseStatus(HttpStatus.CREATED)
    public TripStopResponse createStop(
            @PathVariable UUID tripId,
            @Valid @RequestBody CreateTripStopRequest request
    ) {

        return tripStopService.createStop(tripId, request);
    }

    @GetMapping("/{tripId}/stops")
    public List<TripStopResponse> getTripStops(
            @PathVariable UUID tripId
    ) {

        return tripStopService.getTripStops(tripId);
    }

    @DeleteMapping("/stops/{stopId}")
    public String deleteStop(
            @PathVariable UUID stopId
    ) {

        tripStopService.deleteStop(stopId);

        return "Stop deleted successfully";
    }
}