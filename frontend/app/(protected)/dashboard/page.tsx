"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Plus,
  Map,
  Compass,
  TrendingUp,
  Calendar,
  DollarSign,
  ArrowRight,
  Plane,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { tripsApi, citiesApi } from "@/lib/api/trips.api";
import type { Trip, City } from "@/types/trip.types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TripStatusBadge, formatDate, tripDuration } from "@/components/trips/TripHelpers";

export default function DashboardPage() {
  const { user, status } = useAuth();
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [trendingCities, setTrendingCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?redirect=/dashboard");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    Promise.all([
      tripsApi.getAll().then((r) => setTrips(r.data)),
      citiesApi.getTrending().then((r) => setTrendingCities(r.data.slice(0, 6))),
    ]).finally(() => setLoading(false));
  }, [status]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
      </div>
    );
  }

  const recentTrips = trips.slice(0, 3);
  const ongoingTrips = trips.filter((t) => t.status === "ONGOING");
  const upcomingTrips = trips.filter((t) => t.status === "PLANNED");
  const completedTrips = trips.filter((t) => t.status === "COMPLETED");

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 p-8 text-white">
        <div className="relative z-10">
          <p className="text-indigo-200 text-sm font-medium mb-1">Welcome back</p>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {user?.firstName}, where to next? ✈️
          </h1>
          <p className="text-indigo-200 text-sm mb-6">
            You have {trips.length} trip{trips.length !== 1 ? "s" : ""} planned.
            {ongoingTrips.length > 0 && ` ${ongoingTrips.length} ongoing right now.`}
          </p>
          <Link href="/trips/new">
            <Button className="bg-white text-indigo-700 hover:bg-indigo-50 border-0">
              <Plus size={16} />
              Plan a new trip
            </Button>
          </Link>
        </div>
        {/* Decorative circles */}
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -right-4 -bottom-12 h-56 w-56 rounded-full bg-white/5" />
        <Plane className="absolute right-16 top-8 text-white/20" size={80} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={<Map size={18} className="text-indigo-600" />} label="Total Trips" value={trips.length} color="indigo" />
        <StatCard icon={<Plane size={18} className="text-emerald-600" />} label="Ongoing" value={ongoingTrips.length} color="emerald" />
        <StatCard icon={<Calendar size={18} className="text-amber-600" />} label="Upcoming" value={upcomingTrips.length} color="amber" />
        <StatCard icon={<TrendingUp size={18} className="text-purple-600" />} label="Completed" value={completedTrips.length} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent trips */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Recent Trips</h2>
            <Link href="/trips" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
            </div>
          ) : recentTrips.length === 0 ? (
            <Card>
              <div className="text-center py-10">
                <Map size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-600 mb-1">No trips yet</p>
                <p className="text-xs text-gray-400 mb-4">Start planning your first adventure</p>
                <Link href="/trips/new">
                  <Button size="sm" >
                    <Plus size={14} />
                    Plan a trip
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentTrips.map((trip) => (
                <Link key={trip.id} href={`/trips/${trip.id}`}>
                  <Card className="hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">{trip.title}</h3>
                          <TripStatusBadge status={trip.status} />
                        </div>
                        <p className="text-xs text-gray-500">
                          {formatDate(trip.startDate)} → {formatDate(trip.endDate)}
                          <span className="ml-2 text-gray-400">({tripDuration(trip.startDate, trip.endDate)} days)</span>
                        </p>
                        {trip.totalBudget && (
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <DollarSign size={11} />
                            Budget: ${trip.totalBudget.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <ArrowRight size={16} className="text-gray-300 shrink-0 ml-3" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Trending destinations */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Trending</h2>
            <Link href="/cities" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
              Explore <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
            </div>
          ) : trendingCities.length === 0 ? (
            <Card>
              <div className="text-center py-6">
                <Compass size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-xs text-gray-400">No trending cities yet</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {trendingCities.map((city) => (
                <Link key={city.id} href={`/cities?q=${encodeURIComponent(city.name)}`}>
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-pointer">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 text-sm font-bold shrink-0">
                      {city.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{city.name}</p>
                      <p className="text-xs text-gray-500 truncate">{city.country}</p>
                    </div>
                    {city.trending && (
                      <span className="text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-md font-medium shrink-0">
                        🔥
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickAction
          href="/trips/new"
          icon={<Plus size={20} className="text-indigo-600" />}
          title="Plan a Trip"
          description="Create a new multi-city itinerary"
          bg="bg-indigo-50"
        />
        <QuickAction
          href="/cities"
          icon={<Compass size={20} className="text-emerald-600" />}
          title="Explore Cities"
          description="Discover destinations worldwide"
          bg="bg-emerald-50"
        />
        <QuickAction
          href="/trips"
          icon={<Map size={20} className="text-purple-600" />}
          title="My Trips"
          description="View and manage all your trips"
          bg="bg-purple-50"
        />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  const bgMap: Record<string, string> = {
    indigo: "bg-indigo-50",
    emerald: "bg-emerald-50",
    amber: "bg-amber-50",
    purple: "bg-purple-50",
  };
  return (
    <Card>
      <div className={`inline-flex p-2 rounded-lg ${bgMap[color] ?? "bg-gray-50"} mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </Card>
  );
}

function QuickAction({
  href,
  icon,
  title,
  description,
  bg,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  bg: string;
}) {
  return (
    <Link href={href}>
      <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer group">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg} shrink-0`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">{title}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
    </Link>
  );
}
