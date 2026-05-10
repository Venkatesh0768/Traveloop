package org.odoo.backend.checklist.service;



import org.odoo.backend.checklist.dto.request.CreateChecklistItemRequest;
import org.odoo.backend.checklist.dto.request.UpdateChecklistStatusRequest;
import org.odoo.backend.checklist.dto.response.ChecklistItemResponse;
import org.odoo.backend.checklist.dto.response.ChecklistProgressResponse;

import java.util.List;
import java.util.UUID;

public interface PackingChecklistService {

    ChecklistItemResponse createItem(
            UUID tripId,
            CreateChecklistItemRequest request
    );

    List<ChecklistItemResponse> getChecklist(UUID tripId);

    ChecklistItemResponse updatePackedStatus(
            UUID itemId,
            UpdateChecklistStatusRequest request
    );

    ChecklistProgressResponse getChecklistProgress(UUID tripId);

    void deleteItem(UUID itemId);

}