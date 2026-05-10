package org.odoo.backend.city.dto.response;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CityResponse {

    private UUID id;

    private String name;

    private String country;

    private String region;

    private String imageUrl;

    private String description;

    private Integer costIndex;

    private Integer popularityScore;

    private Boolean trending;

    private String currency;

    private String language;
}
