package org.odoo.backend.checklist.service.impl;

import lombok.RequiredArgsConstructor;
import org.odoo.backend.checklist.dto.request.CreateChecklistItemRequest;
import org.odoo.backend.checklist.dto.request.UpdateChecklistStatusRequest;
import org.odoo.backend.checklist.dto.response.ChecklistItemResponse;
import org.odoo.backend.checklist.dto.response.ChecklistProgressResponse;
import org.odoo.backend.checklist.model.PackingChecklist;
import org.odoo.backend.checklist.repository.PackingChecklistRepository;
import org.odoo.backend.checklist.service.PackingChecklistService;
import org.odoo.backend.trip.model.Trip;
import org.odoo.backend.trip.repository.TripRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PackingChecklistServiceImpl implements PackingChecklistService {

    private final PackingChecklistRepository checklistRepository;
    private final TripRepository tripRepository;

    @Override
    public ChecklistItemResponse createItem(UUID tripId, CreateChecklistItemRequest request) {

        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        PackingChecklist item = PackingChecklist.builder()
                .category(request.getCategory())
                .itemName(request.getItemName())
                .packed(request.getPacked())
                .quantity(request.getQuantity())
                .trip(trip)
                .build();

        PackingChecklist savedItem =
                checklistRepository.save(item);

        return mapToResponse(savedItem);
    }

    @Override
    public List<ChecklistItemResponse> getChecklist(UUID tripId) {

        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        List<PackingChecklist> items =
                checklistRepository.findByTrip(trip);

        return items.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public ChecklistItemResponse updatePackedStatus(
            UUID itemId,
            UpdateChecklistStatusRequest request
    ) {

        PackingChecklist item =
                checklistRepository.findById(itemId)
                        .orElseThrow(() ->
                                new RuntimeException("Checklist item not found"));

        item.setPacked(request.getPacked());

        PackingChecklist updatedItem =
                checklistRepository.save(item);

        return mapToResponse(updatedItem);
    }

    @Override
    public ChecklistProgressResponse getChecklistProgress(UUID tripId) {

        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        List<PackingChecklist> items =
                checklistRepository.findByTrip(trip);

        int totalItems = items.size();

        int packedItems = (int) items.stream()
                .filter(item -> Boolean.TRUE.equals(item.getPacked()))
                .count();

        int unpackedItems = totalItems - packedItems;

        double progressPercentage = totalItems == 0
                ? 0
                : ((double) packedItems / totalItems) * 100;

        return ChecklistProgressResponse.builder()
                .totalItems(totalItems)
                .packedItems(packedItems)
                .unpackedItems(unpackedItems)
                .progressPercentage(progressPercentage)
                .build();
    }

    @Override
    public void deleteItem(UUID itemId) {

        PackingChecklist item =
                checklistRepository.findById(itemId)
                        .orElseThrow(() ->
                                new RuntimeException("Checklist item not found"));

        checklistRepository.delete(item);
    }

    private ChecklistItemResponse mapToResponse(
            PackingChecklist item
    ) {

        return ChecklistItemResponse.builder()
                .id(item.getId())
                .category(item.getCategory())
                .itemName(item.getItemName())
                .packed(item.getPacked())
                .quantity(item.getQuantity())
                .createdAt(item.getCreatedAt())
                .build();
    }
}