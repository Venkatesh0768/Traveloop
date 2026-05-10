"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Calendar,
  MapPin,
  User,
  Copy,
  Check,
  Plane,
  ArrowLeft,
} from "lucide-react";
import { isAxiosError } from "axios";
import { sharedApi } from "@/lib/api/trips.api";
import type { PublicTrip } from "@/types/trip.types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatDate, tripDuration } from "@/components/trips/TripHelpers";
import { useAuth } from "@/context/AuthContext";

export default function SharedTripPage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const router = useRouter();
  const { status } = useAuth();
  const [trip, setTrip] = useState<PublicTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);

  useEffect(() => {
    if (!shareToken) return;
    sharedApi.getPublicTrip(shareToken)
      .then((r) => setTrip(r.data))
      .catch((err) => {
        setError(isAxiosError(err) ? err.response?.data?.message ?? "Trip not found." : "Trip not found.");
      })
      .finally(() => setLoading(false));
  }, [shareToken]);

  const handleCopyTrip = async () => {
    if (status !== "authenticated") {
      router.push(`/login?redirect=/shared/${shareToken}`);
      return;
    }
    setCopying(true);
    try {
      await sharedApi.copyTrip(shareToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      alert(isAxiosError(err) ? err.response?.data?.message ?? "Failed to copy trip." : "Failed.");
    } finally {
      setCopying(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Plane size={48} className="mx-auto text-gray-300 mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Trip not found</h1>
          <p className="text-sm text-gray-500 mb-6">{error ?? "This shared trip link may have expired."}</p>
          <Link href="/">
            <Button variant="secondary">
              <ArrowLeft size={16} />
              Go home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Plane size={14} />
            </div>
            <span className="text-sm font-bold text-gray-900">Traveloop</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleCopyUrl}>
              {urlCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              {urlCopied ? "Copied!" : "Copy link"}
            </Button>
            {status === "authenticated" ? (
              <Button size="sm" onClick={handleCopyTrip} loading={copying}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied to your trips!" : "Copy this trip"}
              </Button>
            ) : (
              <Link href={`/login?redirect=/shared/${shareToken}`}>
                <Button size="sm">Sign in to copy</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6">
        {/* Trip header */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-8 text-white">
          <p className="text-indigo-200 text-sm mb-1 flex items-center gap-1.5">
            <User size={13} /> Shared by {trip.createdBy}
          </p>
          <h1 className="text-3xl font-bold mb-3">{trip.title}</h1>
          {trip.description && (
            <p className="text-indigo-200 text-sm mb-4">{trip.description}</p>
          )}
          <div className="flex flex-wrap gap-4 text-sm text-indigo-200">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              {formatDate(trip.startDate)} → {formatDate(trip.endDate)}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin size={14} />
              {trip.stops?.length ?? 0} stop{(trip.stops?.length ?? 0) !== 1 ? "s" : ""}
            </span>
            <span>{tripDuration(trip.startDate, trip.endDate)} days</span>
          </div>
        </div>

        {/* Itinerary */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Itinerary</h2>
          {!trip.stops || trip.stops.length === 0 ? (
            <Card>
              <div className="text-center py-8">
                <MapPin size={36} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">No stops in this itinerary</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {trip.stops
                .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
                .map((stop, idx) => (
                  <Card key={stop.id}>
                    <div className="flex items-start gap-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white text-sm font-bold shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-semibold text-gray-900">{stop.cityName}</h3>
                          <span className="text-sm text-gray-500">{stop.country}</span>
                        </div>
                        <p className="text-sm text-gray-500 flex items-center gap-1.5">
                          <Calendar size={13} />
                          {formatDate(stop.arrivalDate)} → {formatDate(stop.departureDate)}
                          <span className="text-gray-400">
                            ({tripDuration(stop.arrivalDate, stop.departureDate)} days)
                          </span>
                        </p>
                        {stop.notes && (
                          <p className="text-sm text-gray-500 mt-2 italic">{stop.notes}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <Card className="text-center">
          <Plane size={36} className="mx-auto text-indigo-400 mb-3" />
          <h3 className="text-base font-semibold text-gray-900 mb-1">Love this itinerary?</h3>
          <p className="text-sm text-gray-500 mb-4">
            Copy it to your account and customize it for your own trip.
          </p>
          {status === "authenticated" ? (
            <Button onClick={handleCopyTrip} loading={copying}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copied to your trips!" : "Copy this trip"}
            </Button>
          ) : (
            <Link href={`/login?redirect=/shared/${shareToken}`}>
              <Button>Sign in to copy this trip</Button>
            </Link>
          )}
        </Card>
      </main>
    </div>
  );
}
