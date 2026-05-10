"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  Search,
  Loader2,
  Compass,
  TrendingUp,
  Star,
  Globe,
  DollarSign,
} from "lucide-react";
import { citiesApi } from "@/lib/api/trips.api";
import type { City } from "@/types/trip.types";
import { Card } from "@/components/ui/Card";

function CitiesContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<City[]>([]);
  const [trending, setTrending] = useState<City[]>([]);
  const [popular, setPopular] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"search" | "trending" | "popular">(
    initialQuery ? "search" : "trending"
  );

  useEffect(() => {
    Promise.all([
      citiesApi.getTrending().then((r) => setTrending(r.data)),
      citiesApi.getPopular().then((r) => setPopular(r.data)),
    ]).finally(() => setInitialLoading(false));
  }, []);

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, []);

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    setActiveTab("search");
    try {
      const res = await citiesApi.search(q.trim());
      setResults(res.data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (!val.trim()) {
      setResults([]);
      setActiveTab("trending");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch(query);
  };

  const displayCities =
    activeTab === "search" ? results : activeTab === "trending" ? trending : popular;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 mb-1">Discover</p>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Explore Cities</h1>
        <p className="text-sm text-gray-500 mt-0.5">Find your next destination</p>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search cities, countries..."
          value={query}
          onChange={handleQueryChange}
          onKeyDown={handleKeyDown}
          className="w-full pl-12 pr-4 py-3.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
        />
        {loading && (
          <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-600 animate-spin" />
        )}
        {query && !loading && (
          <button
            onClick={() => handleSearch(query)}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Search
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5">
        {[
          { id: "trending" as const, label: "🔥 Trending", icon: <TrendingUp size={14} /> },
          { id: "popular" as const, label: "⭐ Popular", icon: <Star size={14} /> },
          ...(results.length > 0 || (query && activeTab === "search")
            ? [{ id: "search" as const, label: `Results (${results.length})`, icon: <Search size={14} /> }]
            : []),
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white"
                : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* City grid */}
      {initialLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      ) : displayCities.length === 0 ? (
        <Card>
          <div className="text-center py-16">
            <Compass size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-base font-medium text-gray-600 mb-1">
              {activeTab === "search" ? "No cities found" : "No cities available"}
            </p>
            <p className="text-sm text-gray-400">
              {activeTab === "search" ? "Try a different search term" : "Check back later"}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayCities.map((city) => (
            <CityCard key={city.id} city={city} />
          ))}
        </div>
      )}
    </div>
  );
}

function CityCard({ city }: { city: City }) {
  const costLabel = city.costIndex != null
    ? city.costIndex > 70 ? "Expensive" : city.costIndex > 40 ? "Moderate" : "Budget"
    : null;
  const costColor = city.costIndex != null
    ? city.costIndex > 70 ? "text-red-600 bg-red-50" : city.costIndex > 40 ? "text-amber-600 bg-amber-50" : "text-emerald-600 bg-emerald-50"
    : "";

  return (
    <div className="group rounded-xl border border-gray-200 bg-white overflow-hidden hover:border-indigo-200 hover:shadow-md transition-all">
      {/* Image */}
      <div className="relative h-36 bg-gradient-to-br from-indigo-400 to-purple-500 overflow-hidden">
        {city.imageUrl ? (
          <img
            src={city.imageUrl}
            alt={city.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-4xl font-bold text-white/40">{city.name[0]}</span>
          </div>
        )}
        {city.trending && (
          <span className="absolute top-2 right-2 text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full font-medium">
            🔥 Trending
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{city.name}</h3>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <Globe size={11} /> {city.country}
              {city.region && <span className="text-gray-400">· {city.region}</span>}
            </p>
          </div>
          {costLabel && (
            <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${costColor}`}>
              {costLabel}
            </span>
          )}
        </div>

        {city.description && (
          <p className="text-xs text-gray-500 mt-2 line-clamp-2">{city.description}</p>
        )}

        <div className="flex flex-wrap gap-2 mt-3">
          {city.currency && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <DollarSign size={11} /> {city.currency}
            </span>
          )}
          {city.language && (
            <span className="text-xs text-gray-500">🗣 {city.language}</span>
          )}
          {city.popularityScore != null && city.popularityScore > 0 && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Star size={11} /> {city.popularityScore}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CitiesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
      </div>
    }>
      <CitiesContent />
    </Suspense>
  );
}
