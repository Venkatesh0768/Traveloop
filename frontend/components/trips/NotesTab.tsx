"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2, Trash2, Pin, PinOff, NotebookPen } from "lucide-react";
import { isAxiosError } from "axios";
import { notesApi } from "@/lib/api/trips.api";
import type { TripNote, CreateTripNoteRequest } from "@/types/trip.types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";

export function NotesTab({ tripId }: { tripId: string }) {
  const [notes, setNotes] = useState<TripNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddNote, setShowAddNote] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "PINNED">("ALL");

  useEffect(() => {
    notesApi.getAll(tripId).then((r) => setNotes(r.data)).finally(() => setLoading(false));
  }, [tripId]);

  const handleNoteAdded = (note: TripNote) => {
    setNotes((prev) => [note, ...prev]);
    setShowAddNote(false);
  };

  const handleNoteDeleted = (noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  const filtered = notes.filter((n) => filter === "ALL" || n.pinned);
  const pinned = filtered.filter((n) => n.pinned);
  const unpinned = filtered.filter((n) => !n.pinned);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {(["ALL", "PINNED"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filter === f ? "bg-indigo-600 text-white" : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f === "ALL" ? "All notes" : "📌 Pinned"}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => setShowAddNote((v) => !v)}>
          <Plus size={14} />
          Add note
        </Button>
      </div>

      {/* Add note form */}
      {showAddNote && (
        <AddNoteForm
          tripId={tripId}
          onAdded={handleNoteAdded}
          onCancel={() => setShowAddNote(false)}
        />
      )}

      {/* Notes */}
      {filtered.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <NotebookPen size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-600 mb-1">
              {filter === "PINNED" ? "No pinned notes" : "No notes yet"}
            </p>
            <p className="text-xs text-gray-400 mb-4">Jot down hotel info, reminders, or anything useful</p>
            {filter === "ALL" && (
              <Button size="sm" onClick={() => setShowAddNote(true)}>
                <Plus size={14} />
                Add first note
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {pinned.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">📌 Pinned</h3>
              <div className="space-y-3">
                {pinned.map((note) => (
                  <NoteCard key={note.id} note={note} onDeleted={() => handleNoteDeleted(note.id)} />
                ))}
              </div>
            </div>
          )}
          {unpinned.length > 0 && (
            <div>
              {pinned.length > 0 && (
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Other notes</h3>
              )}
              <div className="space-y-3">
                {unpinned.map((note) => (
                  <NoteCard key={note.id} note={note} onDeleted={() => handleNoteDeleted(note.id)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Add Note Form ────────────────────────────────────────────────────────────

function AddNoteForm({
  tripId,
  onAdded,
  onCancel,
}: {
  tripId: string;
  onAdded: (note: TripNote) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<CreateTripNoteRequest>({
    title: "",
    content: "",
    pinned: false,
  });
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setApiError(null);
    setLoading(true);
    try {
      const res = await notesApi.create(tripId, form);
      onAdded(res.data);
    } catch (err) {
      setApiError(isAxiosError(err) ? err.response?.data?.message ?? "Failed." : "Failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-indigo-200 bg-indigo-50/30">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Add note</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Alert variant="error" message={apiError} />
        <Input
          label="Title *"
          placeholder="e.g. Hotel check-in details"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          disabled={loading}
          autoFocus
        />
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Content</label>
          <textarea
            placeholder="Write your note here..."
            value={form.content ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            disabled={loading}
            rows={4}
            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:bg-gray-50 resize-none"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.pinned ?? false}
            onChange={(e) => setForm((f) => ({ ...f, pinned: e.target.checked }))}
            disabled={loading}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm text-gray-700">Pin this note</span>
        </label>
        <div className="flex gap-2">
          <Button type="submit" size="sm" loading={loading}>Save note</Button>
          <Button type="button" variant="secondary" size="sm" onClick={onCancel} disabled={loading}>Cancel</Button>
        </div>
      </form>
    </Card>
  );
}

// ─── Note Card ────────────────────────────────────────────────────────────────

function NoteCard({ note, onDeleted }: { note: TripNote; onDeleted: () => void }) {
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete note "${note.title}"?`)) return;
    setDeleteLoading(true);
    try {
      await notesApi.delete(note.id);
      onDeleted();
    } catch {
      alert("Failed to delete.");
      setDeleteLoading(false);
    }
  };

  const formattedDate = note.createdAt
    ? new Date(note.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <Card className={note.pinned ? "border-amber-200 bg-amber-50/20" : ""}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-sm font-semibold text-gray-900">{note.title}</h3>
            {note.pinned && <Pin size={13} className="text-amber-500" />}
            {note.stopCityName && (
              <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-md font-medium">
                📍 {note.stopCityName}
              </span>
            )}
          </div>
          {note.content && (
            <div>
              <p className={`text-sm text-gray-600 ${!expanded && "line-clamp-2"}`}>
                {note.content}
              </p>
              {note.content.length > 120 && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="text-xs text-indigo-600 hover:text-indigo-700 mt-1 font-medium"
                >
                  {expanded ? "Show less" : "Show more"}
                </button>
              )}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2">{formattedDate}</p>
        </div>
        <Button variant="danger" size="sm" onClick={handleDelete} loading={deleteLoading}>
          <Trash2 size={13} />
        </Button>
      </div>
    </Card>
  );
}
