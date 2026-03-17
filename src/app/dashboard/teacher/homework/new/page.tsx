"use client";

import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";

interface ClassOption { id: string; name: string; }
interface SubjectOption { id: string; name: string; }

export default function NewHomeworkPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    fetch("/api/teacher/options")
      .then((r) => r.json())
      .then((data) => {
        setClasses(data.classes ?? []);
        setSubjects(data.subjects ?? []);
      })
      .catch(() => {})
      .finally(() => setLoadingOptions(false));
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries());
    try {
      const res = await fetch("/api/teacher/homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/dashboard/teacher/homework"), 1200);
      } else {
        const body = await res.json().catch(() => ({}));
        setError((body as { error?: string }).error ?? "Failed to assign. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center gap-3 sticky top-0 z-30">
        <Link href="/dashboard/teacher/homework" className="p-1.5 rounded-lg hover:bg-slate-100 transition">
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Assign Homework</h1>
          <p className="text-sm text-slate-500">Create a new assignment for your class</p>
        </div>
      </div>
      <div className="p-6 max-w-2xl">
        {success && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 mb-5">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <p className="font-medium">Homework assigned! Redirecting…</p>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-5 text-sm">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="card-padded space-y-4">
          <div>
            <label className="label">Title <span className="text-red-500">*</span></label>
            <input name="title" required placeholder="e.g. Algebra Worksheet Chapter 5"
              className="input" />
          </div>
          <div>
            <label className="label">Instructions <span className="text-red-500">*</span></label>
            <textarea name="description" required rows={4} placeholder="Provide clear instructions for students…"
              className="input resize-none" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="label">Class <span className="text-red-500">*</span></label>
              <select name="classId" required disabled={loadingOptions}
                className="select disabled:opacity-50">
                <option value="">{loadingOptions ? "Loading…" : "Select class"}</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Subject <span className="text-red-500">*</span></label>
              <select name="subjectId" required disabled={loadingOptions}
                className="select disabled:opacity-50">
                <option value="">{loadingOptions ? "Loading…" : "Select subject"}</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="label">Due Date <span className="text-red-500">*</span></label>
              <input type="date" name="dueDate" required min={new Date().toISOString().split("T")[0]}
                className="input" />
            </div>
            <div>
              <label className="label">Type</label>
              <select name="isWeekly"
                className="select">
                <option value="false">Daily</option>
                <option value="true">Weekly</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">
              Attachment URL <span className="text-xs text-slate-400 font-normal">(optional)</span>
            </label>
            <input name="attachmentUrl" type="url" placeholder="https://drive.google.com/…"
              className="input" />
          </div>
          <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
            <Link href="/dashboard/teacher/homework"
              className="px-5 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition">
              Cancel
            </Link>
            <button type="submit" disabled={loading || success}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {success ? "Assigned!" : "Assign Homework"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
