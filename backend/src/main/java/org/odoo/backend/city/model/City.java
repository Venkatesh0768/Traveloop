package org.odoo.backend.city.model;


import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "cities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class City {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String country;

    private String region;

    private String imageUrl;

    private String description;

    /*
        Average travel cost index
        Example:
        Paris -> expensive
        Bangkok -> cheap
     */
    private Integer costIndex;

    /*
        Popularity score
        Used for trending destinations
     */
    private Integer popularityScore;

    private Boolean trending;

    private String currency;

    private String language;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {

        this.createdAt = LocalDateTime.now();

        if (this.popularityScore == null) {
            this.popularityScore = 0;
        }

        if (this.trending == null) {
            this.trending = false;
        }
    }
}