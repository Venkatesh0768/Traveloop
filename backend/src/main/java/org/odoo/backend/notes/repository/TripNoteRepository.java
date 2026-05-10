package org.odoo.backend.notes.repository;

import org.odoo.backend.notes.model.TripNote;
import org.odoo.backend.trip.model.Trip;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TripNoteRepository extends JpaRepository<TripNote, UUID> {
    List<TripNote> findByTripOrderByCreatedAtDesc(Trip trip);

}