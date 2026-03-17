"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Send, CheckCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface ClassOption { id: string; name: string; }

export function AdminNotificationForm({ classes }: { classes: ClassOption[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [isGlobal, setIsGlobal] = useState(true);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    const form = new FormData(e.currentTarget);
    const data = {
      title: form.get("title") as string,
      message: form.get("message") as string,
      type: form.get("type") as string,
      classId: isGlobal ? null : form.get("classId") as string,
      isGlobal,
    };

    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (res.ok) {
        setSuccess(`Sent to ${(body as { recipientCount: number }).recipientCount} parent${(body as { recipientCount: number }).recipientCount !== 1 ? "s" : ""} successfully`);
        (e.target as HTMLFormElement).reset();
        router.refresh();
      } else {
        setError((body as { error?: string }).error ?? "Failed to send notification");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card card-body">
      <h3 className="section-title mb-3">Send New Notification</h3>

      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 mb-4 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" /> {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Audience toggle */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Audience</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsGlobal(true)}
              className={`flex-1 py-2 text-sm font-medium rounded-xl border transition ${isGlobal ? "bg-blue-600 text-white border-blue-600" : "text-slate-600 border-slate-200 hover:bg-slate-50"}`}
            >
              All Parents (Global)
            </button>
            <button
              type="button"
              onClick={() => setIsGlobal(false)}
              className={`flex-1 py-2 text-sm font-medium rounded-xl border transition ${!isGlobal ? "bg-blue-600 text-white border-blue-600" : "text-slate-600 border-slate-200 hover:bg-slate-50"}`}
            >
              Specific Class
            </button>
          </div>
        </div>

        {/* Class selector (only when not global) */}
        {!isGlobal && (
          <div>
            <label className="label">Class</label>
            <select name="classId" required
              className="select">
              <option value="">Select a class…</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="col-span-1">
            <label className="label">Title</label>
            <input name="title" required placeholder="Notification title…"
              className="input w-full " />
          </div>
          <div className="col-span-1">
            <label className="label">Type</label>
            <select name="type"
              className="select">
              <option value="GENERAL">General</option>
              <option value="FEE">Fee</option>
              <option value="EVENT">Event</option>
              <option value="TRIP">Trip</option>
              <option value="ANNOUNCEMENT">Announcement</option>
              <option value="PERFORMANCE">Performance</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Message</label>
          <textarea name="message" required rows={3}
            placeholder="Write your message to parents…"
            className="input w-full resize-none" />
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send Notification
          </button>
        </div>
      </form>
    </div>
  );
}
