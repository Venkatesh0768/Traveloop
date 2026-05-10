package org.odoo.backend.trip.repository;

import org.odoo.backend.auth.model.User;
import org.odoo.backend.trip.model.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface TripRepository extends JpaRepository<Trip, UUID> {
    List<Trip> findByUser(User user);
    @Query("""
       SELECT ts.cityName, COUNT(ts)
       FROM TripStop ts
       GROUP BY ts.cityName
       ORDER BY COUNT(ts) DESC
       """)
    List<Object[]> findPopularCities();
}