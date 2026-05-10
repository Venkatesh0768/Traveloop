package org.odoo.backend.checklist.dto.response;


import lombok.*;
import org.odoo.backend.checklist.enums.ChecklistCategory;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChecklistItemResponse {

    private UUID id;

    private ChecklistCategory category;

    private String itemName;

    private Boolean packed;

    private Integer quantity;

    private LocalDateTime createdAt;
}