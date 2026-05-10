package org.odoo.backend.shared.service.impl;


import lombok.RequiredArgsConstructor;
import org.odoo.backend.activity.dto.response.ActivityResponse;
import org.odoo.backend.activity.model.Activity;
import org.odoo.backend.auth.model.User;
import org.odoo.backend.auth.repository.UserRepository;
import org.odoo.backend.checklist.dto.response.ChecklistItemResponse;
import org.odoo.backend.expense.dto.response.ExpenseResponse;
import org.odoo.backend.itinerary.dto.response.TripStopResponse;
import org.odoo.backend.itinerary.model.TripStop;
import org.odoo.backend.notes.dto.response.TripNoteResponse;
import org.odoo.backend.shared.dto.response.FullPublicTripResponse;
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
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
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
                .shareToken(sharedTrip.getShareToken())
                .stops(stops)
                .build();
    }

    @Override
    public FullPublicTripResponse getFullPublicTrip(String shareToken) {

        SharedTrip sharedTrip =
                sharedTripRepository.findByShareToken(shareToken)
                        .orElseThrow(() -> new RuntimeException("Shared trip not found"));

        if (!sharedTrip.getActive()) {
            throw new RuntimeException("Shared trip disabled");
        }

        Trip trip = sharedTrip.getTrip();

        // Stops with activities
        List<FullPublicTripResponse.StopWithActivities> stops = trip.getStops()
                .stream()
                .sorted((a, b) -> {
                    int ai = a.getOrderIndex() != null ? a.getOrderIndex() : 0;
                    int bi = b.getOrderIndex() != null ? b.getOrderIndex() : 0;
                    return Integer.compare(ai, bi);
                })
                .map(stop -> FullPublicTripResponse.StopWithActivities.builder()
                        .id(stop.getId())
                        .cityName(stop.getCityName())
                        .country(stop.getCountry())
                        .arrivalDate(stop.getArrivalDate())
                        .departureDate(stop.getDepartureDate())
                        .orderIndex(stop.getOrderIndex())
                        .notes(stop.getNotes())
                        .activities(stop.getActivities().stream()
                                .map(this::mapActivity)
                                .toList())
                        .build())
                .toList();

        // Expenses
        List<ExpenseResponse> expenses = trip.getExpenses()
                .stream()
                .map(e -> ExpenseResponse.builder()
                        .id(e.getId())
                        .category(e.getCategory())
                        .description(e.getDescription())
                        .amount(e.getAmount())
                        .expenseDate(e.getExpenseDate())
                        .paymentMethod(e.getPaymentMethod())
                        .createdAt(e.getCreatedAt())
                        .build())
                .toList();

        // Checklist
        List<ChecklistItemResponse> checklist = trip.getChecklistItems()
                .stream()
                .map(item -> ChecklistItemResponse.builder()
                        .id(item.getId())
                        .category(item.getCategory())
                        .itemName(item.getItemName())
                        .packed(item.getPacked())
                        .quantity(item.getQuantity())
                        .createdAt(item.getCreatedAt())
                        .build())
                .toList();

        // Notes
        List<TripNoteResponse> notes = trip.getNotes()
                .stream()
                .map(note -> TripNoteResponse.builder()
                        .id(note.getId())
                        .title(note.getTitle())
                        .content(note.getContent())
                        .noteDate(note.getNoteDate())
                        .pinned(note.getPinned())
                        .createdAt(note.getCreatedAt())
                        .tripStopId(note.getTripStop() != null ? note.getTripStop().getId() : null)
                        .stopCityName(note.getTripStop() != null ? note.getTripStop().getCityName() : null)
                        .build())
                .toList();

        User owner = trip.getUser();

        return FullPublicTripResponse.builder()
                .tripId(trip.getId())
                .title(trip.getTitle())
                .description(trip.getDescription())
                .startDate(trip.getStartDate())
                .endDate(trip.getEndDate())
                .coverImage(trip.getCoverImage())
                .createdBy(owner.getFirstName() + " " + owner.getLastName())
                .shareToken(shareToken)
                .totalBudget(trip.getTotalBudget())
                .views(sharedTrip.getViews())
                .stops(stops)
                .expenses(expenses)
                .checklistItems(checklist)
                .notes(notes)
                .build();
    }

    @Override
    @Transactional
    public void copyTrip(String shareToken) {

        SharedTrip sharedTrip =
                sharedTripRepository.findByShareToken(shareToken)
                        .orElseThrow(() ->
                                new RuntimeException("Shared trip not found"));

        if (!sharedTrip.getActive()) {
            throw new RuntimeException("Shared trip is no longer active");
        }

        Trip originalTrip = sharedTrip.getTrip();

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        // Build the copied trip — explicitly initialise collections because
        // Lombok @Builder does NOT call field initializers, leaving them null.
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
                .stops(new ArrayList<>())
                .expenses(new ArrayList<>())
                .checklistItems(new ArrayList<>())
                .notes(new ArrayList<>())
                .build();

        // Persist the trip first so stops can reference its ID via FK
        Trip savedTrip = tripRepository.save(copiedTrip);

        // Deep-copy each stop and its activities
        for (TripStop stop : originalTrip.getStops()) {

            TripStop copiedStop = TripStop.builder()
                    .cityName(stop.getCityName())
                    .country(stop.getCountry())
                    .arrivalDate(stop.getArrivalDate())
                    .departureDate(stop.getDepartureDate())
                    .orderIndex(stop.getOrderIndex())
                    .notes(stop.getNotes())
                    .trip(savedTrip)
                    .activities(new ArrayList<>())
                    .build();

            // Copy activities for this stop
            for (Activity activity : stop.getActivities()) {
                Activity copiedActivity = Activity.builder()
                        .title(activity.getTitle())
                        .description(activity.getDescription())
                        .category(activity.getCategory())
                        .estimatedCost(activity.getEstimatedCost())
                        .location(activity.getLocation())
                        .startTime(activity.getStartTime())
                        .endTime(activity.getEndTime())
                        .durationMinutes(activity.getDurationMinutes())
                        .tripStop(copiedStop)
                        .build();

                copiedStop.getActivities().add(copiedActivity);
            }

            savedTrip.getStops().add(copiedStop);
        }

        tripRepository.save(savedTrip);
    }

    // ─── Mappers ──────────────────────────────────────────────────────────────

    private SharedTripResponse mapToResponse(SharedTrip sharedTrip) {
        return SharedTripResponse.builder()
                .id(sharedTrip.getId())
                .shareToken(sharedTrip.getShareToken())
                .publicUrl(sharedTrip.getPublicUrl())
                .active(sharedTrip.getActive())
                .views(sharedTrip.getViews())
                .createdAt(sharedTrip.getCreatedAt())
                .build();
    }

    private TripStopResponse mapStopResponse(TripStop stop) {
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

    private ActivityResponse mapActivity(Activity activity) {
        return ActivityResponse.builder()
                .id(activity.getId())
                .title(activity.getTitle())
                .description(activity.getDescription())
                .category(activity.getCategory())
                .estimatedCost(activity.getEstimatedCost())
                .location(activity.getLocation())
                .startTime(activity.getStartTime())
                .endTime(activity.getEndTime())
                .durationMinutes(activity.getDurationMinutes())
                .createdAt(activity.getCreatedAt())
                .build();
    }
}