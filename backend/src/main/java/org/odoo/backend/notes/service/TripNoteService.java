package org.odoo.backend.notes.service;



import org.odoo.backend.notes.dto.request.CreateTripNoteRequest;
import org.odoo.backend.notes.dto.response.TripNoteResponse;

import java.util.List;
import java.util.UUID;

public interface TripNoteService {

    TripNoteResponse createNote(
            UUID tripId,
            CreateTripNoteRequest request
    );

    List<TripNoteResponse> getTripNotes(UUID tripId);

    void deleteNote(UUID noteId);

}