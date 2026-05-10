package org.odoo.backend.city.controller;

import lombok.RequiredArgsConstructor;
import org.odoo.backend.city.dto.response.CityResponse;
import org.odoo.backend.city.service.CityService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/cities")
@RequiredArgsConstructor
public class CityController {

    private final CityService cityService;

    @GetMapping("/search")
    public List<CityResponse> searchCities(
            @RequestParam String keyword
    ) {

        return cityService.searchCities(keyword);
    }

    @GetMapping("/trending")
    public List<CityResponse> getTrendingCities() {

        return cityService.getTrendingCities();
    }

    @GetMapping("/popular")
    public List<CityResponse> getPopularCities() {

        return cityService.getPopularCities();
    }

    @GetMapping("/country")
    public List<CityResponse> getCitiesByCountry(
            @RequestParam String name
    ) {

        return cityService.getCitiesByCountry(name);
    }
}