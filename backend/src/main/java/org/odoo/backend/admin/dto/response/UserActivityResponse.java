package org.odoo.backend.admin.dto.response;


import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserActivityResponse {

    private String userEmail;

    private Long totalTrips;
}