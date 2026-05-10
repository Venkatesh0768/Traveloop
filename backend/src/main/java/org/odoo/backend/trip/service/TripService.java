package org.odoo.backend.trip.service;


import org.odoo.backend.trip.dto.request.CreateTripRequest;
import org.odoo.backend.trip.dto.response.TripResponse;

import java.util.List;
import java.util.UUID;

public interface TripService {
    TripResponse createTrip(CreateTripRequest request);

    List<TripResponse> getMyTrips();

    TripResponse getTripById(UUID tripId);

    void deleteTrip(UUID tripId);
}
