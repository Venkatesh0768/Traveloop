package org.odoo.backend.itinerary.service;


import org.odoo.backend.itinerary.dto.request.CreateTripStopRequest;
import org.odoo.backend.itinerary.dto.response.TripStopResponse;

import java.util.List;
import java.util.UUID;

public interface TripStopService {

    TripStopResponse createStop(
            UUID tripId,
            CreateTripStopRequest request
    );

    List<TripStopResponse> getTripStops(UUID tripId);

    void deleteStop(UUID stopId);

}