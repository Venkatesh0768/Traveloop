package org.odoo.backend.notes.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.odoo.backend.notes.dto.request.CreateTripNoteRequest;
import org.odoo.backend.notes.dto.response.TripNoteResponse;
import org.odoo.backend.notes.service.TripNoteService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/trips")
@RequiredArgsConstructor
public class TripNoteController {

    private final TripNoteService noteService;

    @PostMapping("/{tripId}/notes")
    @ResponseStatus(HttpStatus.CREATED)
    public TripNoteResponse createNote(
            @PathVariable UUID tripId,
            @Valid @RequestBody CreateTripNoteRequest request
    ) {

        return noteService.createNote(tripId, request);
    }

    @GetMapping("/{tripId}/notes")
    public List<TripNoteResponse> getTripNotes(
            @PathVariable UUID tripId
    ) {

        return noteService.getTripNotes(tripId);
    }

    @DeleteMapping("/notes/{noteId}")
    public String deleteNote(
            @PathVariable UUID noteId
    ) {

        noteService.deleteNote(noteId);

        return "Note deleted successfully";
    }
}