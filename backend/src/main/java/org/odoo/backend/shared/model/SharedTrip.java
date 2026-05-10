package org.odoo.backend.shared.model;


import jakarta.persistence.*;
import lombok.*;
import org.odoo.backend.trip.model.Trip;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "shared_trips")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SharedTrip {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false)
    private String shareToken;

    private String publicUrl;

    private Boolean active;

    private Integer views;

    private LocalDateTime createdAt;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @PrePersist
    public void prePersist() {

        this.createdAt = LocalDateTime.now();

        if (this.active == null) {
            this.active = true;
        }

        if (this.views == null) {
            this.views = 0;
        }
    }
}
