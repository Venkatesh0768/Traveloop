package org.odoo.backend.city.service.impl;


import lombok.RequiredArgsConstructor;
import org.odoo.backend.city.dto.response.CityResponse;
import org.odoo.backend.city.model.City;
import org.odoo.backend.city.repository.CityRepository;
import org.odoo.backend.city.service.CityService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CityServiceImpl implements CityService {

    private final CityRepository cityRepository;

    @Override
    public List<CityResponse> searchCities(String keyword) {

        List<City> cities =
                cityRepository.findByNameContainingIgnoreCase(keyword);

        return cities.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<CityResponse> getTrendingCities() {

        List<City> cities =
                cityRepository.findByTrendingTrue();

        return cities.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<CityResponse> getPopularCities() {

        List<City> cities =
                cityRepository.findTop10ByOrderByPopularityScoreDesc();

        return cities.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<CityResponse> getCitiesByCountry(String country) {

        List<City> cities =
                cityRepository.findByCountryContainingIgnoreCase(country);

        return cities.stream()
                .map(this::mapToResponse)
                .toList();
    }

    private CityResponse mapToResponse(City city) {

        return CityResponse.builder()
                .id(city.getId())
                .name(city.getName())
                .country(city.getCountry())
                .region(city.getRegion())
                .imageUrl(city.getImageUrl())
                .description(city.getDescription())
                .costIndex(city.getCostIndex())
                .popularityScore(city.getPopularityScore())
                .trending(city.getTrending())
                .currency(city.getCurrency())
                .language(city.getLanguage())
                .build();
    }
}
