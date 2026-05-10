package org.odoo.backend.checklist.model;


import jakarta.persistence.*;
import lombok.*;
import org.odoo.backend.checklist.enums.ChecklistCategory;
import org.odoo.backend.trip.model.Trip;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "packing_checklists")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PackingChecklist {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    private ChecklistCategory category;

    @Column(nullable = false)
    private String itemName;

    private Boolean packed;

    private Integer quantity;

    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @PrePersist
    public void prePersist() {

        this.createdAt = LocalDateTime.now();

        if (this.packed == null) {
            this.packed = false;
        }

        if (this.quantity == null) {
            this.quantity = 1;
        }
    }
}