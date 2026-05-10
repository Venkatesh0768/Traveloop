"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { isAxiosError } from "axios";
import { tripsApi } from "@/lib/api/trips.api";
import type { CreateTripRequest, Visibility } from "@/types/trip.types";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Map } from "lucide-react";

export default function NewTripPage() {
  const router = useRouter();
  const [form, setForm] = useState<CreateTripRequest>({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    coverImage: "",
    visibility: "PRIVATE",
    totalBudget: undefined,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CreateTripRequest, string>>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: typeof errors = {};
    if (!form.title.trim()) e.title = "Trip title is required";
    if (!form.startDate) e.startDate = "Start date is required";
    if (!form.endDate) e.endDate = "End date is required";
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      e.endDate = "End date must be after start date";
    }
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setApiError(null);
    setLoading(true);
    try {
      const res = await tripsApi.create({
        ...form,
        totalBudget: form.totalBudget ? Number(form.totalBudget) : undefined,
      });
      router.push(`/trips/${res.data.id}`);
    } catch (err) {
      setApiError(
        isAxiosError(err) ? err.response?.data?.message ?? "Failed to create trip." : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  const set = (field: keyof CreateTripRequest) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((er) => ({ ...er, [field]: undefined }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <Link href="/trips" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors">
          <ArrowLeft size={16} />
          Back to trips
        </Link>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 mb-1">New Trip</p>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Plan a new trip</h1>
        <p className="text-sm text-gray-500 mt-0.5">Fill in the details to start building your itinerary.</p>
      </div>

      <Card>
        <CardHeader icon={<Map size={16} />} title="Trip Details" description="Basic information about your trip" />

        <form onSubmit={handleSubmit} className="space-y-5">
          <Alert variant="error" message={apiError} />

          <Input
            label="Trip title *"
            placeholder="e.g. Paris & Rome Adventure"
            value={form.title}
            onChange={set("title")}
            error={errors.title}
            disabled={loading}
            autoFocus
          />

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Description</label>
            <textarea
              placeholder="What's this trip about?"
              value={form.description}
              onChange={set("description")}
              disabled={loading}
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:bg-gray-50 disabled:text-gray-400 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start date *"
              type="date"
              value={form.startDate}
              onChange={set("startDate")}
              error={errors.startDate}
              disabled={loading}
            />
            <Input
              label="End date *"
              type="date"
              value={form.endDate}
              onChange={set("endDate")}
              error={errors.endDate}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Visibility</label>
              <select
                value={form.visibility}
                onChange={set("visibility")}
                disabled={loading}
                className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:bg-gray-50"
              >
                <option value="PRIVATE">Private</option>
                <option value="PUBLIC">Public</option>
              </select>
            </div>
            <Input
              label="Total budget (USD)"
              type="number"
              placeholder="e.g. 3000"
              value={form.totalBudget ?? ""}
              onChange={set("totalBudget")}
              disabled={loading}
              min="0"
            />
          </div>

          <Input
            label="Cover image URL"
            placeholder="https://..."
            value={form.coverImage ?? ""}
            onChange={set("coverImage")}
            disabled={loading}
          />

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading} fullWidth>
              {loading ? "Creating trip…" : "Create trip"}
            </Button>
            <Link href="/trips" className="flex-1">
              <Button type="button" variant="secondary" fullWidth disabled={loading}>
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
