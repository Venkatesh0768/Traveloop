package org.odoo.backend.notes.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateTripNoteRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String content;

    private LocalDateTime noteDate;

    private Boolean pinned;

    /*
        Optional stop mapping
     */
    private UUID tripStopId;
}