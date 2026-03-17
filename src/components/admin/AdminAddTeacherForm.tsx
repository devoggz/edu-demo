"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface Subject { id: string; name: string; code: string; }

export function AdminAddTeacherForm({ subjects }: { subjects: Subject[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "",
    department: "", qualification: "", specialization: "", bio: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const toggleSubject = (id: string) =>
    setSelectedSubjects(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) { setError("Name and email are required."); return; }
    setLoading(true); setError("");

    try {
      const res = await fetch("/api/admin/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, subjectIds: selectedSubjects }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setError(data.error ?? "Failed to create teacher."); return; }
      setSuccess(true);
      setTimeout(() => router.push("/dashboard/admin/teachers"), 1500);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="card card-body flex items-center gap-3 max-w-lg mx-auto">
        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Teacher added successfully!</p>
          <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Redirecting to teachers list…</p>
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

      {/* Personal info */}
      <div className="card card-body space-y-4">
        <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Personal Information</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Full Name <span className="text-red-500">*</span></label>
            <input type="text" value={form.name} onChange={set("name")} placeholder="e.g. Jane Muthoni" className="input" required />
          </div>
          <div>
            <label className="label">Email Address <span className="text-red-500">*</span></label>
            <input type="email" value={form.email} onChange={set("email")} placeholder="teacher@school.com" className="input" required />
          </div>
          <div>
            <label className="label">Phone Number</label>
            <input type="tel" value={form.phone} onChange={set("phone")} placeholder="+254 7XX XXX XXX" className="input" />
          </div>
          <div>
            <label className="label">Initial Password</label>
            <input type="password" value={form.password} onChange={set("password")} placeholder="Leave blank for default" className="input" />
            <p className="text-[10px] mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>Default: password123</p>
          </div>
        </div>
      </div>

      {/* Professional info */}
      <div className="card card-body space-y-4">
        <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Professional Details</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Department</label>
            <input type="text" value={form.department} onChange={set("department")} placeholder="e.g. Sciences & Mathematics" className="input" />
          </div>
          <div>
            <label className="label">Qualification</label>
            <input type="text" value={form.qualification} onChange={set("qualification")} placeholder="e.g. B.Ed Mathematics" className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Specialization</label>
            <input type="text" value={form.specialization} onChange={set("specialization")} placeholder="e.g. Algebra & Statistics" className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Bio / About</label>
            <textarea value={form.bio} onChange={set("bio")} placeholder="Brief professional biography…" rows={3} className="input resize-none" />
          </div>
        </div>
      </div>

      {/* Subject assignments */}
      <div className="card card-body">
        <p className="text-sm font-semibold mb-3" style={{ color: "hsl(var(--foreground))" }}>
          Assign Learning Areas <span className="text-xs font-normal ml-1" style={{ color: "hsl(var(--muted-foreground))" }}>({selectedSubjects.length} selected)</span>
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {subjects.map(s => (
            <label key={s.id} className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${selectedSubjects.includes(s.id) ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "hover:border-slate-300 dark:hover:border-slate-600"}`}
              style={{ borderColor: selectedSubjects.includes(s.id) ? "" : "hsl(var(--border))" }}>
              <input
                type="checkbox"
                checked={selectedSubjects.includes(s.id)}
                onChange={() => toggleSubject(s.id)}
                className="w-3.5 h-3.5 rounded accent-blue-600 flex-shrink-0"
              />
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
        <button type="button" onClick={() => router.back()} className="btn-md btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn-md btn-primary">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : "Add Teacher"}
        </button>
      </div>
    </form>
  );
}
