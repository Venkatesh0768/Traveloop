package org.odoo.backend.trip.model;

import jakarta.persistence.*;
import lombok.*;
import org.odoo.backend.auth.model.User;
import org.odoo.backend.itinerary.model.TripStop;
import org.odoo.backend.trip.enums.TripStatus;
import org.odoo.backend.trip.enums.Visibility;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "trips")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Trip {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    private String coverImage;

    @Enumerated(EnumType.STRING)
    private Visibility visibility;

    @Enumerated(EnumType.STRING)
    private TripStatus status;

    @Column(precision = 10, scale = 2)
    private BigDecimal totalBudget;

    @Column(precision = 10, scale = 2)
    private BigDecimal estimatedCost;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @OneToMany(
            mappedBy = "trip",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<TripStop> stops = new ArrayList<>();

    /*
        MANY TRIPS -> ONE USER
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();

        if (this.visibility == null) {
            this.visibility = Visibility.PRIVATE;
        }

        if (this.status == null) {
            this.status = TripStatus.PLANNED;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}