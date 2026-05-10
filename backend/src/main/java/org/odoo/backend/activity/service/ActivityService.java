package org.odoo.backend.activity.service;

import org.odoo.backend.activity.dto.request.CreateActivityRequest;
import org.odoo.backend.activity.dto.response.ActivityResponse;

import java.util.List;
import java.util.UUID;

public interface ActivityService {
    ActivityResponse createActivity(
            UUID stopId,
            CreateActivityRequest request
    );

    List<ActivityResponse> getActivitiesByStop(UUID stopId);

    void deleteActivity(UUID activityId);
}
