package org.odoo.backend.trip.service;

import org.odoo.backend.shared.dto.response.PublicTripResponse;

import java.util.List;

public interface PublicTripService {

    List<PublicTripResponse> getAllPublicTrips();

    List<PublicTripResponse> getTripsByCity(String cityName);
}
