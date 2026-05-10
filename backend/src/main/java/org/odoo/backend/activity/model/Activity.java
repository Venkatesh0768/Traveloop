package org.odoo.backend.activity.model;


import jakarta.persistence.*;
import lombok.*;
import org.odoo.backend.activity.enums.ActivityCategory;
import org.odoo.backend.itinerary.model.TripStop;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "activities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Activity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(length = 3000)
    private String description;

    @Enumerated(EnumType.STRING)
    private ActivityCategory category;

    @Column(precision = 10, scale = 2)
    private BigDecimal estimatedCost;

    private String location;

    private LocalTime startTime;

    private LocalTime endTime;

    private Integer durationMinutes;

    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_stop_id", nullable = false)
    private TripStop tripStop;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}