package org.odoo.backend.itinerary.repository;

import org.odoo.backend.itinerary.model.TripStop;
import org.odoo.backend.trip.model.Trip;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TripStopRepository extends JpaRepository<TripStop, UUID> {
    List<TripStop> findByTripOrderByOrderIndexAsc(Trip trip);
}