package org.odoo.backend.trip.service.impl;

import lombok.RequiredArgsConstructor;
import org.odoo.backend.auth.model.User;
import org.odoo.backend.auth.repository.UserRepository;
import org.odoo.backend.trip.dto.request.CreateTripRequest;
import org.odoo.backend.trip.dto.response.TripResponse;
import org.odoo.backend.trip.model.Trip;
import org.odoo.backend.trip.repository.TripRepository;
import org.odoo.backend.trip.service.TripService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TripServiceImpl  implements TripService {


    private final TripRepository tripRepository;
    private final UserRepository userRepository;

    @Override
    public TripResponse createTrip(CreateTripRequest request) {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Trip trip = Trip.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .coverImage(request.getCoverImage())
                .visibility(request.getVisibility())
                .totalBudget(request.getTotalBudget())
                .estimatedCost(BigDecimal.ZERO)
                .user(user)
                .build();

        Trip savedTrip = tripRepository.save(trip);

        return mapToResponse(savedTrip);
    }

    @Override
    public List<TripResponse> getMyTrips() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Trip> trips = tripRepository.findByUser(user);

        return trips.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public TripResponse getTripById(UUID tripId) {

        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        return mapToResponse(trip);
    }

    @Override
    public void deleteTrip(UUID tripId) {

        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        tripRepository.delete(trip);
    }

    private TripResponse mapToResponse(Trip trip) {

        return TripResponse.builder()
                .id(trip.getId())
                .title(trip.getTitle())
                .description(trip.getDescription())
                .startDate(trip.getStartDate())
                .endDate(trip.getEndDate())
                .coverImage(trip.getCoverImage())
                .visibility(trip.getVisibility())
                .status(trip.getStatus())
                .totalBudget(trip.getTotalBudget())
                .estimatedCost(trip.getEstimatedCost())
                .createdAt(trip.getCreatedAt())
                .build();
    }

}
