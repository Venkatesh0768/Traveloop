package org.odoo.backend.notes.service.impl;


import lombok.RequiredArgsConstructor;
import org.odoo.backend.itinerary.model.TripStop;
import org.odoo.backend.itinerary.repository.TripStopRepository;
import org.odoo.backend.notes.dto.request.CreateTripNoteRequest;
import org.odoo.backend.notes.dto.response.TripNoteResponse;
import org.odoo.backend.notes.model.TripNote;
import org.odoo.backend.notes.repository.TripNoteRepository;
import org.odoo.backend.notes.service.TripNoteService;
import org.odoo.backend.trip.model.Trip;
import org.odoo.backend.trip.repository.TripRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TripNoteServiceImpl implements TripNoteService {

    private final TripRepository tripRepository;
    private final TripNoteRepository noteRepository;
    private final TripStopRepository tripStopRepository;

    @Override
    public TripNoteResponse createNote(UUID tripId, CreateTripNoteRequest request) {

        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        TripStop stop = null;

        if (request.getTripStopId() != null) {

            stop = tripStopRepository.findById(request.getTripStopId())
                    .orElseThrow(() ->
                            new RuntimeException("Trip stop not found"));
        }

        TripNote note = TripNote.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .noteDate(request.getNoteDate())
                .pinned(request.getPinned())
                .trip(trip)
                .tripStop(stop)
                .build();

        TripNote savedNote =
                noteRepository.save(note);

        return mapToResponse(savedNote);
    }

    @Override
    public List<TripNoteResponse> getTripNotes(UUID tripId) {

        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        List<TripNote> notes =
                noteRepository.findByTripOrderByCreatedAtDesc(trip);

        return notes.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public void deleteNote(UUID noteId) {

        TripNote note = noteRepository.findById(noteId)
                .orElseThrow(() ->
                        new RuntimeException("Note not found"));

        noteRepository.delete(note);
    }

    private TripNoteResponse mapToResponse(TripNote note) {

        return TripNoteResponse.builder()
                .id(note.getId())
                .title(note.getTitle())
                .content(note.getContent())
                .noteDate(note.getNoteDate())
                .pinned(note.getPinned())
                .createdAt(note.getCreatedAt())
                .tripStopId(
                        note.getTripStop() != null
                                ? note.getTripStop().getId()
                                : null
                )
                .stopCityName(
                        note.getTripStop() != null
                                ? note.getTripStop().getCityName()
                                : null
                )
                .build();
    }
}