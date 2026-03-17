"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Loader2, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ClassOption { id: string; name: string; }

const EVENT_COLORS = [
  { label: "Blue", value: "#3b82f6" },
  { label: "Green", value: "#10b981" },
  { label: "Purple", value: "#8b5cf6" },
  { label: "Orange", value: "#f59e0b" },
  { label: "Red", value: "#ef4444" },
  { label: "Pink", value: "#ec4899" },
];

export function AdminNewEventForm({ classes }: { classes: ClassOption[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [selectedColor, setSelectedColor] = useState("#3b82f6");
  const [allDay, setAllDay] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const data = {
      title: form.get("title"),
      description: form.get("description"),
      startDate: form.get("startDate"),
      endDate: form.get("endDate"),
      type: form.get("type"),
      classId: form.get("classId") || null,
      location: form.get("location"),
      color: selectedColor,
      allDay,
    };

    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json() as { error?: string };
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/dashboard/admin/calendar"), 1200);
      } else {
        setError(body.error ?? "Failed to create event");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().slice(0, 16);

  return (
    <form onSubmit={handleSubmit} className="card-padded space-y-4">
      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" /> Event created! Redirecting…
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{error}</div>
      )}

      <div>
        <label className="label">
          Event Title <span className="text-red-500">*</span>
        </label>
        <input name="title" required placeholder="e.g. Nairobi Museum Trip"
          className="input" />
      </div>

      <div>
        <label className="label">Description</label>
        <textarea name="description" rows={3} placeholder="Optional details about the event…"
          className="input resize-none" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="label">
            Event Type <span className="text-red-500">*</span>
          </label>
          <select name="type" required
            className="select">
            <option value="EVENT">Event</option>
            <option value="CLASS">Class</option>
            <option value="TRIP">Trip</option>
            <option value="EXAM">Exam</option>
            <option value="HOLIDAY">Holiday</option>
            <option value="MEETING">Meeting</option>
          </select>
        </div>

        <div>
          <label className="label">Class (optional)</label>
          <select name="classId"
            className="select">
            <option value="">All school</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* All day toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setAllDay(!allDay)}
          className={`w-10 h-5 rounded-full transition-colors relative ${allDay ? "bg-blue-600" : "bg-slate-200"}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${allDay ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
        <span className="text-sm font-medium text-slate-700">All-day event</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="label">
            Start <span className="text-red-500">*</span>
          </label>
          <input
            type={allDay ? "date" : "datetime-local"}
            name="startDate"
            required
            min={allDay ? today.slice(0, 10) : today}
            className="input"
          />
        </div>
        <div>
          <label className="label">
            End <span className="text-red-500">*</span>
          </label>
          <input
            type={allDay ? "date" : "datetime-local"}
            name="endDate"
            required
            min={allDay ? today.slice(0, 10) : today}
            className="input"
          />
        </div>
      </div>

      <div>
        <label className="label">Location</label>
        <input name="location" placeholder="e.g. School Hall, Room 101, Nairobi National Park"
          className="input" />
      </div>

      {/* Color picker */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Event Color</label>
        <div className="flex gap-2">
          {EVENT_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={c.label}
              onClick={() => setSelectedColor(c.value)}
              className={`w-8 h-8 rounded-full transition-all ${selectedColor === c.value ? "ring-2 ring-offset-2 ring-slate-400 scale-110" : "hover:scale-105"}`}
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>
      </div>

      <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
        <Link href="/dashboard/admin/calendar"
          className="px-5 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition">
          Cancel
        </Link>
        <button type="submit" disabled={loading || success}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {success ? "Created!" : "Create Event"}
        </button>
      </div>
    </form>
  );
}
