"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2, Loader2, X } from "lucide-react";
import Link from "next/link";

export function AdminTeacherActions({ teacherId, teacherName }: { teacherId: string; teacherName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/teachers/${teacherId}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setOpen(o => !o)}
          className="btn-sm btn-ghost p-1.5"
          aria-label="Actions"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div
              className="absolute right-0 bottom-8 z-20 w-40 rounded-xl border shadow-lg overflow-hidden animate-fade-in"
              style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
            >
              <Link
                href={`/dashboard/admin/teachers/${teacherId}/edit`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40"
                style={{ color: "hsl(var(--foreground))" }}
              >
                <Pencil className="w-3.5 h-3.5" /> Edit Profile
              </Link>
              <button
                onClick={() => { setOpen(false); setShowConfirm(true); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </>
        )}
      </div>

      {/* Confirm dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl shadow-2xl w-full max-w-sm p-6" style={{ background: "hsl(var(--card))" }}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-base font-bold" style={{ color: "hsl(var(--foreground))" }}>Delete Teacher</h3>
              <button onClick={() => setShowConfirm(false)} className="btn-sm btn-ghost p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm mb-5" style={{ color: "hsl(var(--muted-foreground))" }}>
              Are you sure you want to delete <strong style={{ color: "hsl(var(--foreground))" }}>{teacherName}</strong>?
              This will remove their account and all associated data. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirm(false)} className="btn-md btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} className="btn-md btn-destructive flex-1">
                {deleting ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting…</> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
