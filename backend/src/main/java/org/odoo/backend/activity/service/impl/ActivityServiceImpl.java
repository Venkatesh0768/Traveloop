package org.odoo.backend.activity.service.impl;

import lombok.RequiredArgsConstructor;
import org.odoo.backend.activity.dto.request.CreateActivityRequest;
import org.odoo.backend.activity.dto.response.ActivityResponse;
import org.odoo.backend.activity.model.Activity;
import org.odoo.backend.activity.repository.ActivityRepository;
import org.odoo.backend.activity.service.ActivityService;
import org.odoo.backend.itinerary.model.TripStop;
import org.odoo.backend.itinerary.repository.TripStopRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ActivityServiceImpl implements ActivityService {

    private final ActivityRepository activityRepository;
    private final TripStopRepository tripStopRepository;

    @Override
    public ActivityResponse createActivity(
            UUID stopId,
            CreateActivityRequest request
    ) {

        TripStop stop = tripStopRepository.findById(stopId)
                .orElseThrow(() -> new RuntimeException("Trip stop not found"));

        Activity activity = Activity.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory())
                .estimatedCost(request.getEstimatedCost())
                .location(request.getLocation())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .durationMinutes(request.getDurationMinutes())
                .tripStop(stop)
                .build();

        Activity savedActivity = activityRepository.save(activity);

        return mapToResponse(savedActivity);
    }

    @Override
    public List<ActivityResponse> getActivitiesByStop(UUID stopId) {

        TripStop stop = tripStopRepository.findById(stopId)
                .orElseThrow(() -> new RuntimeException("Trip stop not found"));

        List<Activity> activities =
                activityRepository.findByTripStop(stop);

        return activities.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public void deleteActivity(UUID activityId) {

        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new RuntimeException("Activity not found"));

        activityRepository.delete(activity);
    }

    private ActivityResponse mapToResponse(Activity activity) {

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