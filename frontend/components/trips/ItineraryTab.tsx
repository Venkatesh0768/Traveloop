"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Loader2,
  Trash2,
  MapPin,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
} from "lucide-react";
import { isAxiosError } from "axios";
import { stopsApi, activitiesApi } from "@/lib/api/trips.api";
import type {
  Trip,
  TripStop,
  CreateTripStopRequest,
  Activity,
  CreateActivityRequest,
  ActivityCategory,
} from "@/types/trip.types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { ActivityCategoryBadge, formatDate, formatCurrency, formatTime } from "./TripHelpers";

const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  "ADVENTURE", "SIGHTSEEING", "FOOD", "SHOPPING", "BEACH",
  "HIKING", "CULTURE", "NIGHTLIFE", "RELAXATION", "SPORTS",
];

export function ItineraryTab({ tripId, trip }: { tripId: string; trip: Trip }) {
  const [stops, setStops] = useState<TripStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddStop, setShowAddStop] = useState(false);
  const [expandedStops, setExpandedStops] = useState<Set<string>>(new Set());

  useEffect(() => {
    stopsApi.getAll(tripId).then((r) => setStops(r.data)).finally(() => setLoading(false));
  }, [tripId]);

  const toggleStop = (stopId: string) => {
    setExpandedStops((prev) => {
      const next = new Set(prev);
      if (next.has(stopId)) next.delete(stopId);
      else next.add(stopId);
      return next;
    });
  };

  const handleStopAdded = (stop: TripStop) => {
    setStops((prev) => [...prev, stop]);
    setShowAddStop(false);
    setExpandedStops((prev) => new Set([...prev, stop.id]));
  };

  const handleStopDeleted = (stopId: string) => {
    setStops((prev) => prev.filter((s) => s.id !== stopId));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add stop button */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">
          {stops.length} stop{stops.length !== 1 ? "s" : ""}
        </h2>
        <Button size="sm" onClick={() => setShowAddStop((v) => !v)}>
          <Plus size={14} />
          Add stop
        </Button>
      </div>

      {/* Add stop form */}
      {showAddStop && (
        <AddStopForm
          tripId={tripId}
          trip={trip}
          onAdded={handleStopAdded}
          onCancel={() => setShowAddStop(false)}
        />
      )}

      {/* Stops list */}
      {stops.length === 0 && !showAddStop ? (
        <Card>
          <div className="text-center py-12">
            <MapPin size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-600 mb-1">No stops yet</p>
            <p className="text-xs text-gray-400 mb-4">Add cities to build your itinerary</p>
            <Button size="sm" onClick={() => setShowAddStop(true)}>
              <Plus size={14} />
              Add first stop
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {stops
            .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
            .map((stop, idx) => (
              <StopCard
                key={stop.id}
                stop={stop}
                index={idx + 1}
                expanded={expandedStops.has(stop.id)}
                onToggle={() => toggleStop(stop.id)}
                onDeleted={() => handleStopDeleted(stop.id)}
              />
            ))}
        </div>
      )}
    </div>
  );
}

// ─── Add Stop Form ────────────────────────────────────────────────────────────

function AddStopForm({
  tripId,
  trip,
  onAdded,
  onCancel,
}: {
  tripId: string;
  trip: Trip;
  onAdded: (stop: TripStop) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<CreateTripStopRequest>({
    cityName: "",
    country: "",
    arrivalDate: trip.startDate,
    departureDate: trip.endDate,
    notes: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CreateTripStopRequest, string>>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: typeof errors = {};
    if (!form.cityName.trim()) e.cityName = "City name is required";
    if (!form.country.trim()) e.country = "Country is required";
    if (!form.arrivalDate) e.arrivalDate = "Arrival date is required";
    if (!form.departureDate) e.departureDate = "Departure date is required";
    if (form.arrivalDate && form.departureDate && form.departureDate < form.arrivalDate) {
      e.departureDate = "Departure must be after arrival";
    }
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setApiError(null);
    setLoading(true);
    try {
      const res = await stopsApi.create(tripId, form);
      onAdded(res.data);
    } catch (err) {
      setApiError(isAxiosError(err) ? err.response?.data?.message ?? "Failed to add stop." : "Failed.");
    } finally {
      setLoading(false);
    }
  };

  const set = (field: keyof CreateTripStopRequest) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((er) => ({ ...er, [field]: undefined }));
  };

  return (
    <Card className="border-indigo-200 bg-indigo-50/30">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Add a stop</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Alert variant="error" message={apiError} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="City *" placeholder="Paris" value={form.cityName} onChange={set("cityName")} error={errors.cityName} disabled={loading} />
          <Input label="Country *" placeholder="France" value={form.country} onChange={set("country")} error={errors.country} disabled={loading} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Arrival date *" type="date" value={form.arrivalDate} onChange={set("arrivalDate")} error={errors.arrivalDate} disabled={loading} />
          <Input label="Departure date *" type="date" value={form.departureDate} onChange={set("departureDate")} error={errors.departureDate} disabled={loading} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Notes</label>
          <textarea
            placeholder="Any notes for this stop..."
            value={form.notes ?? ""}
            onChange={set("notes")}
            disabled={loading}
            rows={2}
            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:bg-gray-50 resize-none"
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" loading={loading}>Add stop</Button>
          <Button type="button" variant="secondary" size="sm" onClick={onCancel} disabled={loading}>Cancel</Button>
        </div>
      </form>
    </Card>
  );
}

// ─── Stop Card ────────────────────────────────────────────────────────────────

function StopCard({
  stop,
  index,
  expanded,
  onToggle,
  onDeleted,
}: {
  stop: TripStop;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onDeleted: () => void;
}) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoaded, setActivitiesLoaded] = useState(false);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (expanded && !activitiesLoaded) {
      activitiesApi.getAll(stop.id).then((r) => {
        setActivities(r.data);
        setActivitiesLoaded(true);
      });
    }
  }, [expanded, activitiesLoaded, stop.id]);

  const handleDelete = async () => {
    if (!confirm(`Remove stop "${stop.cityName}"?`)) return;
    setDeleteLoading(true);
    try {
      await stopsApi.delete(stop.id);
      onDeleted();
    } catch {
      alert("Failed to delete stop.");
      setDeleteLoading(false);
    }
  };

  const handleActivityAdded = (activity: Activity) => {
    setActivities((prev) => [...prev, activity]);
    setShowAddActivity(false);
  };

  const handleActivityDeleted = (activityId: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== activityId));
  };

  return (
    <Card>
      {/* Stop header */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">
          {index}
        </div>
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onToggle}>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900">{stop.cityName}</h3>
            <span className="text-xs text-gray-500">{stop.country}</span>
          </div>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <Calendar size={11} />
            {formatDate(stop.arrivalDate)} → {formatDate(stop.departureDate)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <Button variant="danger" size="sm" onClick={handleDelete} loading={deleteLoading}>
            <Trash2 size={13} />
          </Button>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          {stop.notes && (
            <p className="text-xs text-gray-500 mb-4 italic">{stop.notes}</p>
          )}

          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Activities ({activities.length})
            </h4>
            <Button size="sm" variant="secondary" onClick={() => setShowAddActivity((v) => !v)}>
              <Plus size={13} />
              Add activity
            </Button>
          </div>

          {showAddActivity && (
            <AddActivityForm
              stopId={stop.id}
              onAdded={handleActivityAdded}
              onCancel={() => setShowAddActivity(false)}
            />
          )}

          {!activitiesLoaded ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
            </div>
          ) : activities.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">No activities yet. Add some!</p>
          ) : (
            <div className="space-y-2">
              {activities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  onDeleted={() => handleActivityDeleted(activity.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ─── Add Activity Form ────────────────────────────────────────────────────────

function AddActivityForm({
  stopId,
  onAdded,
  onCancel,
}: {
  stopId: string;
  onAdded: (activity: Activity) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<CreateActivityRequest>({
    title: "",
    description: "",
    category: undefined,
    estimatedCost: undefined,
    location: "",
    startTime: "",
    endTime: "",
    durationMinutes: undefined,
  });
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setApiError(null);
    setLoading(true);
    try {
      const res = await activitiesApi.create(stopId, {
        ...form,
        estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : undefined,
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
        startTime: form.startTime || undefined,
        endTime: form.endTime || undefined,
      });
      onAdded(res.data);
    } catch (err) {
      setApiError(isAxiosError(err) ? err.response?.data?.message ?? "Failed." : "Failed.");
    } finally {
      setLoading(false);
    }
  };

  const set = (field: keyof CreateActivityRequest) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  return (
    <div className="mb-4 p-4 rounded-xl border border-indigo-200 bg-indigo-50/30 space-y-3">
      <Alert variant="error" message={apiError} />
      <Input label="Activity title *" placeholder="e.g. Eiffel Tower visit" value={form.title} onChange={set("title")} disabled={loading} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Category</label>
          <select value={form.category ?? ""} onChange={set("category")} disabled={loading} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20">
            <option value="">Select category</option>
            {ACTIVITY_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </div>
        <Input label="Estimated cost ($)" type="number" placeholder="0" value={form.estimatedCost ?? ""} onChange={set("estimatedCost")} disabled={loading} min="0" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Start time" type="time" value={form.startTime ?? ""} onChange={set("startTime")} disabled={loading} />
        <Input label="End time" type="time" value={form.endTime ?? ""} onChange={set("endTime")} disabled={loading} />
      </div>
      <Input label="Location" placeholder="e.g. Champ de Mars, Paris" value={form.location ?? ""} onChange={set("location")} disabled={loading} />
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={handleSubmit} loading={loading}>Add</Button>
        <Button type="button" variant="secondary" size="sm" onClick={onCancel} disabled={loading}>Cancel</Button>
      </div>
    </div>
  );
}

// ─── Activity Card ────────────────────────────────────────────────────────────

function ActivityCard({
  activity,
  onDeleted,
}: {
  activity: Activity;
  onDeleted: () => void;
}) {
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Remove "${activity.title}"?`)) return;
    setDeleteLoading(true);
    try {
      await activitiesApi.delete(activity.id);
      onDeleted();
    } catch {
      alert("Failed to delete activity.");
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-sm font-medium text-gray-900">{activity.title}</span>
          <ActivityCategoryBadge category={activity.category} />
        </div>
        {activity.description && (
          <p className="text-xs text-gray-500 mb-1 line-clamp-1">{activity.description}</p>
        )}
        <div className="flex flex-wrap gap-3 text-xs text-gray-400">
          {activity.location && (
            <span className="flex items-center gap-1">
              <MapPin size={11} /> {activity.location}
            </span>
          )}
          {(activity.startTime || activity.endTime) && (
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {formatTime(activity.startTime)}{activity.endTime ? ` – ${formatTime(activity.endTime)}` : ""}
            </span>
          )}
          {activity.estimatedCost != null && (
            <span className="flex items-center gap-1">
              <DollarSign size={11} /> {formatCurrency(activity.estimatedCost)}
            </span>
          )}
        </div>
      </div>
      <Button variant="danger" size="sm" onClick={handleDelete} loading={deleteLoading}>
        <Trash2 size={13} />
      </Button>
    </div>
  );
}
