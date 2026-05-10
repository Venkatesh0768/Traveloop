"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Plus,
  Map,
  Search,
  Trash2,
  Eye,
  Calendar,
  DollarSign,
  Filter,
} from "lucide-react";
import { isAxiosError } from "axios";
import { useAuth } from "@/context/AuthContext";
import { tripsApi } from "@/lib/api/trips.api";
import type { Trip, TripStatus } from "@/types/trip.types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TripStatusBadge, formatDate, tripDuration, formatCurrency } from "@/components/trips/TripHelpers";

const STATUS_FILTERS: { label: string; value: TripStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Planned", value: "PLANNED" },
  { label: "Ongoing", value: "ONGOING" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export default function TripsPage() {
  const { status } = useAuth();
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TripStatus | "ALL">("ALL");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?redirect=/trips");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    tripsApi.getAll().then((r) => setTrips(r.data)).finally(() => setLoading(false));
  }, [status]);

  const handleDelete = async (tripId: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeletingId(tripId);
    try {
      await tripsApi.delete(tripId);
      setTrips((prev) => prev.filter((t) => t.id !== tripId));
    } catch (err) {
      alert(isAxiosError(err) ? err.response?.data?.message ?? "Failed to delete." : "Failed to delete.");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = trips.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Group by status
  const ongoing = filtered.filter((t) => t.status === "ONGOING");
  const upcoming = filtered.filter((t) => t.status === "PLANNED");
  const completed = filtered.filter((t) => t.status === "COMPLETED");
  const cancelled = filtered.filter((t) => t.status === "CANCELLED");

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 mb-1">Travel</p>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Trips</h1>
          <p className="text-sm text-gray-500 mt-0.5">{trips.length} trip{trips.length !== 1 ? "s" : ""} total</p>
        </div>
        <Link href="/trips/new">
          <Button>
            <Plus size={16} />
            Plan a trip
          </Button>
        </Link>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search trips..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === f.value
                  ? "bg-indigo-600 text-white"
                  : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="text-center py-16">
            <Map size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-base font-medium text-gray-600 mb-1">
              {search || statusFilter !== "ALL" ? "No trips match your filters" : "No trips yet"}
            </p>
            <p className="text-sm text-gray-400 mb-6">
              {search || statusFilter !== "ALL"
                ? "Try adjusting your search or filters"
                : "Start planning your first adventure"}
            </p>
            {!search && statusFilter === "ALL" && (
              <Link href="/trips/new">
                <Button>
                  <Plus size={16} />
                  Plan a trip
                </Button>
              </Link>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {ongoing.length > 0 && (
            <TripGroup title="Ongoing" trips={ongoing} onDelete={handleDelete} deletingId={deletingId} />
          )}
          {upcoming.length > 0 && (
            <TripGroup title="Upcoming" trips={upcoming} onDelete={handleDelete} deletingId={deletingId} />
          )}
          {completed.length > 0 && (
            <TripGroup title="Completed" trips={completed} onDelete={handleDelete} deletingId={deletingId} />
          )}
          {cancelled.length > 0 && (
            <TripGroup title="Cancelled" trips={cancelled} onDelete={handleDelete} deletingId={deletingId} />
          )}
        </div>
      )}
    </div>
  );
}

function TripGroup({
  title,
  trips,
  onDelete,
  deletingId,
}: {
  title: string;
  trips: Trip[];
  onDelete: (id: string, title: string) => void;
  deletingId: string | null;
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</h2>
      <div className="space-y-3">
        {trips.map((trip) => (
          <TripCard key={trip.id} trip={trip} onDelete={onDelete} deletingId={deletingId} />
        ))}
      </div>
    </div>
  );
}

function TripCard({
  trip,
  onDelete,
  deletingId,
}: {
  trip: Trip;
  onDelete: (id: string, title: string) => void;
  deletingId: string | null;
}) {
  const isDeleting = deletingId === trip.id;

  return (
    <Card className="hover:border-indigo-200 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <h3 className="text-sm font-semibold text-gray-900">{trip.title}</h3>
            <TripStatusBadge status={trip.status} />
            {trip.visibility === "PUBLIC" && (
              <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded-md font-medium">Public</span>
            )}
          </div>
          {trip.description && (
            <p className="text-xs text-gray-500 mb-2 line-clamp-1">{trip.description}</p>
          )}
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {formatDate(trip.startDate)} → {formatDate(trip.endDate)}
              <span className="text-gray-400 ml-1">({tripDuration(trip.startDate, trip.endDate)} days)</span>
            </span>
            {trip.totalBudget && (
              <span className="flex items-center gap-1">
                <DollarSign size={12} />
                Budget: {formatCurrency(trip.totalBudget)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/trips/${trip.id}`}>
            <Button variant="secondary" size="sm">
              <Eye size={14} />
              View
            </Button>
          </Link>
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(trip.id, trip.title)}
            loading={isDeleting}
            disabled={isDeleting}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
    </Card>
  );
}
