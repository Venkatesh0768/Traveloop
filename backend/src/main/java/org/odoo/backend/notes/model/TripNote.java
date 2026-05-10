package org.odoo.backend.notes.model;


import jakarta.persistence.*;
import lombok.*;
import org.odoo.backend.itinerary.model.TripStop;
import org.odoo.backend.trip.model.Trip;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "trip_notes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TripNote {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(length = 5000)
    private String content;

    private LocalDateTime noteDate;

    private Boolean pinned;

    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    /*
        Optional mapping
        A note may belong to a specific stop
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_stop_id")
    private TripStop tripStop;

    @PrePersist
    public void prePersist() {

        this.createdAt = LocalDateTime.now();

        if (this.noteDate == null) {
            this.noteDate = LocalDateTime.now();
        }

        if (this.pinned == null) {
            this.pinned = false;
        }
    }
}