package org.odoo.backend.shared.service.impl;


import lombok.RequiredArgsConstructor;
import org.odoo.backend.auth.model.User;
import org.odoo.backend.auth.repository.UserRepository;
import org.odoo.backend.itinerary.dto.response.TripStopResponse;
import org.odoo.backend.itinerary.model.TripStop;
import org.odoo.backend.shared.dto.response.PublicTripResponse;
import org.odoo.backend.shared.dto.response.SharedTripResponse;
import org.odoo.backend.shared.model.SharedTrip;
import org.odoo.backend.shared.repository.SharedTripRepository;
import org.odoo.backend.shared.service.SharedTripService;
import org.odoo.backend.trip.enums.Visibility;
import org.odoo.backend.trip.model.Trip;
import org.odoo.backend.trip.repository.TripRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SharedTripServiceImpl implements SharedTripService {

    private final SharedTripRepository sharedTripRepository;
    private final TripRepository tripRepository;
    private final UserRepository userRepository;

    @Override
    public SharedTripResponse generateShareLink(UUID tripId) {

        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        SharedTrip existingSharedTrip =
                sharedTripRepository.findByTrip(trip)
                        .orElse(null);

        if (existingSharedTrip != null) {
            return mapToResponse(existingSharedTrip);
        }

        String token =
                UUID.randomUUID().toString().replace("-", "");

        String publicUrl =
                "http://localhost:3000/public/trips/" + token;

        SharedTrip sharedTrip = SharedTrip.builder()
                .shareToken(token)
                .publicUrl(publicUrl)
                .trip(trip)
                .active(true)
                .build();

        SharedTrip savedSharedTrip =
                sharedTripRepository.save(sharedTrip);

        trip.setVisibility(Visibility.PUBLIC);

        tripRepository.save(trip);

        return mapToResponse(savedSharedTrip);
    }

    @Override
    public PublicTripResponse getPublicTrip(String shareToken) {

        SharedTrip sharedTrip =
                sharedTripRepository.findByShareToken(shareToken)
                        .orElseThrow(() ->
                                new RuntimeException("Shared trip not found"));

        if (!sharedTrip.getActive()) {
            throw new RuntimeException("Shared trip disabled");
        }

        sharedTrip.setViews(sharedTrip.getViews() + 1);

        sharedTripRepository.save(sharedTrip);

        Trip trip = sharedTrip.getTrip();

        List<TripStopResponse> stops =
                trip.getStops()
                        .stream()
                        .map(this::mapStopResponse)
                        .toList();

        return PublicTripResponse.builder()
                .tripId(trip.getId())
                .title(trip.getTitle())
                .description(trip.getDescription())
                .startDate(trip.getStartDate())
                .endDate(trip.getEndDate())
                .createdBy(trip.getUser().getFirstName())
                .stops(stops)
                .build();
    }

    @Override
    public void copyTrip(String shareToken) {

        SharedTrip sharedTrip =
                sharedTripRepository.findByShareToken(shareToken)
                        .orElseThrow(() ->
                                new RuntimeException("Shared trip not found"));

        Trip originalTrip = sharedTrip.getTrip();

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        Trip copiedTrip = Trip.builder()
                .title(originalTrip.getTitle() + " (Copy)")
                .description(originalTrip.getDescription())
                .startDate(originalTrip.getStartDate())
                .endDate(originalTrip.getEndDate())
                .coverImage(originalTrip.getCoverImage())
                .visibility(Visibility.PRIVATE)
                .totalBudget(originalTrip.getTotalBudget())
                .estimatedCost(BigDecimal.ZERO)
                .user(user)
                .build();

        Trip savedTrip = tripRepository.save(copiedTrip);

        for (TripStop stop : originalTrip.getStops()) {

            TripStop copiedStop = TripStop.builder()
                    .cityName(stop.getCityName())
                    .country(stop.getCountry())
                    .arrivalDate(stop.getArrivalDate())
                    .departureDate(stop.getDepartureDate())
                    .orderIndex(stop.getOrderIndex())
                    .notes(stop.getNotes())
                    .trip(savedTrip)
                    .build();

            savedTrip.getStops().add(copiedStop);
        }

        tripRepository.save(savedTrip);
    }

    private SharedTripResponse mapToResponse(
            SharedTrip sharedTrip
    ) {

        return SharedTripResponse.builder()
                .id(sharedTrip.getId())
                .shareToken(sharedTrip.getShareToken())
                .publicUrl(sharedTrip.getPublicUrl())
                .active(sharedTrip.getActive())
                .views(sharedTrip.getViews())
                .createdAt(sharedTrip.getCreatedAt())
                .build();
    }

    private TripStopResponse mapStopResponse(
            TripStop stop
    ) {

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