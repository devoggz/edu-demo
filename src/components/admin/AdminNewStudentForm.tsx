"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Loader2, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ClassOption { id: string; name: string; }
interface ParentOption { id: string; user: { id: string; name: string; email: string }; }

export function AdminNewStudentForm({
  classes,
  parents,
}: {
  classes: ClassOption[];
  parents: ParentOption[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries());

    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json() as { error?: string; id?: string };
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/dashboard/admin/students"), 1200);
      } else {
        setError(body.error ?? "Failed to create student");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card-padded space-y-4">
      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" /> Student enrolled successfully! Redirecting…
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="col-span-2">
          <label className="label">Full Name <span className="text-red-500">*</span></label>
          <input name="name" required placeholder="e.g. Brian Njoroge"
            className="input" />
        </div>

        <div>
          <label className="label">Gender <span className="text-red-500">*</span></label>
          <select name="gender" required
            className="select">
            <option value="">Select…</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>

        <div>
          <label className="label">Date of Birth <span className="text-red-500">*</span></label>
          <input type="date" name="dateOfBirth" required
            max={new Date().toISOString().split("T")[0]}
            className="input" />
        </div>

        <div>
          <label className="label">Class <span className="text-red-500">*</span></label>
          <select name="classId" required
            className="select">
            <option value="">Select class…</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Parent / Guardian <span className="text-red-500">*</span></label>
          <select name="parentId" required
            className="select">
            <option value="">Select parent…</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>{p.user.name} ({p.user.email})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Blood Group</label>
          <select name="bloodGroup"
            className="select">
            <option value="">Unknown</option>
            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>
        </div>

        <div className="col-span-2">
          <label className="label">Home Address</label>
          <input name="address" placeholder="e.g. 123 Westlands, Nairobi"
            className="input" />
        </div>
      </div>

      <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
        <Link href="/dashboard/admin/students"
          className="px-5 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition">
          Cancel
        </Link>
        <button type="submit" disabled={loading || success}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {success ? "Enrolled!" : "Enrol Student"}
        </button>
      </div>
    </form>
  );
}
