package org.odoo.backend.itinerary.model;

import jakarta.persistence.*;
import lombok.*;
import org.odoo.backend.activity.model.Activity;
import org.odoo.backend.trip.model.Trip;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "trip_stops")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TripStop {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String cityName;

    @Column(nullable = false)
    private String country;

    @Column(nullable = false)
    private LocalDate arrivalDate;

    @Column(nullable = false)
    private LocalDate departureDate;

    @OneToMany(
            mappedBy = "tripStop",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<Activity> activities = new ArrayList<>();

    /*
        Used for ordering cities
        Example:
        Paris -> 1
        Rome -> 2
        Amsterdam -> 3
     */
    private Integer orderIndex;

    @Column(length = 2000)
    private String notes;

    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}