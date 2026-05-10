package org.odoo.backend.shared.service;

import org.odoo.backend.shared.dto.response.FullPublicTripResponse;
import org.odoo.backend.shared.dto.response.PublicTripResponse;
import org.odoo.backend.shared.dto.response.SharedTripResponse;

import java.util.UUID;

public interface SharedTripService {

    SharedTripResponse generateShareLink(UUID tripId);

    PublicTripResponse getPublicTrip(String shareToken);

    FullPublicTripResponse getFullPublicTrip(String shareToken);

    void copyTrip(String shareToken);
}