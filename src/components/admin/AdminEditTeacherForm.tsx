"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface Subject { id: string; name: string; code: string; }
interface TeacherData {
  id: string; name: string; email: string; phone: string;
  department: string; qualification: string; specialization: string;
  bio: string; subjectIds: string[];
}

export function AdminEditTeacherForm({ teacher, subjects }: { teacher: TeacherData; subjects: Subject[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(teacher.subjectIds);
  const [form, setForm] = useState({
    name: teacher.name, phone: teacher.phone,
    department: teacher.department, qualification: teacher.qualification,
    specialization: teacher.specialization, bio: teacher.bio,
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const toggleSubject = (id: string) =>
    setSelectedSubjects(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { setError("Name is required."); return; }
    setLoading(true); setError("");

    try {
      const res = await fetch(`/api/admin/teachers/${teacher.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, subjectIds: selectedSubjects }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setError(data.error ?? "Failed to update."); return; }
      setSuccess(true);
      setTimeout(() => router.push(`/dashboard/admin/teachers/${teacher.id}`), 1200);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="card card-body flex items-center gap-3 max-w-lg">
        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Profile updated!</p>
          <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Redirecting…</p>
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

      <div className="card card-body space-y-4">
        <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Personal Information</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Full Name <span className="text-red-500">*</span></label>
            <input type="text" value={form.name} onChange={set("name")} className="input" required />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" value={teacher.email} className="input opacity-60" disabled />
            <p className="text-[10px] mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>Email cannot be changed</p>
          </div>
          <div>
            <label className="label">Phone Number</label>
            <input type="tel" value={form.phone} onChange={set("phone")} placeholder="+254 7XX XXX XXX" className="input" />
          </div>
        </div>
      </div>

      <div className="card card-body space-y-4">
        <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Professional Details</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Department</label>
            <input type="text" value={form.department} onChange={set("department")} className="input" />
          </div>
          <div>
            <label className="label">Qualification</label>
            <input type="text" value={form.qualification} onChange={set("qualification")} className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Specialization</label>
            <input type="text" value={form.specialization} onChange={set("specialization")} className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Bio / About</label>
            <textarea value={form.bio} onChange={set("bio")} rows={3} className="input resize-none" />
          </div>
        </div>
      </div>

      <div className="card card-body">
        <p className="text-sm font-semibold mb-3" style={{ color: "hsl(var(--foreground))" }}>
          Learning Areas
          <span className="text-xs font-normal ml-1" style={{ color: "hsl(var(--muted-foreground))" }}>
            ({selectedSubjects.length} selected)
          </span>
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {subjects.map(s => (
            <label key={s.id}
              className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${selectedSubjects.includes(s.id) ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "hover:border-slate-300 dark:hover:border-slate-600"}`}
              style={{ borderColor: selectedSubjects.includes(s.id) ? "" : "hsl(var(--border))" }}>
              <input type="checkbox" checked={selectedSubjects.includes(s.id)} onChange={() => toggleSubject(s.id)}
                className="w-3.5 h-3.5 rounded accent-blue-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className={`text-xs font-semibold truncate ${selectedSubjects.includes(s.id) ? "text-blue-700 dark:text-blue-300" : ""}`}
                   style={selectedSubjects.includes(s.id) ? {} : { color: "hsl(var(--foreground))" }}>
                  {s.name}
                </p>
                <p className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>{s.code}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={() => router.back()} className="btn-md btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn-md btn-primary">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
