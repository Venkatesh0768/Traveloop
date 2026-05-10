package org.odoo.backend.notes.dto.response;


import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TripNoteResponse {

    private UUID id;

    private String title;

    private String content;

    private LocalDateTime noteDate;

    private Boolean pinned;

    private LocalDateTime createdAt;

    private UUID tripStopId;

    private String stopCityName;
}