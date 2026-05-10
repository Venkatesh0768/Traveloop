package org.odoo.backend.city.repository;

import org.odoo.backend.city.model.City;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CityRepository extends JpaRepository<City, UUID> {
    List<City> findByNameContainingIgnoreCase(String keyword);

    List<City> findByCountryContainingIgnoreCase(String country);

    List<City> findByTrendingTrue();

    List<City> findTop10ByOrderByPopularityScoreDesc();
}