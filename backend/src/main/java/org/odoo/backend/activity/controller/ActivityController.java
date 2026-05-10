package org.odoo.backend.activity.controller;


import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.odoo.backend.activity.dto.request.CreateActivityRequest;
import org.odoo.backend.activity.dto.response.ActivityResponse;
import org.odoo.backend.activity.service.ActivityService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/stops")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService activityService;

    @PostMapping("/{stopId}/activities")
    @ResponseStatus(HttpStatus.CREATED)
    public ActivityResponse createActivity(
            @PathVariable UUID stopId,
            @Valid @RequestBody CreateActivityRequest request
    ) {

        return activityService.createActivity(stopId, request);
    }

    @GetMapping("/{stopId}/activities")
    public List<ActivityResponse> getActivitiesByStop(
            @PathVariable UUID stopId
    ) {

        return activityService.getActivitiesByStop(stopId);
    }

    @DeleteMapping("/activities/{activityId}")
    public String deleteActivity(
            @PathVariable UUID activityId
    ) {

        activityService.deleteActivity(activityId);

        return "Activity deleted successfully";
    }
}