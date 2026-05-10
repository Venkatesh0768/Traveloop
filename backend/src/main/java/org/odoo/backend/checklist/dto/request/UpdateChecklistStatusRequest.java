package org.odoo.backend.checklist.dto.request;


import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateChecklistStatusRequest {

    private Boolean packed;
}