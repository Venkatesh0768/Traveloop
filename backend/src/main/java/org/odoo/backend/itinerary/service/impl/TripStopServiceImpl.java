package org.odoo.backend.itinerary.service.impl;


import lombok.RequiredArgsConstructor;
import org.odoo.backend.itinerary.dto.request.CreateTripStopRequest;
import org.odoo.backend.itinerary.dto.response.TripStopResponse;
import org.odoo.backend.itinerary.model.TripStop;
import org.odoo.backend.itinerary.repository.TripStopRepository;
import org.odoo.backend.itinerary.service.TripStopService;
import org.odoo.backend.trip.model.Trip;
import org.odoo.backend.trip.repository.TripRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TripStopServiceImpl implements TripStopService {

    private final TripRepository tripRepository;
    private final TripStopRepository tripStopRepository;

    @Override
    public TripStopResponse createStop(
            UUID tripId,
            CreateTripStopRequest request
    ) {

        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        TripStop stop = TripStop.builder()
                .cityName(request.getCityName())
                .country(request.getCountry())
                .arrivalDate(request.getArrivalDate())
                .departureDate(request.getDepartureDate())
                .orderIndex(request.getOrderIndex())
                .notes(request.getNotes())
                .trip(trip)
                .build();

        TripStop savedStop = tripStopRepository.save(stop);

        return mapToResponse(savedStop);
    }

    @Override
    public List<TripStopResponse> getTripStops(UUID tripId) {

        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        List<TripStop> stops =
                tripStopRepository.findByTripOrderByOrderIndexAsc(trip);

        return stops.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public void deleteStop(UUID stopId) {

        TripStop stop = tripStopRepository.findById(stopId)
                .orElseThrow(() -> new RuntimeException("Stop not found"));

        tripStopRepository.delete(stop);
    }

    private TripStopResponse mapToResponse(TripStop stop) {

        return TripStopResponse.builder()
                .id(stop.getId())
                .cityName(stop.getCityName())
                .country(stop.getCountry())
                .arrivalDate(stop.getArrivalDate())
                .departureDate(stop.getDepartureDate())
                .orderIndex(stop.getOrderIndex())
                .notes(stop.getNotes())
                .createdAt(stop.getCreatedAt())
                .build();
    }
}