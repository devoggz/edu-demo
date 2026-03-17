"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Send, Loader2, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface ClassOption { id: string; name: string; }

export function TeacherNotificationForm({ classes }: { classes: ClassOption[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

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
      classId: form.get("classId") as string,
    };

    try {
      const res = await fetch("/api/teacher/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json() as { recipientCount?: number; error?: string };
      if (res.ok) {
        setSuccess(`Sent to ${body.recipientCount ?? 0} parent${body.recipientCount !== 1 ? "s" : ""} successfully`);
        (e.target as HTMLFormElement).reset();
        router.refresh();
      } else {
        setError(body.error ?? "Failed to send notification");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card card-body">
      <h3 className="section-title mb-3">Send Notification to Parents</h3>

      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 mb-4 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" /> {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="label">Class</label>
            <select name="classId" required
              className="select">
              <option value="">All my classes</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Type</label>
            <select name="type"
              className="select">
              <option value="GENERAL">General</option>
              <option value="HOMEWORK">Homework</option>
              <option value="TRIP">Trip</option>
              <option value="ANNOUNCEMENT">Announcement</option>
              <option value="EVENT">Event</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Title</label>
          <input name="title" required placeholder="Notification title…"
            className="input w-full " />
        </div>

        <div>
          <label className="label">Message</label>
          <textarea name="message" required rows={3}
            placeholder="Write your message to parents…"
            className="input w-full resize-none" />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-60 transition">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send In-App
          </button>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.022.505 3.927 1.395 5.594L.058 23.292a.5.5 0 0 0 .65.65l5.698-1.337A11.934 11.934 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
            </svg>
            Via WhatsApp
          </a>
        </div>
      </form>
    </div>
  );
}
