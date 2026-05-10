"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Globe,
  Loader2,
  MapPin,
  Plane,
  Star,
  TrendingUp,
  User,
} from "lucide-react";
import { citiesApi, publicTripsApi } from "@/lib/api/trips.api";
import type { City, PublicTrip } from "@/types/trip.types";
import { Card } from "@/components/ui/Card";
import { formatDate, tripDuration } from "@/components/trips/TripHelpers";

export default function CityDetailPage() {
  const { cityId } = useParams<{ cityId: string }>();

  const [city, setCity] = useState<City | null>(null);
  const [publicTrips, setPublicTrips] = useState<PublicTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [tripsLoading, setTripsLoading] = useState(true);

  useEffect(() => {
    if (!cityId) return;

    // cityId is actually the city name (URL-encoded) since the backend has no GET /cities/{id}
    const cityName = decodeURIComponent(cityId);

    // Search for the city by name to get its details
    citiesApi
      .search(cityName)
      .then((r) => {
        const match = r.data.find(
          (c) => c.name.toLowerCase() === cityName.toLowerCase()
        ) ?? r.data[0] ?? null;
        setCity(match);
      })
      .catch(() => setCity(null))
      .finally(() => setLoading(false));

    // Load public trips visiting this city
    publicTripsApi
      .getByCity(cityName)
      .then((r) => setPublicTrips(r.data))
      .catch(() => setPublicTrips([]))
      .finally(() => setTripsLoading(false));
  }, [cityId]);

  const costLabel =
    city?.costIndex != null
      ? city.costIndex > 70
        ? "Expensive"
        : city.costIndex > 40
        ? "Moderate"
        : "Budget-friendly"
      : null;

  const costColor =
    city?.costIndex != null
      ? city.costIndex > 70
        ? "text-red-600 bg-red-50 border-red-200"
        : city.costIndex > 40
        ? "text-amber-600 bg-amber-50 border-amber-200"
        : "text-emerald-600 bg-emerald-50 border-emerald-200"
      : "";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!city) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">City not found</h1>
        <p className="text-sm text-gray-500 mb-6">
          We couldn&apos;t find details for this city.
        </p>
        <Link
          href="/cities"
          className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          <ArrowLeft size={16} />
          Back to Explore
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Back */}
      <Link
        href="/cities"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Explore
      </Link>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-sm">
        {/* Cover image */}
        <div className="relative h-56 sm:h-72 overflow-hidden bg-gradient-to-br from-indigo-400 to-purple-600">
          {city.imageUrl ? (
            <img
              src={city.imageUrl}
              alt={city.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-8xl font-black text-white/20">{city.name[0]}</span>
            </div>
          )}
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          {/* City name on image */}
          <div className="absolute bottom-0 left-0 p-6">
            <div className="flex items-center gap-2 mb-1">
              {city.trending && (
                <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full font-medium">
                  🔥 Trending
                </span>
              )}
              {costLabel && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${costColor}`}>
                  {costLabel}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-white">{city.name}</h1>
            <p className="text-white/80 text-sm flex items-center gap-1.5 mt-1">
              <Globe size={13} />
              {city.country}
              {city.region && <span className="text-white/60">· {city.region}</span>}
            </p>
          </div>
        </div>

        {/* Info row */}
        <div className="p-6">
          {city.description && (
            <p className="text-sm text-gray-600 mb-5 leading-relaxed">{city.description}</p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {city.currency && (
              <InfoTile
                icon={<DollarSign size={16} className="text-indigo-500" />}
                label="Currency"
                value={city.currency}
              />
            )}
            {city.language && (
              <InfoTile
                icon={<span className="text-base">🗣</span>}
                label="Language"
                value={city.language}
              />
            )}
            {city.popularityScore != null && city.popularityScore > 0 && (
              <InfoTile
                icon={<Star size={16} className="text-amber-500" />}
                label="Popularity"
                value={`${city.popularityScore} / 100`}
              />
            )}
            {city.costIndex != null && (
              <InfoTile
                icon={<TrendingUp size={16} className="text-emerald-500" />}
                label="Cost index"
                value={`${city.costIndex} / 100`}
              />
            )}
          </div>
        </div>
      </div>

      {/* Public trips visiting this city */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Community trips to {city.name}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              See how other travelers planned their visit
            </p>
          </div>
          {!tripsLoading && (
            <span className="text-sm text-gray-400">
              {publicTrips.length} trip{publicTrips.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {tripsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
          </div>
        ) : publicTrips.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <MapPin size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-600 mb-1">
                No public trips yet
              </p>
              <p className="text-xs text-gray-400 mb-4">
                Be the first to share a trip to {city.name}!
              </p>
              <Link href="/trips/new">
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                  <Plane size={14} />
                  Plan a trip here
                </button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {publicTrips.map((trip) => (
              <PublicTripCard key={trip.tripId} trip={trip} highlightCity={city.name} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Info Tile ────────────────────────────────────────────────────────────────

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
      <div className="shrink-0 mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ─── Public Trip Card ─────────────────────────────────────────────────────────

function PublicTripCard({
  trip,
  highlightCity,
}: {
  trip: PublicTrip;
  highlightCity: string;
}) {
  const cityStop = trip.stops?.find(
    (s) => s.cityName.toLowerCase() === highlightCity.toLowerCase()
  );

  // Guard: if shareToken is missing the card is not clickable
  const href = trip.shareToken ? `/public/trips/${trip.shareToken}` : null;

  const inner = (
    <Card className={`h-full transition-all ${href ? "hover:border-indigo-200 hover:shadow-md cursor-pointer" : "opacity-60 cursor-not-allowed"}`}>
      {/* Trip title */}
      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors mb-1 line-clamp-1">
        {trip.title}
      </h3>

      {/* Author */}
      <p className="text-xs text-gray-500 flex items-center gap-1 mb-3">
        <User size={11} />
        by {trip.createdBy}
      </p>

      {/* Dates */}
      <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-2">
        <Calendar size={12} />
        {formatDate(trip.startDate)} → {formatDate(trip.endDate)}
        <span className="text-gray-400">({tripDuration(trip.startDate, trip.endDate)}d)</span>
      </p>

      {/* This city's stay */}
      {cityStop && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs font-medium text-indigo-600 flex items-center gap-1 mb-1">
            <MapPin size={11} />
            {highlightCity} stay
          </p>
          <p className="text-xs text-gray-500">
            {formatDate(cityStop.arrivalDate)} → {formatDate(cityStop.departureDate)}
            <span className="ml-1 text-gray-400">
              ({tripDuration(cityStop.arrivalDate, cityStop.departureDate)} days)
            </span>
          </p>
        </div>
      )}

      {/* Stop pills */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {trip.stops?.slice(0, 4).map((stop) => (
          <span
            key={stop.id}
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              stop.cityName.toLowerCase() === highlightCity.toLowerCase()
                ? "bg-indigo-100 text-indigo-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {stop.cityName}
          </span>
        ))}
        {(trip.stops?.length ?? 0) > 4 && (
          <span className="text-xs text-gray-400">+{trip.stops.length - 4} more</span>
        )}
      </div>

      {/* View link indicator */}
      {href && (
        <p className="mt-3 text-xs text-indigo-600 font-medium flex items-center gap-1">
          View full itinerary →
        </p>
      )}
    </Card>
  );

  if (!href) return <div className="block group">{inner}</div>;

  return (
    <Link href={href} className="block group">
      {inner}
    </Link>
  );
}
