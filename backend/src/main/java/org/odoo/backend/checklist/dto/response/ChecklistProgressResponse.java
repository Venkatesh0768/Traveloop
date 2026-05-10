package org.odoo.backend.checklist.dto.response;


import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChecklistProgressResponse {

    private Integer totalItems;

    private Integer packedItems;

    private Integer unpackedItems;

    private Double progressPercentage;
}