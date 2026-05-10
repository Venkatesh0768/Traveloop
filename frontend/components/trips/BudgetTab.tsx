"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2, Trash2, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";
import { isAxiosError } from "axios";
import { expensesApi } from "@/lib/api/trips.api";
import type {
  Trip,
  Expense,
  CreateExpenseRequest,
  BudgetSummary,
  ExpenseCategory,
} from "@/types/trip.types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { ExpenseCategoryBadge, formatCurrency, formatDate } from "./TripHelpers";

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "HOTEL", "TRANSPORT", "FOOD", "SHOPPING", "ACTIVITIES",
  "FLIGHT", "TRAIN", "TAXI", "EMERGENCY", "OTHER",
];

export function BudgetTab({ tripId, trip }: { tripId: string; trip: Trip }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);

  const loadData = async () => {
    const [expRes, sumRes] = await Promise.all([
      expensesApi.getAll(tripId),
      expensesApi.getBudgetSummary(tripId),
    ]);
    setExpenses(expRes.data);
    setSummary(sumRes.data);
  };

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [tripId]);

  const handleExpenseAdded = async (expense: Expense) => {
    setExpenses((prev) => [expense, ...prev]);
    setShowAddExpense(false);
    // Refresh summary
    const sumRes = await expensesApi.getBudgetSummary(tripId);
    setSummary(sumRes.data);
  };

  const handleExpenseDeleted = async (expenseId: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    const sumRes = await expensesApi.getBudgetSummary(tripId);
    setSummary(sumRes.data);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
      </div>
    );
  }

  const budgetPercent = summary && summary.totalBudget > 0
    ? Math.min(100, (summary.totalExpenses / summary.totalBudget) * 100)
    : 0;
  const isOverBudget = summary && summary.remainingBudget < 0;

  // Group expenses by category
  const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + Number(e.amount);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Budget summary cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={16} className="text-indigo-600" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Budget</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalBudget)}</p>
          </Card>
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-red-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Spent</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalExpenses)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{summary.totalExpensesCount} expense{summary.totalExpensesCount !== 1 ? "s" : ""}</p>
          </Card>
          <Card className={isOverBudget ? "border-red-200 bg-red-50/30" : ""}>
            <div className="flex items-center gap-2 mb-2">
              {isOverBudget
                ? <AlertTriangle size={16} className="text-red-500" />
                : <DollarSign size={16} className="text-emerald-600" />
              }
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Remaining</span>
            </div>
            <p className={`text-2xl font-bold ${isOverBudget ? "text-red-600" : "text-emerald-600"}`}>
              {formatCurrency(summary.remainingBudget)}
            </p>
            {isOverBudget && <p className="text-xs text-red-500 mt-0.5">Over budget!</p>}
          </Card>
        </div>
      )}

      {/* Budget progress bar */}
      {summary && summary.totalBudget > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Budget usage</span>
            <span className={`text-sm font-semibold ${isOverBudget ? "text-red-600" : "text-gray-900"}`}>
              {budgetPercent.toFixed(1)}%
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isOverBudget ? "bg-red-500" : budgetPercent > 80 ? "bg-amber-500" : "bg-indigo-600"}`}
              style={{ width: `${budgetPercent}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-xs text-gray-400">
            <span>{formatCurrency(summary.totalExpenses)} spent</span>
            <span>{formatCurrency(summary.totalBudget)} budget</span>
          </div>
        </Card>
      )}

      {/* Category breakdown */}
      {Object.keys(byCategory).length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Breakdown by category</h3>
          <div className="space-y-3">
            {Object.entries(byCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, amount]) => {
                const pct = summary && summary.totalExpenses > 0
                  ? (amount / summary.totalExpenses) * 100
                  : 0;
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1">
                      <ExpenseCategoryBadge category={cat as ExpenseCategory} />
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(amount)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      )}

      {/* Expenses list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Expenses ({expenses.length})</h3>
          <Button size="sm" onClick={() => setShowAddExpense((v) => !v)}>
            <Plus size={14} />
            Add expense
          </Button>
        </div>

        {showAddExpense && (
          <AddExpenseForm
            tripId={tripId}
            onAdded={handleExpenseAdded}
            onCancel={() => setShowAddExpense(false)}
          />
        )}

        {expenses.length === 0 && !showAddExpense ? (
          <Card>
            <div className="text-center py-10">
              <DollarSign size={36} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No expenses tracked yet</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {expenses.map((expense) => (
              <ExpenseRow key={expense.id} expense={expense} onDeleted={() => handleExpenseDeleted(expense.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Add Expense Form ─────────────────────────────────────────────────────────

function AddExpenseForm({
  tripId,
  onAdded,
  onCancel,
}: {
  tripId: string;
  onAdded: (expense: Expense) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<CreateExpenseRequest>({
    category: "OTHER",
    description: "",
    amount: 0,
    expenseDate: new Date().toISOString().split("T")[0],
    paymentMethod: "",
  });
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim() || !form.amount) return;
    setApiError(null);
    setLoading(true);
    try {
      const res = await expensesApi.create(tripId, { ...form, amount: Number(form.amount) });
      onAdded(res.data);
    } catch (err) {
      setApiError(isAxiosError(err) ? err.response?.data?.message ?? "Failed." : "Failed.");
    } finally {
      setLoading(false);
    }
  };

  const set = (field: keyof CreateExpenseRequest) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  return (
    <Card className="mb-4 border-indigo-200 bg-indigo-50/30">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Add expense</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Alert variant="error" message={apiError} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Category *</label>
            <select value={form.category} onChange={set("category")} disabled={loading} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20">
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
              ))}
            </select>
          </div>
          <Input label="Amount ($) *" type="number" placeholder="0.00" value={form.amount || ""} onChange={set("amount")} disabled={loading} min="0" step="0.01" />
        </div>
        <Input label="Description *" placeholder="e.g. Hotel booking" value={form.description} onChange={set("description")} disabled={loading} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Date" type="date" value={form.expenseDate ?? ""} onChange={set("expenseDate")} disabled={loading} />
          <Input label="Payment method" placeholder="e.g. Credit card" value={form.paymentMethod ?? ""} onChange={set("paymentMethod")} disabled={loading} />
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" loading={loading}>Add expense</Button>
          <Button type="button" variant="secondary" size="sm" onClick={onCancel} disabled={loading}>Cancel</Button>
        </div>
      </form>
    </Card>
  );
}

// ─── Expense Row ──────────────────────────────────────────────────────────────

function ExpenseRow({ expense, onDeleted }: { expense: Expense; onDeleted: () => void }) {
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete expense "${expense.description}"?`)) return;
    setDeleteLoading(true);
    try {
      await expensesApi.delete(expense.id);
      onDeleted();
    } catch {
      alert("Failed to delete.");
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="text-sm font-medium text-gray-900">{expense.description}</span>
          <ExpenseCategoryBadge category={expense.category} />
        </div>
        <div className="flex gap-3 text-xs text-gray-400">
          {expense.expenseDate && <span>{formatDate(expense.expenseDate)}</span>}
          {expense.paymentMethod && <span>{expense.paymentMethod}</span>}
        </div>
      </div>
      <span className="text-sm font-semibold text-gray-900 shrink-0">{formatCurrency(Number(expense.amount))}</span>
      <Button variant="danger" size="sm" onClick={handleDelete} loading={deleteLoading}>
        <Trash2 size={13} />
      </Button>
    </div>
  );
}
