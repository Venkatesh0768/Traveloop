import apiClient from "./client";
import type {
  Trip,
  CreateTripRequest,
  TripStop,
  CreateTripStopRequest,
  Activity,
  CreateActivityRequest,
  Expense,
  CreateExpenseRequest,
  BudgetSummary,
  ChecklistItem,
  CreateChecklistItemRequest,
  ChecklistProgress,
  TripNote,
  CreateTripNoteRequest,
  City,
  SharedTrip,
  PublicTrip,
  FullPublicTrip,
} from "@/types/trip.types";
import type { AxiosResponse } from "axios";

// ─── Trips ────────────────────────────────────────────────────────────────────

export const tripsApi = {
  create: (data: CreateTripRequest): Promise<AxiosResponse<Trip>> =>
    apiClient.post("/trips", data),

  getAll: (): Promise<AxiosResponse<Trip[]>> =>
    apiClient.get("/trips"),

  getById: (tripId: string): Promise<AxiosResponse<Trip>> =>
    apiClient.get(`/trips/${tripId}`),

  delete: (tripId: string): Promise<AxiosResponse<string>> =>
    apiClient.delete(`/trips/${tripId}`),
};

// ─── Trip Stops ───────────────────────────────────────────────────────────────

export const stopsApi = {
  create: (tripId: string, data: CreateTripStopRequest): Promise<AxiosResponse<TripStop>> =>
    apiClient.post(`/trips/${tripId}/stops`, data),

  getAll: (tripId: string): Promise<AxiosResponse<TripStop[]>> =>
    apiClient.get(`/trips/${tripId}/stops`),

  delete: (stopId: string): Promise<AxiosResponse<string>> =>
    apiClient.delete(`/trips/stops/${stopId}`),
};

// ─── Activities ───────────────────────────────────────────────────────────────

export const activitiesApi = {
  create: (stopId: string, data: CreateActivityRequest): Promise<AxiosResponse<Activity>> =>
    apiClient.post(`/stops/${stopId}/activities`, data),

  getAll: (stopId: string): Promise<AxiosResponse<Activity[]>> =>
    apiClient.get(`/stops/${stopId}/activities`),

  delete: (activityId: string): Promise<AxiosResponse<string>> =>
    apiClient.delete(`/stops/activities/${activityId}`),
};

// ─── Expenses ─────────────────────────────────────────────────────────────────

export const expensesApi = {
  create: (tripId: string, data: CreateExpenseRequest): Promise<AxiosResponse<Expense>> =>
    apiClient.post(`/trips/${tripId}/expenses`, data),

  getAll: (tripId: string): Promise<AxiosResponse<Expense[]>> =>
    apiClient.get(`/trips/${tripId}/expenses`),

  getBudgetSummary: (tripId: string): Promise<AxiosResponse<BudgetSummary>> =>
    apiClient.get(`/trips/${tripId}/budget-summary`),

  delete: (expenseId: string): Promise<AxiosResponse<string>> =>
    apiClient.delete(`/trips/expenses/${expenseId}`),
};

// ─── Checklist ────────────────────────────────────────────────────────────────

export const checklistApi = {
  create: (tripId: string, data: CreateChecklistItemRequest): Promise<AxiosResponse<ChecklistItem>> =>
    apiClient.post(`/trips/${tripId}/checklist`, data),

  getAll: (tripId: string): Promise<AxiosResponse<ChecklistItem[]>> =>
    apiClient.get(`/trips/${tripId}/checklist`),

  updateStatus: (itemId: string, packed: boolean): Promise<AxiosResponse<ChecklistItem>> =>
    apiClient.patch(`/trips/checklist/${itemId}`, { packed }),

  getProgress: (tripId: string): Promise<AxiosResponse<ChecklistProgress>> =>
    apiClient.get(`/trips/${tripId}/checklist-progress`),

  delete: (itemId: string): Promise<AxiosResponse<string>> =>
    apiClient.delete(`/trips/checklist/${itemId}`),
};

// ─── Notes ────────────────────────────────────────────────────────────────────

export const notesApi = {
  create: (tripId: string, data: CreateTripNoteRequest): Promise<AxiosResponse<TripNote>> =>
    apiClient.post(`/trips/${tripId}/notes`, data),

  getAll: (tripId: string): Promise<AxiosResponse<TripNote[]>> =>
    apiClient.get(`/trips/${tripId}/notes`),

  delete: (noteId: string): Promise<AxiosResponse<string>> =>
    apiClient.delete(`/trips/notes/${noteId}`),
};

// ─── Cities ───────────────────────────────────────────────────────────────────

export const citiesApi = {
  search: (keyword: string): Promise<AxiosResponse<City[]>> =>
    apiClient.get("/cities/search", { params: { keyword } }),

  getTrending: (): Promise<AxiosResponse<City[]>> =>
    apiClient.get("/cities/trending"),

  getPopular: (): Promise<AxiosResponse<City[]>> =>
    apiClient.get("/cities/popular"),

  getByCountry: (name: string): Promise<AxiosResponse<City[]>> =>
    apiClient.get("/cities/country", { params: { name } }),
};

// ─── Shared Trips ─────────────────────────────────────────────────────────────

export const sharedApi = {
  generateLink: (tripId: string): Promise<AxiosResponse<SharedTrip>> =>
    apiClient.post(`/shared/${tripId}/generate-link`),

  getPublicTrip: (shareToken: string): Promise<AxiosResponse<PublicTrip>> =>
    apiClient.get(`/shared/${shareToken}`),

  /** Full detail — requires auth, returns stops+activities, budget, checklist, notes */
  getFullPublicTrip: (shareToken: string): Promise<AxiosResponse<FullPublicTrip>> =>
    apiClient.get(`/shared/${shareToken}/full`),

  copyTrip: (shareToken: string): Promise<AxiosResponse<string>> =>
    apiClient.post(`/shared/${shareToken}/copy`),
};

// ─── Public Trips (no auth required) ─────────────────────────────────────────

export const publicTripsApi = {
  getAll: (): Promise<AxiosResponse<PublicTrip[]>> =>
    apiClient.get("/trips/public"),

  getByCity: (cityName: string): Promise<AxiosResponse<PublicTrip[]>> =>
    apiClient.get(`/trips/public/city/${encodeURIComponent(cityName)}`),
};
