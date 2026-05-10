package org.odoo.backend.admin.dto.response;


import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PopularCityResponse {

    private String cityName;

    private Long totalTrips;
}