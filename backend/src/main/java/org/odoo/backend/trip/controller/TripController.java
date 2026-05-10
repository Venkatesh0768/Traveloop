package org.odoo.backend.trip.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.odoo.backend.trip.dto.request.CreateTripRequest;
import org.odoo.backend.trip.dto.response.TripResponse;
import org.odoo.backend.trip.service.TripService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/trips")
@RequiredArgsConstructor
public class TripController {
    private final TripService tripService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TripResponse createTrip(
            @Valid @RequestBody CreateTripRequest request
    ) {
        return tripService.createTrip(request);
    }

    @GetMapping
    public List<TripResponse> getMyTrips() {
        return tripService.getMyTrips();
    }

    @GetMapping("/{tripId}")
    public TripResponse getTripById(
            @PathVariable UUID tripId
    ) {
        return tripService.getTripById(tripId);
    }

    @DeleteMapping("/{tripId}")
    public String deleteTrip(
            @PathVariable UUID tripId
    ) {

        tripService.deleteTrip(tripId);

        return "Trip deleted successfully";
    }
}
