"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

export function AdminEventActions({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fetch(`/api/admin/events/${eventId}`, { method: "DELETE" });
      router.push("/dashboard/admin/events");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setConfirm(true)}
        className="btn-md btn-destructive gap-2"
      >
        <Trash2 className="w-4 h-4" /> Delete Event
      </button>

      {confirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl shadow-2xl w-full max-w-sm p-6" style={{ background: "hsl(var(--card))" }}>
            <h3 className="text-base font-bold mb-2" style={{ color: "hsl(var(--foreground))" }}>Delete Event?</h3>
            <p className="text-sm mb-5" style={{ color: "hsl(var(--muted-foreground))" }}>
              This will permanently delete the event and all associated payment records. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirm(false)} className="btn-md btn-secondary flex-1">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="btn-md btn-destructive flex-1">
                {deleting ? <><Loader2 className="w-4 h-4 animate-spin" />Deleting…</> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
