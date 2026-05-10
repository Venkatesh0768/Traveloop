package org.odoo.backend.city.service;



import org.odoo.backend.city.dto.response.CityResponse;

import java.util.List;

public interface CityService {

    List<CityResponse> searchCities(String keyword);

    List<CityResponse> getTrendingCities();

    List<CityResponse> getPopularCities();

    List<CityResponse> getCitiesByCountry(String country);

}