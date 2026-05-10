package org.odoo.backend.trip.service.impl;

import lombok.RequiredArgsConstructor;
import org.odoo.backend.itinerary.dto.response.TripStopResponse;
import org.odoo.backend.itinerary.model.TripStop;
import org.odoo.backend.shared.dto.response.PublicTripResponse;
import org.odoo.backend.shared.model.SharedTrip;
import org.odoo.backend.shared.repository.SharedTripRepository;
import org.odoo.backend.trip.enums.Visibility;
import org.odoo.backend.trip.model.Trip;
import org.odoo.backend.trip.repository.TripRepository;
import org.odoo.backend.trip.service.PublicTripService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PublicTripServiceImpl implements PublicTripService {

    private final TripRepository tripRepository;
    private final SharedTripRepository sharedTripRepository;

    @Override
    public List<PublicTripResponse> getAllPublicTrips() {
        // Only return trips that are PUBLIC and have an active share link
        return sharedTripRepository.findAll()
                .stream()
                .filter(SharedTrip::getActive)
                .filter(st -> st.getTrip().getVisibility() == Visibility.PUBLIC)
                .map(st -> mapToPublicResponse(st.getTrip(), st.getShareToken()))
                .toList();
    }

    @Override
    public List<PublicTripResponse> getTripsByCity(String cityName) {
        return sharedTripRepository.findAll()
                .stream()
                .filter(SharedTrip::getActive)
                .filter(st -> st.getTrip().getVisibility() == Visibility.PUBLIC)
                .filter(st -> st.getTrip().getStops().stream()
                        .anyMatch(stop -> stop.getCityName()
                                .equalsIgnoreCase(cityName)))
                .map(st -> mapToPublicResponse(st.getTrip(), st.getShareToken()))
                .toList();
    }

    private PublicTripResponse mapToPublicResponse(Trip trip, String shareToken) {
        List<TripStopResponse> stops = trip.getStops()
                .stream()
                .map(this::mapStop)
                .toList();

        return PublicTripResponse.builder()
                .tripId(trip.getId())
                .title(trip.getTitle())
                .description(trip.getDescription())
                .startDate(trip.getStartDate())
                .endDate(trip.getEndDate())
                .createdBy(trip.getUser().getFirstName() + " " + trip.getUser().getLastName())
                .shareToken(shareToken)
                .stops(stops)
                .build();
    }

    private TripStopResponse mapStop(TripStop stop) {
        return TripStopResponse.builder()
                .id(stop.getId())
                .cityName(stop.getCityName())
                .country(stop.getCountry())
                .arrivalDate(stop.getArrivalDate())
                .departureDate(stop.getDepartureDate())
                .orderIndex(stop.getOrderIndex())
                .notes(stop.getNotes())
                .build();
    }
}
