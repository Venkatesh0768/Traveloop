package org.odoo.backend.checklist.repository;

import org.odoo.backend.checklist.model.PackingChecklist;
import org.odoo.backend.trip.model.Trip;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PackingChecklistRepository extends JpaRepository<PackingChecklist, UUID> {
    List<PackingChecklist> findByTrip(Trip trip);
}