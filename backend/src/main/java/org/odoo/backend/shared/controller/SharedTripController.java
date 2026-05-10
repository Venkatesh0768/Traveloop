package org.odoo.backend.shared.controller;

import lombok.RequiredArgsConstructor;
import org.odoo.backend.shared.dto.response.PublicTripResponse;
import org.odoo.backend.shared.dto.response.SharedTripResponse;
import org.odoo.backend.shared.service.SharedTripService;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/shared")
@RequiredArgsConstructor
public class SharedTripController {

    private final SharedTripService sharedTripService;

    @PostMapping("/{tripId}/generate-link")
    public SharedTripResponse generateShareLink(
            @PathVariable UUID tripId
    ) {

        return sharedTripService.generateShareLink(tripId);
    }

    @GetMapping("/{shareToken}")
    public PublicTripResponse getPublicTrip(
            @PathVariable String shareToken
    ) {

        return sharedTripService.getPublicTrip(shareToken);
    }

    @PostMapping("/{shareToken}/copy")
    public String copyTrip(
            @PathVariable String shareToken
    ) {

        sharedTripService.copyTrip(shareToken);

        return "Trip copied successfully";
    }
}