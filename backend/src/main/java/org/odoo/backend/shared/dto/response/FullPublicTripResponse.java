package org.odoo.backend.shared.dto.response;

import lombok.*;
import org.odoo.backend.activity.dto.response.ActivityResponse;
import org.odoo.backend.checklist.dto.response.ChecklistItemResponse;
import org.odoo.backend.expense.dto.response.ExpenseResponse;
import org.odoo.backend.notes.dto.response.TripNoteResponse;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Full read-only view of a public trip — returned to authenticated viewers.
 * Includes stops with activities, expenses, checklist, and notes.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FullPublicTripResponse {

    private UUID tripId;

    private String title;

    private String description;

    private LocalDate startDate;

    private LocalDate endDate;

    private String coverImage;

    private String createdBy;

    private String shareToken;

    private BigDecimal totalBudget;

    private Integer views;

    /** Stops, each enriched with their activities */
    private List<StopWithActivities> stops;

    /** All expenses for the trip */
    private List<ExpenseResponse> expenses;

    /** Packing checklist */
    private List<ChecklistItemResponse> checklistItems;

    /** Trip notes */
    private List<TripNoteResponse> notes;

    // ─── Nested DTO ───────────────────────────────────────────────────────────

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StopWithActivities {
        private UUID id;
        private String cityName;
        private String country;
        private LocalDate arrivalDate;
        private LocalDate departureDate;
        private Integer orderIndex;
        private String notes;
        private List<ActivityResponse> activities;
    }
}
