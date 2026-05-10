package org.odoo.backend.shared.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SharedTripResponse {

    private UUID id;

    private String shareToken;

    private String publicUrl;

    private Boolean active;

    private Integer views;

    private LocalDateTime createdAt;
}