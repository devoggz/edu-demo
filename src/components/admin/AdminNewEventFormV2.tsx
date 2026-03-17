"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, AlertCircle, DollarSign } from "lucide-react";

interface ClassItem { id: string; name: string; }

const EVENT_TYPES = ["EVENT","EXAM","TRIP","MEETING","HOLIDAY","CLASS"];
const COLOR_OPTIONS = [
  { label: "Blue",   value: "#3b82f6" },
  { label: "Green",  value: "#10b981" },
  { label: "Orange", value: "#f97316" },
  { label: "Red",    value: "#ef4444" },
  { label: "Purple", value: "#8b5cf6" },
  { label: "Amber",  value: "#f59e0b" },
];

export function AdminNewEventFormV2({ classes }: { classes: ClassItem[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const now = new Date();
  const [form, setForm] = useState({
    title: "", description: "", location: "",
    type: "EVENT", color: "#3b82f6",
    startDate: now.toISOString().slice(0, 16),
    endDate: new Date(now.getTime() + 3600000).toISOString().slice(0, 16),
    allDay: false,
    classId: "",
    isPublic: true,
    requiresPayment: false,
    amount: "",
    paymentDeadline: "",
  });

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) { setError("Title is required."); return; }
    if (form.requiresPayment && !form.amount) { setError("Amount is required for paid events."); return; }
    setLoading(true); setError("");

    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          classId: form.classId || null,
          amount: form.requiresPayment ? Number(form.amount) : null,
          paymentDeadline: form.requiresPayment && form.paymentDeadline ? form.paymentDeadline : null,
        }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setError(data.error ?? "Failed to create event."); return; }
      setSuccess(true);
      setTimeout(() => router.push("/dashboard/admin/events"), 1200);
    } catch { setError("Network error."); }
    finally { setLoading(false); }
  };

  if (success) {
    return (
      <div className="card card-body flex items-center gap-3 max-w-lg">
        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Event created!</p>
          <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Redirecting to events…</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      {error && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Basic info */}
      <div className="card card-body space-y-4">
        <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Event Details</p>
        <div>
          <label className="label">Event Title <span className="text-red-500">*</span></label>
          <input type="text" value={form.title} onChange={set("title")} placeholder="e.g. Annual Science Fair" className="input" required />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea value={form.description} onChange={set("description")} rows={3} placeholder="Brief description of the event…" className="input resize-none" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Event Type</label>
            <select value={form.type} onChange={set("type")} className="select">
              {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Colour</label>
            <div className="flex gap-2 flex-wrap mt-1">
              {COLOR_OPTIONS.map(c => (
                <button key={c.value} type="button" onClick={() => setForm(f => ({ ...f, color: c.value }))}
                  className={`w-7 h-7 rounded-lg transition-transform ${form.color === c.value ? "scale-125 ring-2 ring-offset-2 ring-blue-500" : "hover:scale-110"}`}
                  style={{ background: c.value }} title={c.label} />
              ))}
            </div>
          </div>
          <div>
            <label className="label">Location</label>
            <input type="text" value={form.location} onChange={set("location")} placeholder="e.g. Main Hall" className="input" />
          </div>
          <div>
            <label className="label">Target Class</label>
            <select value={form.classId} onChange={set("classId")} className="select">
              <option value="">All classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Date & time */}
      <div className="card card-body space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Date & Time</p>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.allDay} onChange={e => setForm(f => ({ ...f, allDay: e.target.checked }))}
              className="w-4 h-4 rounded accent-blue-600" />
            <span className="text-sm" style={{ color: "hsl(var(--foreground))" }}>All day</span>
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Start Date {!form.allDay && "& Time"}</label>
            <input type={form.allDay ? "date" : "datetime-local"} value={form.allDay ? form.startDate.slice(0,10) : form.startDate} onChange={set("startDate")} className="input" required />
          </div>
          <div>
            <label className="label">End Date {!form.allDay && "& Time"}</label>
            <input type={form.allDay ? "date" : "datetime-local"} value={form.allDay ? form.endDate.slice(0,10) : form.endDate} onChange={set("endDate")} className="input" required />
          </div>
        </div>
      </div>

      {/* Payment settings */}
      <div className="card card-body space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Payment Required</p>
            <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Enable if this event requires a fee from parents</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={form.requiresPayment} onChange={e => setForm(f => ({ ...f, requiresPayment: e.target.checked }))}
              className="sr-only peer" />
            <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
          </label>
        </div>

        {form.requiresPayment && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t" style={{ borderColor: "hsl(var(--border))" }}>
            <div>
              <label className="label">
                <DollarSign className="w-3.5 h-3.5 inline mr-1" />
                Amount (KES) <span className="text-red-500">*</span>
              </label>
              <input type="number" min="0" step="50" value={form.amount} onChange={set("amount")} placeholder="e.g. 1500" className="input" />
            </div>
            <div>
              <label className="label">Payment Deadline</label>
              <input type="date" value={form.paymentDeadline} onChange={set("paymentDeadline")} className="input" />
            </div>
          </div>
        )}
      </div>

      {/* Visibility */}
      <div className="card card-body">
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.isPublic} onChange={e => setForm(f => ({ ...f, isPublic: e.target.checked }))}
            className="w-4 h-4 rounded accent-blue-600" />
          <div>
            <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>Visible to parents and students</p>
            <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Show this event on parent and student dashboards</p>
          </div>
        </label>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={() => router.back()} className="btn-md btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn-md btn-primary">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : "Create Event"}
        </button>
      </div>
    </form>
  );
}
