package org.odoo.backend.trip.repository;

import org.odoo.backend.auth.model.User;
import org.odoo.backend.trip.model.Trip;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TripRepository extends JpaRepository<Trip, UUID> {
    List<Trip> findByUser(User user);
}