package org.odoo.backend.activity.repository;

import org.odoo.backend.activity.model.Activity;
import org.odoo.backend.itinerary.model.TripStop;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ActivityRepository extends JpaRepository<Activity, UUID> {
    List<Activity> findByTripStop(TripStop tripStop);

}