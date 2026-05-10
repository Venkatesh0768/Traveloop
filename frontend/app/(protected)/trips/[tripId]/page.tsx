"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Loader2,
  Map,
  Share2,
  Trash2,
  CheckSquare,
  NotebookPen,
  BarChart3,
  Globe,
  Copy,
  Check,
} from "lucide-react";
import { isAxiosError } from "axios";
import { tripsApi, sharedApi } from "@/lib/api/trips.api";
import type { Trip, SharedTrip } from "@/types/trip.types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TripStatusBadge, formatDate, tripDuration, formatCurrency } from "@/components/trips/TripHelpers";
import { ItineraryTab } from "@/components/trips/ItineraryTab";
import { BudgetTab } from "@/components/trips/BudgetTab";
import { ChecklistTab } from "@/components/trips/ChecklistTab";
import { NotesTab } from "@/components/trips/NotesTab";

type Tab = "itinerary" | "budget" | "checklist" | "notes";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "itinerary", label: "Itinerary", icon: <Map size={15} /> },
  { id: "budget", label: "Budget", icon: <BarChart3 size={15} /> },
  { id: "checklist", label: "Packing", icon: <CheckSquare size={15} /> },
  { id: "notes", label: "Notes", icon: <NotebookPen size={15} /> },
];

export default function TripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("itinerary");
  const [shareLoading, setShareLoading] = useState(false);
  const [shareData, setShareData] = useState<SharedTrip | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!tripId) return;
    tripsApi.getById(tripId).then((r) => setTrip(r.data)).catch(() => router.replace("/trips")).finally(() => setLoading(false));
  }, [tripId, router]);

  const handleShare = async () => {
    if (!tripId) return;
    setShareLoading(true);
    try {
      const res = await sharedApi.generateLink(tripId);
      setShareData(res.data);
    } catch (err) {
      alert(isAxiosError(err) ? err.response?.data?.message ?? "Failed to generate share link." : "Failed.");
    } finally {
      setShareLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!shareData?.publicUrl) return;
    navigator.clipboard.writeText(shareData.publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!trip || !confirm(`Delete "${trip.title}"? This cannot be undone.`)) return;
    setDeleteLoading(true);
    try {
      await tripsApi.delete(trip.id);
      router.replace("/trips");
    } catch (err) {
      alert(isAxiosError(err) ? err.response?.data?.message ?? "Failed to delete." : "Failed.");
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!trip) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Back */}
      <Link href="/trips" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <ArrowLeft size={16} />
        Back to trips
      </Link>

      {/* Trip header */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-sm">
        {trip.coverImage && (
          <div
            className="h-40 w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${trip.coverImage})` }}
          />
        )}
        {!trip.coverImage && (
          <div className="h-32 w-full bg-gradient-to-br from-indigo-500 to-purple-600" />
        )}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{trip.title}</h1>
                <TripStatusBadge status={trip.status} />
                {trip.visibility === "PUBLIC" && (
                  <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-md font-medium">
                    <Globe size={11} /> Public
                  </span>
                )}
              </div>
              {trip.description && (
                <p className="text-sm text-gray-600 mb-3 max-w-xl">{trip.description}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-gray-400" />
                  {formatDate(trip.startDate)} → {formatDate(trip.endDate)}
                  <span className="text-gray-400">({tripDuration(trip.startDate, trip.endDate)} days)</span>
                </span>
                {trip.totalBudget && (
                  <span className="flex items-center gap-1.5">
                    <DollarSign size={14} className="text-gray-400" />
                    Budget: {formatCurrency(trip.totalBudget)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {!shareData ? (
                <Button variant="secondary" size="sm" onClick={handleShare} loading={shareLoading}>
                  <Share2 size={14} />
                  Share
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 max-w-[180px] truncate">{shareData.publicUrl}</span>
                  <Button variant="secondary" size="sm" onClick={handleCopyLink}>
                    {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
              )}
              <Button variant="danger" size="sm" onClick={handleDelete} loading={deleteLoading}>
                <Trash2 size={14} />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 -mb-px">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "itinerary" && <ItineraryTab tripId={trip.id} trip={trip} />}
        {activeTab === "budget" && <BudgetTab tripId={trip.id} trip={trip} />}
        {activeTab === "checklist" && <ChecklistTab tripId={trip.id} />}
        {activeTab === "notes" && <NotesTab tripId={trip.id} />}
      </div>
    </div>
  );
}
