package org.odoo.backend.trip.controller;

import lombok.RequiredArgsConstructor;
import org.odoo.backend.shared.dto.response.PublicTripResponse;
import org.odoo.backend.trip.service.PublicTripService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Unauthenticated endpoints for browsing public trips.
 * No @PreAuthorize — open to all.
 */
@RestController
@RequestMapping("/trips/public")
@RequiredArgsConstructor
public class PublicTripController {

    private final PublicTripService publicTripService;

    /** List all active public trips (for the Explore feed). */
    @GetMapping
    public List<PublicTripResponse> getAllPublicTrips() {
        return publicTripService.getAllPublicTrips();
    }

    /** List public trips that include a stop in the given city. */
    @GetMapping("/city/{cityName}")
    public List<PublicTripResponse> getTripsByCity(
            @PathVariable String cityName
    ) {
        return publicTripService.getTripsByCity(cityName);
    }
}
