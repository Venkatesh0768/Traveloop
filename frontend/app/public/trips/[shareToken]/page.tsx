"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, BarChart3, Calendar, Check, CheckSquare,
  Clock, Copy, DollarSign, Eye, Globe, Loader2,
  MapPin, NotebookPen, Pin, Plane, User, Users,
} from "lucide-react";
import { isAxiosError } from "axios";
import { sharedApi } from "@/lib/api/trips.api";
import type { FullPublicTrip } from "@/types/trip.types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  ActivityCategoryBadge,
  ChecklistCategoryBadge,
  ExpenseCategoryBadge,
  formatCurrency,
  formatDate,
  formatTime,
  tripDuration,
} from "@/components/trips/TripHelpers";
import { useAuth } from "@/context/AuthContext";

type Tab = "itinerary" | "budget" | "checklist" | "notes";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "itinerary", label: "Itinerary", icon: <MapPin size={15} /> },
  { id: "budget",    label: "Budget",    icon: <BarChart3 size={15} /> },
  { id: "checklist", label: "Packing",   icon: <CheckSquare size={15} /> },
  { id: "notes",     label: "Notes",     icon: <NotebookPen size={15} /> },
];

export default function PublicTripDetailPage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const router = useRouter();
  const { status } = useAuth();

  const [trip, setTrip] = useState<FullPublicTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("itinerary");
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);

  useEffect(() => {
    if (!shareToken) return;
    // Authenticated users get the full detail; unauthenticated get basic view
    const fetch = status === "authenticated"
      ? sharedApi.getFullPublicTrip(shareToken)
      : sharedApi.getPublicTrip(shareToken).then((r) => ({
          ...r,
          data: {
            ...r.data,
            expenses: [],
            checklistItems: [],
            notes: [],
            stops: (r.data.stops ?? []).map((s: any) => ({ ...s, activities: [] })),
          } as FullPublicTrip,
        }));

    fetch
      .then((r) => setTrip(r.data as FullPublicTrip))
      .catch((err) =>
        setError(isAxiosError(err) ? err.response?.data?.message ?? "Trip not found." : "Trip not found.")
      )
      .finally(() => setLoading(false));
  }, [shareToken, status]);

  const handleCopyTrip = async () => {
    if (status !== "authenticated") {
      router.push(`/login?redirect=/public/trips/${shareToken}`);
      return;
    }
    setCopying(true);
    try {
      await sharedApi.copyTrip(shareToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      alert(isAxiosError(err) ? err.response?.data?.message ?? "Failed to copy." : "Failed.");
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
        <div className="text-center px-4">
          <Plane size={48} className="mx-auto text-gray-300 mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Trip not found</h1>
          <p className="text-sm text-gray-500 mb-6">{error ?? "This link may have expired."}</p>
          <Link href="/"><Button variant="secondary"><ArrowLeft size={16} />Go home</Button></Link>
        </div>
      </div>
    );
  }

  const totalExpenses = trip.expenses?.reduce((s, e) => s + Number(e.amount), 0) ?? 0;
  const packedCount = trip.checklistItems?.filter((i) => i.packed).length ?? 0;
  const totalItems = trip.checklistItems?.length ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href={status === "authenticated" ? "/dashboard" : "/"} className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Plane size={14} />
            </div>
            <span className="text-sm font-bold text-gray-900">Traveloop</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleCopyUrl}>
              {urlCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              {urlCopied ? "Copied!" : "Share"}
            </Button>
            {status === "authenticated" ? (
              <Button size="sm" onClick={handleCopyTrip} loading={copying}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Saved!" : "Copy to My Trips"}
              </Button>
            ) : (
              <Link href={`/login?redirect=/public/trips/${shareToken}`}>
                <Button size="sm">Sign in to copy</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 text-white">
          {trip.coverImage && (
            <div className="h-40 w-full bg-cover bg-center opacity-30" style={{ backgroundImage: `url(${trip.coverImage})` }} />
          )}
          <div className={`p-8 ${trip.coverImage ? "-mt-40 relative z-10" : ""}`}>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <Globe size={11} /> Public Trip
              </span>
              {trip.views != null && (
                <span className="text-xs text-indigo-200 flex items-center gap-1">
                  <Eye size={11} /> {trip.views} views
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold mb-2 leading-tight">{trip.title}</h1>
            {trip.description && <p className="text-indigo-200 text-sm mb-4 max-w-xl">{trip.description}</p>}
            <div className="flex flex-wrap gap-4 text-sm text-indigo-200">
              <span className="flex items-center gap-1.5"><User size={13} />by {trip.createdBy}</span>
              <span className="flex items-center gap-1.5"><Calendar size={13} />{formatDate(trip.startDate)} → {formatDate(trip.endDate)}</span>
              <span>{tripDuration(trip.startDate, trip.endDate)} days</span>
              <span className="flex items-center gap-1.5"><MapPin size={13} />{trip.stops?.length ?? 0} stops</span>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        {status === "authenticated" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatPill icon={<MapPin size={14} className="text-indigo-600" />} label="Stops" value={String(trip.stops?.length ?? 0)} bg="bg-indigo-50" />
            <StatPill icon={<DollarSign size={14} className="text-emerald-600" />} label="Spent" value={formatCurrency(totalExpenses)} bg="bg-emerald-50" />
            <StatPill icon={<CheckSquare size={14} className="text-amber-600" />} label="Packed" value={`${packedCount}/${totalItems}`} bg="bg-amber-50" />
            <StatPill icon={<NotebookPen size={14} className="text-purple-600" />} label="Notes" value={String(trip.notes?.length ?? 0)} bg="bg-purple-50" />
          </div>
        )}

        {/* Unauthenticated prompt */}
        {status !== "authenticated" && (
          <Alert variant="info" message="Sign in to see the full itinerary with activities, budget, packing list, and notes." />
        )}

        {/* Tabs — only for authenticated */}
        {status === "authenticated" && (
          <>
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
                    {tab.icon}{tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {activeTab === "itinerary" && <ItinerarySection stops={trip.stops ?? []} />}
            {activeTab === "budget"    && <BudgetSection expenses={trip.expenses ?? []} totalBudget={trip.totalBudget} />}
            {activeTab === "checklist" && <ChecklistSection items={trip.checklistItems ?? []} />}
            {activeTab === "notes"     && <NotesSection notes={trip.notes ?? []} />}
          </>
        )}

        {/* Basic itinerary for unauthenticated */}
        {status !== "authenticated" && (
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-gray-900">Itinerary</h2>
            {(trip.stops ?? []).sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)).map((stop, idx) => (
              <Card key={stop.id}>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">{idx + 1}</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{stop.cityName} <span className="text-gray-400 font-normal">· {stop.country}</span></p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatDate(stop.arrivalDate)} → {formatDate(stop.departureDate)}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* CTA */}
        <Card className="text-center bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
          <Plane size={32} className="mx-auto text-indigo-400 mb-3" />
          <h3 className="text-base font-semibold text-gray-900 mb-1">Love this trip?</h3>
          <p className="text-sm text-gray-500 mb-4">Copy it to your account and make it your own.</p>
          {status === "authenticated" ? (
            <Button onClick={handleCopyTrip} loading={copying}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Saved to My Trips!" : "Copy this trip"}
            </Button>
          ) : (
            <Link href={`/login?redirect=/public/trips/${shareToken}`}>
              <Button>Sign in to copy this trip</Button>
            </Link>
          )}
        </Card>
      </main>
    </div>
  );
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────

function StatPill({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: string; bg: string }) {
  return (
    <div className={`flex items-center gap-2.5 p-3 rounded-xl ${bg} border border-white`}>
      {icon}
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

// ─── Itinerary Section ────────────────────────────────────────────────────────

function ItinerarySection({ stops }: { stops: FullPublicTrip["stops"] }) {
  if (!stops.length) {
    return <Card><div className="text-center py-10 text-sm text-gray-400">No stops added.</div></Card>;
  }
  return (
    <div className="space-y-4">
      {stops.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)).map((stop, idx) => (
        <Card key={stop.id}>
          {/* Stop header */}
          <div className="flex items-start gap-3 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white text-sm font-bold shrink-0">{idx + 1}</div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900">{stop.cityName}</h3>
              <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                <Globe size={11} />{stop.country}
                <span className="mx-1">·</span>
                <Calendar size={11} />{formatDate(stop.arrivalDate)} → {formatDate(stop.departureDate)}
                <span className="text-gray-400 ml-1">({tripDuration(stop.arrivalDate, stop.departureDate)}d)</span>
              </p>
              {stop.notes && <p className="text-xs text-gray-500 mt-1.5 italic border-l-2 border-indigo-200 pl-2">{stop.notes}</p>}
            </div>
          </div>

          {/* Activities */}
          {stop.activities && stop.activities.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Activities ({stop.activities.length})</p>
              {stop.activities.map((act) => (
                <div key={act.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-medium text-gray-900">{act.title}</span>
                      <ActivityCategoryBadge category={act.category} />
                    </div>
                    {act.description && <p className="text-xs text-gray-500 mb-1 line-clamp-2">{act.description}</p>}
                    <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                      {act.location && <span className="flex items-center gap-1"><MapPin size={10} />{act.location}</span>}
                      {(act.startTime || act.endTime) && (
                        <span className="flex items-center gap-1">
                          <Clock size={10} />{formatTime(act.startTime)}{act.endTime ? ` – ${formatTime(act.endTime)}` : ""}
                        </span>
                      )}
                      {act.estimatedCost != null && (
                        <span className="flex items-center gap-1"><DollarSign size={10} />{formatCurrency(Number(act.estimatedCost))}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

// ─── Budget Section ───────────────────────────────────────────────────────────

function BudgetSection({ expenses, totalBudget }: { expenses: FullPublicTrip["expenses"]; totalBudget?: number }) {
  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const pct = totalBudget && totalBudget > 0 ? Math.min(100, (total / totalBudget) * 100) : 0;
  const over = totalBudget != null && total > totalBudget;

  const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + Number(e.amount);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-xs text-gray-500 mb-1">Total Budget</p>
          <p className="text-xl font-bold text-gray-900">{totalBudget ? formatCurrency(totalBudget) : "—"}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500 mb-1">Total Spent</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(total)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{expenses.length} expense{expenses.length !== 1 ? "s" : ""}</p>
        </Card>
        <Card className={over ? "border-red-200 bg-red-50/30" : ""}>
          <p className="text-xs text-gray-500 mb-1">Remaining</p>
          <p className={`text-xl font-bold ${over ? "text-red-600" : "text-emerald-600"}`}>
            {totalBudget ? formatCurrency(totalBudget - total) : "—"}
          </p>
          {over && <p className="text-xs text-red-500 mt-0.5">Over budget</p>}
        </Card>
      </div>

      {/* Progress bar */}
      {totalBudget != null && totalBudget > 0 && (
        <Card>
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Budget usage</span>
            <span className="font-semibold">{pct.toFixed(1)}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${over ? "bg-red-500" : pct > 80 ? "bg-amber-500" : "bg-indigo-600"}`} style={{ width: `${pct}%` }} />
          </div>
        </Card>
      )}

      {/* Category breakdown */}
      {Object.keys(byCategory).length > 0 && (
        <Card>
          <p className="text-sm font-semibold text-gray-900 mb-4">By category</p>
          <div className="space-y-3">
            {Object.entries(byCategory).sort(([, a], [, b]) => b - a).map(([cat, amt]) => {
              const p = total > 0 ? (amt / total) * 100 : 0;
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1">
                    <ExpenseCategoryBadge category={cat as any} />
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(amt)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${p}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Expense list */}
      {expenses.length === 0 ? (
        <Card><div className="text-center py-8 text-sm text-gray-400">No expenses recorded.</div></Card>
      ) : (
        <div className="space-y-2">
          {expenses.map((e) => (
            <div key={e.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-sm font-medium text-gray-900">{e.description}</span>
                  <ExpenseCategoryBadge category={e.category} />
                </div>
                <div className="flex gap-3 text-xs text-gray-400">
                  {e.expenseDate && <span>{formatDate(e.expenseDate)}</span>}
                  {e.paymentMethod && <span>{e.paymentMethod}</span>}
                </div>
              </div>
              <span className="text-sm font-semibold text-gray-900 shrink-0">{formatCurrency(Number(e.amount))}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Checklist Section ────────────────────────────────────────────────────────

function ChecklistSection({ items }: { items: FullPublicTrip["checklistItems"] }) {
  const packed = items.filter((i) => i.packed).length;
  const pct = items.length > 0 ? (packed / items.length) * 100 : 0;

  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    const cat = item.category ?? "OTHER";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {items.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-900">Packing progress</p>
            <span className="text-xl font-bold text-indigo-600">{pct.toFixed(0)}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">{packed} of {items.length} items packed</p>
        </Card>
      )}

      {items.length === 0 ? (
        <Card><div className="text-center py-8 text-sm text-gray-400">No packing items added.</div></Card>
      ) : (
        Object.entries(grouped).map(([cat, catItems]) => (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-2">
              <ChecklistCategoryBadge category={cat as any} />
              <span className="text-xs text-gray-400">{catItems.filter((i) => i.packed).length}/{catItems.length}</span>
            </div>
            <div className="space-y-1.5">
              {catItems.map((item) => (
                <div key={item.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${item.packed ? "bg-gray-50 border-gray-100" : "bg-white border-gray-200"}`}>
                  <div className={`shrink-0 ${item.packed ? "text-emerald-500" : "text-gray-300"}`}>
                    <CheckSquare size={18} />
                  </div>
                  <span className={`text-sm font-medium flex-1 ${item.packed ? "line-through text-gray-400" : "text-gray-900"}`}>
                    {item.itemName}
                  </span>
                  {item.quantity > 1 && <span className="text-xs text-gray-400">×{item.quantity}</span>}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Notes Section ────────────────────────────────────────────────────────────

function NotesSection({ notes }: { notes: FullPublicTrip["notes"] }) {
  const pinned = notes.filter((n) => n.pinned);
  const rest = notes.filter((n) => !n.pinned);

  if (!notes.length) {
    return <Card><div className="text-center py-8 text-sm text-gray-400">No notes added.</div></Card>;
  }

  return (
    <div className="space-y-4">
      {pinned.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">📌 Pinned</p>
          <div className="space-y-3">
            {pinned.map((note) => <NoteCard key={note.id} note={note} />)}
          </div>
        </div>
      )}
      {rest.length > 0 && (
        <div>
          {pinned.length > 0 && <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Other notes</p>}
          <div className="space-y-3">
            {rest.map((note) => <NoteCard key={note.id} note={note} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function NoteCard({ note }: { note: FullPublicTrip["notes"][0] }) {
  const date = note.createdAt
    ? new Date(note.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";
  return (
    <Card className={note.pinned ? "border-amber-200 bg-amber-50/20" : ""}>
      <div className="flex items-start gap-2 mb-1 flex-wrap">
        <h3 className="text-sm font-semibold text-gray-900">{note.title}</h3>
        {note.pinned && <Pin size={13} className="text-amber-500 shrink-0" />}
        {note.stopCityName && (
          <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-md font-medium">📍 {note.stopCityName}</span>
        )}
      </div>
      {note.content && <p className="text-sm text-gray-600 mt-1">{note.content}</p>}
      <p className="text-xs text-gray-400 mt-2">{date}</p>
    </Card>
  );
}