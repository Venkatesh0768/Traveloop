package org.odoo.backend.checklist.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.odoo.backend.checklist.enums.ChecklistCategory;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateChecklistItemRequest {

    private ChecklistCategory category;

    @NotBlank(message = "Item name is required")
    private String itemName;

    private Boolean packed;

    private Integer quantity;
}