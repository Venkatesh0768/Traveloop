package org.odoo.backend.checklist.controller;


import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.odoo.backend.checklist.dto.request.CreateChecklistItemRequest;
import org.odoo.backend.checklist.dto.request.UpdateChecklistStatusRequest;
import org.odoo.backend.checklist.dto.response.ChecklistItemResponse;
import org.odoo.backend.checklist.dto.response.ChecklistProgressResponse;
import org.odoo.backend.checklist.service.PackingChecklistService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/trips")
@RequiredArgsConstructor
public class PackingChecklistController {

    private final PackingChecklistService checklistService;

    @PostMapping("/{tripId}/checklist")
    @ResponseStatus(HttpStatus.CREATED)
    public ChecklistItemResponse createItem(
            @PathVariable UUID tripId,
            @Valid @RequestBody CreateChecklistItemRequest request
    ) {

        return checklistService.createItem(tripId, request);
    }

    @GetMapping("/{tripId}/checklist")
    public List<ChecklistItemResponse> getChecklist(
            @PathVariable UUID tripId
    ) {

        return checklistService.getChecklist(tripId);
    }

    @PatchMapping("/checklist/{itemId}")
    public ChecklistItemResponse updatePackedStatus(
            @PathVariable UUID itemId,
            @RequestBody UpdateChecklistStatusRequest request
    ) {

        return checklistService.updatePackedStatus(itemId, request);
    }

    @GetMapping("/{tripId}/checklist-progress")
    public ChecklistProgressResponse getChecklistProgress(
            @PathVariable UUID tripId
    ) {

        return checklistService.getChecklistProgress(tripId);
    }

    @DeleteMapping("/checklist/{itemId}")
    public String deleteItem(
            @PathVariable UUID itemId
    ) {

        checklistService.deleteItem(itemId);

        return "Checklist item deleted successfully";
    }
}