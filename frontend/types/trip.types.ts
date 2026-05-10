// ─── Enums ────────────────────────────────────────────────────────────────────

export type TripStatus = "PLANNED" | "ONGOING" | "COMPLETED" | "CANCELLED";
export type Visibility = "PUBLIC" | "PRIVATE";
export type ActivityCategory =
  | "ADVENTURE"
  | "SIGHTSEEING"
  | "FOOD"
  | "SHOPPING"
  | "BEACH"
  | "HIKING"
  | "CULTURE"
  | "NIGHTLIFE"
  | "RELAXATION"
  | "SPORTS";
export type ExpenseCategory =
  | "HOTEL"
  | "TRANSPORT"
  | "FOOD"
  | "SHOPPING"
  | "ACTIVITIES"
  | "FLIGHT"
  | "TRAIN"
  | "TAXI"
  | "EMERGENCY"
  | "OTHER";
export type ChecklistCategory =
  | "CLOTHING"
  | "DOCUMENTS"
  | "ELECTRONICS"
  | "MEDICINE"
  | "TOILETRIES"
  | "ACCESSORIES"
  | "FOOD"
  | "OTHER";

// ─── Trip ─────────────────────────────────────────────────────────────────────

export interface Trip {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  coverImage?: string;
  visibility: Visibility;
  status: TripStatus;
  totalBudget?: number;
  estimatedCost?: number;
  createdAt: string;
}

export interface CreateTripRequest {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  coverImage?: string;
  visibility?: Visibility;
  totalBudget?: number;
}

// ─── Trip Stop ────────────────────────────────────────────────────────────────

export interface TripStop {
  id: string;
  cityName: string;
  country: string;
  arrivalDate: string;
  departureDate: string;
  orderIndex?: number;
  notes?: string;
  createdAt: string;
}

export interface CreateTripStopRequest {
  cityName: string;
  country: string;
  arrivalDate: string;
  departureDate: string;
  orderIndex?: number;
  notes?: string;
}

// ─── Activity ─────────────────────────────────────────────────────────────────

export interface Activity {
  id: string;
  title: string;
  description?: string;
  category?: ActivityCategory;
  estimatedCost?: number;
  location?: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  createdAt: string;
}

export interface CreateActivityRequest {
  title: string;
  description?: string;
  category?: ActivityCategory;
  estimatedCost?: number;
  location?: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
}

// ─── Expense ──────────────────────────────────────────────────────────────────

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  expenseDate?: string;
  paymentMethod?: string;
  receiptUrl?: string;
  createdAt: string;
}

export interface CreateExpenseRequest {
  category: ExpenseCategory;
  description: string;
  amount: number;
  expenseDate?: string;
  paymentMethod?: string;
  receiptUrl?: string;
}

export interface BudgetSummary {
  totalBudget: number;
  totalExpenses: number;
  remainingBudget: number;
  totalExpensesCount: number;
}

// ─── Checklist ────────────────────────────────────────────────────────────────

export interface ChecklistItem {
  id: string;
  category?: ChecklistCategory;
  itemName: string;
  packed: boolean;
  quantity: number;
  createdAt: string;
}

export interface CreateChecklistItemRequest {
  category?: ChecklistCategory;
  itemName: string;
  packed?: boolean;
  quantity?: number;
}

export interface ChecklistProgress {
  totalItems: number;
  packedItems: number;
  unpackedItems: number;
  progressPercentage: number;
}

// ─── Notes ────────────────────────────────────────────────────────────────────

export interface TripNote {
  id: string;
  title: string;
  content?: string;
  noteDate?: string;
  pinned: boolean;
  createdAt: string;
  tripStopId?: string;
  stopCityName?: string;
}

export interface CreateTripNoteRequest {
  title: string;
  content?: string;
  noteDate?: string;
  pinned?: boolean;
  tripStopId?: string;
}

// ─── City ─────────────────────────────────────────────────────────────────────

export interface City {
  id: string;
  name: string;
  country: string;
  region?: string;
  imageUrl?: string;
  description?: string;
  costIndex?: number;
  popularityScore?: number;
  trending?: boolean;
  currency?: string;
  language?: string;
}

// ─── Shared Trip ──────────────────────────────────────────────────────────────

export interface SharedTrip {
  id: string;
  shareToken: string;
  publicUrl: string;
  active: boolean;
  views: number;
  createdAt: string;
}

export interface PublicTrip {
  tripId: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  createdBy: string;
  stops: TripStop[];
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface AdminDashboard {
  totalUsers: number;
  totalTrips: number;
  totalActivities: number;
  totalExpenses: number;
  totalRevenueTracked: number;
  totalSharedTrips: number;
}

export interface PopularCity {
  cityName: string;
  totalTrips: number;
}

export interface UserActivity {
  userEmail: string;
  totalTrips: number;
}
