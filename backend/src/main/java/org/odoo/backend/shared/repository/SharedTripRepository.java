package org.odoo.backend.shared.repository;

import org.odoo.backend.shared.model.SharedTrip;
import org.odoo.backend.trip.model.Trip;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SharedTripRepository extends JpaRepository<SharedTrip, UUID> {
    Optional<SharedTrip> findByTrip(Trip trip);

    Optional<SharedTrip> findByShareToken(String shareToken);
}