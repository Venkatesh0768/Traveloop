"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2, Trash2, CheckSquare, Square, RotateCcw } from "lucide-react";
import { isAxiosError } from "axios";
import { checklistApi } from "@/lib/api/trips.api";
import type {
  ChecklistItem,
  CreateChecklistItemRequest,
  ChecklistProgress,
  ChecklistCategory,
} from "@/types/trip.types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { ChecklistCategoryBadge } from "./TripHelpers";

const CHECKLIST_CATEGORIES: ChecklistCategory[] = [
  "CLOTHING", "DOCUMENTS", "ELECTRONICS", "MEDICINE",
  "TOILETRIES", "ACCESSORIES", "FOOD", "OTHER",
];

export function ChecklistTab({ tripId }: { tripId: string }) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [progress, setProgress] = useState<ChecklistProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddItem, setShowAddItem] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<ChecklistCategory | "ALL">("ALL");

  const loadData = async () => {
    const [itemsRes, progressRes] = await Promise.all([
      checklistApi.getAll(tripId),
      checklistApi.getProgress(tripId),
    ]);
    setItems(itemsRes.data);
    setProgress(progressRes.data);
  };

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [tripId]);

  const refreshProgress = async () => {
    const res = await checklistApi.getProgress(tripId);
    setProgress(res.data);
  };

  const handleToggle = async (item: ChecklistItem) => {
    try {
      const res = await checklistApi.updateStatus(item.id, !item.packed);
      setItems((prev) => prev.map((i) => (i.id === item.id ? res.data : i)));
      await refreshProgress();
    } catch {
      alert("Failed to update item.");
    }
  };

  const handleItemAdded = async (item: ChecklistItem) => {
    setItems((prev) => [...prev, item]);
    setShowAddItem(false);
    await refreshProgress();
  };

  const handleItemDeleted = async (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    await refreshProgress();
  };

  const handleResetAll = async () => {
    if (!confirm("Mark all items as unpacked?")) return;
    try {
      await Promise.all(
        items.filter((i) => i.packed).map((i) => checklistApi.updateStatus(i.id, false))
      );
      setItems((prev) => prev.map((i) => ({ ...i, packed: false })));
      await refreshProgress();
    } catch {
      alert("Failed to reset checklist.");
    }
  };

  const filtered = items.filter(
    (i) => categoryFilter === "ALL" || i.category === categoryFilter
  );

  // Group by category
  const grouped = filtered.reduce<Record<string, ChecklistItem[]>>((acc, item) => {
    const cat = item.category ?? "OTHER";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      {progress && progress.totalItems > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-semibold text-gray-900">Packing progress</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {progress.packedItems} of {progress.totalItems} items packed
              </p>
            </div>
            <span className="text-2xl font-bold text-indigo-600">
              {progress.progressPercentage?.toFixed(0)}%
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all"
              style={{ width: `${progress.progressPercentage ?? 0}%` }}
            />
          </div>
        </Card>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setCategoryFilter("ALL")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              categoryFilter === "ALL" ? "bg-indigo-600 text-white" : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            All
          </button>
          {CHECKLIST_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                categoryFilter === cat ? "bg-indigo-600 text-white" : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {cat.charAt(0) + cat.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <div className="flex gap-2 shrink-0">
          {items.some((i) => i.packed) && (
            <Button variant="secondary" size="sm" onClick={handleResetAll}>
              <RotateCcw size={13} />
              Reset all
            </Button>
          )}
          <Button size="sm" onClick={() => setShowAddItem((v) => !v)}>
            <Plus size={14} />
            Add item
          </Button>
        </div>
      </div>

      {/* Add item form */}
      {showAddItem && (
        <AddChecklistItemForm
          tripId={tripId}
          onAdded={handleItemAdded}
          onCancel={() => setShowAddItem(false)}
        />
      )}

      {/* Items grouped by category */}
      {filtered.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <CheckSquare size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-600 mb-1">
              {categoryFilter !== "ALL" ? "No items in this category" : "No items yet"}
            </p>
            <p className="text-xs text-gray-400 mb-4">Add items to your packing list</p>
            {categoryFilter === "ALL" && (
              <Button size="sm" onClick={() => setShowAddItem(true)}>
                <Plus size={14} />
                Add first item
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([cat, catItems]) => (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-2">
                <ChecklistCategoryBadge category={cat as ChecklistCategory} />
                <span className="text-xs text-gray-400">
                  {catItems.filter((i) => i.packed).length}/{catItems.length}
                </span>
              </div>
              <div className="space-y-1.5">
                {catItems.map((item) => (
                  <ChecklistItemRow
                    key={item.id}
                    item={item}
                    onToggle={() => handleToggle(item)}
                    onDeleted={() => handleItemDeleted(item.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Add Checklist Item Form ──────────────────────────────────────────────────

function AddChecklistItemForm({
  tripId,
  onAdded,
  onCancel,
}: {
  tripId: string;
  onAdded: (item: ChecklistItem) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<CreateChecklistItemRequest>({
    itemName: "",
    category: "OTHER",
    quantity: 1,
    packed: false,
  });
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.itemName.trim()) return;
    setApiError(null);
    setLoading(true);
    try {
      const res = await checklistApi.create(tripId, { ...form, quantity: Number(form.quantity) || 1 });
      onAdded(res.data);
    } catch (err) {
      setApiError(isAxiosError(err) ? err.response?.data?.message ?? "Failed." : "Failed.");
    } finally {
      setLoading(false);
    }
  };

  const set = (field: keyof CreateChecklistItemRequest) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  return (
    <Card className="border-indigo-200 bg-indigo-50/30">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Add item</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Alert variant="error" message={apiError} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Item name *" placeholder="e.g. Passport" value={form.itemName} onChange={set("itemName")} disabled={loading} />
          <Input label="Quantity" type="number" value={form.quantity ?? 1} onChange={set("quantity")} disabled={loading} min="1" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Category</label>
          <select value={form.category ?? "OTHER"} onChange={set("category")} disabled={loading} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20">
            {CHECKLIST_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" loading={loading}>Add item</Button>
          <Button type="button" variant="secondary" size="sm" onClick={onCancel} disabled={loading}>Cancel</Button>
        </div>
      </form>
    </Card>
  );
}

// ─── Checklist Item Row ───────────────────────────────────────────────────────

function ChecklistItemRow({
  item,
  onToggle,
  onDeleted,
}: {
  item: ChecklistItem;
  onToggle: () => void;
  onDeleted: () => void;
}) {
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Remove "${item.itemName}"?`)) return;
    setDeleteLoading(true);
    try {
      await checklistApi.delete(item.id);
      onDeleted();
    } catch {
      alert("Failed to delete.");
      setDeleteLoading(false);
    }
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
      item.packed ? "bg-gray-50 border-gray-100" : "bg-white border-gray-200"
    }`}>
      <button
        onClick={onToggle}
        className={`shrink-0 transition-colors ${item.packed ? "text-emerald-600" : "text-gray-300 hover:text-gray-500"}`}
        aria-label={item.packed ? "Mark as unpacked" : "Mark as packed"}
      >
        {item.packed ? <CheckSquare size={20} /> : <Square size={20} />}
      </button>
      <div className="flex-1 min-w-0">
        <span className={`text-sm font-medium ${item.packed ? "line-through text-gray-400" : "text-gray-900"}`}>
          {item.itemName}
        </span>
        {item.quantity > 1 && (
          <span className="ml-2 text-xs text-gray-400">×{item.quantity}</span>
        )}
      </div>
      <Button variant="ghost" size="sm" onClick={handleDelete} loading={deleteLoading}>
        <Trash2 size={13} className="text-gray-400 hover:text-red-500" />
      </Button>
    </div>
  );
}
