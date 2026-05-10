import type { TripStatus, ActivityCategory, ExpenseCategory, ChecklistCategory } from "@/types/trip.types";

// ─── Status Badge ─────────────────────────────────────────────────────────────

const statusConfig: Record<TripStatus, { label: string; className: string }> = {
  PLANNED: { label: "Planned", className: "bg-blue-50 text-blue-700" },
  ONGOING: { label: "Ongoing", className: "bg-emerald-50 text-emerald-700" },
  COMPLETED: { label: "Completed", className: "bg-gray-100 text-gray-600" },
  CANCELLED: { label: "Cancelled", className: "bg-red-50 text-red-600" },
};

export function TripStatusBadge({ status }: { status: TripStatus }) {
  const cfg = statusConfig[status] ?? statusConfig.PLANNED;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

// ─── Activity Category Badge ──────────────────────────────────────────────────

const activityColors: Record<ActivityCategory, string> = {
  ADVENTURE: "bg-orange-50 text-orange-700",
  SIGHTSEEING: "bg-blue-50 text-blue-700",
  FOOD: "bg-yellow-50 text-yellow-700",
  SHOPPING: "bg-pink-50 text-pink-700",
  BEACH: "bg-cyan-50 text-cyan-700",
  HIKING: "bg-green-50 text-green-700",
  CULTURE: "bg-purple-50 text-purple-700",
  NIGHTLIFE: "bg-indigo-50 text-indigo-700",
  RELAXATION: "bg-teal-50 text-teal-700",
  SPORTS: "bg-red-50 text-red-700",
};

export function ActivityCategoryBadge({ category }: { category?: ActivityCategory }) {
  if (!category) return null;
  const cls = activityColors[category] ?? "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${cls}`}>
      {category.charAt(0) + category.slice(1).toLowerCase()}
    </span>
  );
}

// ─── Expense Category Badge ───────────────────────────────────────────────────

const expenseColors: Record<ExpenseCategory, string> = {
  HOTEL: "bg-purple-50 text-purple-700",
  TRANSPORT: "bg-blue-50 text-blue-700",
  FOOD: "bg-yellow-50 text-yellow-700",
  SHOPPING: "bg-pink-50 text-pink-700",
  ACTIVITIES: "bg-orange-50 text-orange-700",
  FLIGHT: "bg-sky-50 text-sky-700",
  TRAIN: "bg-teal-50 text-teal-700",
  TAXI: "bg-amber-50 text-amber-700",
  EMERGENCY: "bg-red-50 text-red-700",
  OTHER: "bg-gray-100 text-gray-600",
};

export function ExpenseCategoryBadge({ category }: { category: ExpenseCategory }) {
  const cls = expenseColors[category] ?? "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${cls}`}>
      {category.charAt(0) + category.slice(1).toLowerCase()}
    </span>
  );
}

// ─── Checklist Category Badge ─────────────────────────────────────────────────

const checklistColors: Record<ChecklistCategory, string> = {
  CLOTHING: "bg-pink-50 text-pink-700",
  DOCUMENTS: "bg-blue-50 text-blue-700",
  ELECTRONICS: "bg-indigo-50 text-indigo-700",
  MEDICINE: "bg-red-50 text-red-700",
  TOILETRIES: "bg-teal-50 text-teal-700",
  ACCESSORIES: "bg-purple-50 text-purple-700",
  FOOD: "bg-yellow-50 text-yellow-700",
  OTHER: "bg-gray-100 text-gray-600",
};

export function ChecklistCategoryBadge({ category }: { category?: ChecklistCategory }) {
  if (!category) return null;
  const cls = checklistColors[category] ?? "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${cls}`}>
      {category.charAt(0) + category.slice(1).toLowerCase()}
    </span>
  );
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function tripDuration(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
}

export function formatCurrency(amount?: number): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export function formatTime(time?: string): string {
  if (!time) return "";
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}
