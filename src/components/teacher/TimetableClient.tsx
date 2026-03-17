"use client";

import { useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Loader2, X, Clock, GripVertical } from "lucide-react";
import { useRouter } from "next/navigation";

const DAYS = [
  { num: 1, name: "Mon", full: "Monday" },
  { num: 2, name: "Tue", full: "Tuesday" },
  { num: 3, name: "Wed", full: "Wednesday" },
  { num: 4, name: "Thu", full: "Thursday" },
  { num: 5, name: "Fri", full: "Friday" },
];

const SUBJECT_COLORS = [
  "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-700",
  "bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/40 dark:text-violet-200 dark:border-violet-700",
  "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/40 dark:text-teal-200 dark:border-teal-700",
  "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700",
  "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-200 dark:border-rose-700",
  "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-700",
];

interface Entry {
  id: string; dayOfWeek: number; dayName: string;
  startTime: string; endTime: string;
  className: string; classId: string;
  subjectName: string; subjectId: string; room: string;
}
interface ClassItem  { id: string; name: string; }
interface SubjectItem { id: string; name: string; code: string; }

const emptyForm = { dayOfWeek: 1, startTime: "08:00", endTime: "09:00", classId: "", subjectId: "", room: "" };

export function TimetableClient({
  teacherId, entries: initial, classes, subjects,
}: {
  teacherId: string;
  entries: Entry[];
  classes: ClassItem[];
  subjects: SubjectItem[];
}) {
  const router = useRouter();
  const [entries, setEntries] = useState(initial);
  const [modal, setModal]     = useState<{ mode: "add" | "edit"; entry?: Entry } | null>(null);
  const [form, setForm]       = useState({ ...emptyForm });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  // Build stable subject → colour map
  const subjectColors: Record<string, string> = {};
  subjects.forEach((s, i) => { subjectColors[s.id] = SUBJECT_COLORS[i % SUBJECT_COLORS.length]; });

  const openAdd = (day: number) => {
    setForm({ ...emptyForm, dayOfWeek: day });
    setError("");
    setModal({ mode: "add" });
  };

  const openEdit = (entry: Entry) => {
    setForm({
      dayOfWeek: entry.dayOfWeek,
      startTime: entry.startTime,
      endTime:   entry.endTime,
      classId:   entry.classId,
      subjectId: entry.subjectId,
      room:      entry.room,
    });
    setError("");
    setModal({ mode: "edit", entry });
  };

  const handleSave = async () => {
    if (!form.classId)   { setError("Please select a class."); return; }
    if (!form.subjectId) { setError("Please select a subject."); return; }
    if (form.startTime >= form.endTime) { setError("End time must be after start time."); return; }

    setLoading(true); setError("");
    try {
      const isEdit = modal?.mode === "edit";
      const url    = isEdit ? `/api/teacher/timetable/${modal!.entry!.id}` : "/api/teacher/timetable";
      const res    = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId, ...form }),
      });
      const data = await res.json() as { error?: string; id?: string; class?: { name: string }; subject?: { name: string } };
      if (!res.ok) { setError(data.error ?? "Failed to save."); return; }

      const subjectName = subjects.find(s => s.id === form.subjectId)?.name ?? "";
      const className   = classes.find(c => c.id === form.classId)?.name ?? "";

      if (isEdit && modal?.entry) {
        setEntries(prev => prev.map(e =>
          e.id === modal.entry!.id
            ? { ...e, ...form, subjectName, className, dayName: DAYS[form.dayOfWeek - 1].full }
            : e
        ));
      } else {
        const newEntry: Entry = {
          id: data.id ?? String(Date.now()),
          ...form,
          subjectName,
          className,
          dayName: DAYS[form.dayOfWeek - 1].full,
        };
        setEntries(prev => [...prev, newEntry]);
      }
      setModal(null);
      router.refresh();
    } catch { setError("Network error. Try again."); }
    finally { setLoading(false); }
  };

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Remove this class from your timetable?")) return;
    setDeleting(id);
    try {
      await fetch(`/api/teacher/timetable/${id}`, { method: "DELETE" });
      setEntries(prev => prev.filter(e => e.id !== id));
      router.refresh();
    } finally { setDeleting(null); }
  }, [router]);

  const getDay = (day: number) =>
    entries.filter(e => e.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const totalClasses = entries.length;
  const uniqueSubjects = new Set(entries.map(e => e.subjectName)).size;

  return (
    <>
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-2xl font-bold" style={{ color: "hsl(var(--foreground))" }}>{totalClasses}</span>
            <span className="text-xs ml-1" style={{ color: "hsl(var(--muted-foreground))" }}>classes/week</span>
          </div>
          <div>
            <span className="text-2xl font-bold" style={{ color: "hsl(var(--foreground))" }}>{uniqueSubjects}</span>
            <span className="text-xs ml-1" style={{ color: "hsl(var(--muted-foreground))" }}>subjects</span>
          </div>
        </div>
        <button onClick={() => openAdd(1)} className="btn-md btn-primary ml-auto gap-1.5">
          <Plus className="w-4 h-4" /> Add Class
        </button>
      </div>

      {/* Desktop grid */}
      <div className="hidden md:block card overflow-hidden">
        {/* Column headers */}
        <div className="grid grid-cols-5 border-b" style={{ borderColor: "hsl(var(--border))" }}>
          {DAYS.map(d => (
            <div key={d.num}
              className="px-3 py-2.5 border-r last:border-r-0 flex items-center justify-between"
              style={{ background: "hsl(var(--muted))", borderColor: "hsl(var(--border))" }}>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(var(--foreground))" }}>
                {d.full}
              </p>
              <button onClick={() => openAdd(d.num)}
                className="btn-sm btn-ghost p-1 opacity-60 hover:opacity-100" title="Add class">
                <Plus className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Grid body */}
        <div className="grid grid-cols-5 min-h-[320px]">
          {DAYS.map(d => (
            <div key={d.num} className="border-r last:border-r-0 p-2 space-y-2"
              style={{ borderColor: "hsl(var(--border))" }}>
              {getDay(d.num).map(entry => (
                <div key={entry.id}
                  className={`rounded-lg border p-2.5 text-xs group relative ${subjectColors[entry.subjectId] ?? SUBJECT_COLORS[0]}`}>
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <p className="font-bold truncate leading-tight">{entry.subjectName}</p>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={() => openEdit(entry)}
                        className="p-0.5 rounded hover:bg-black/10 transition-colors">
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        disabled={deleting === entry.id}
                        className="p-0.5 rounded hover:bg-red-500/20 hover:text-red-700 transition-colors">
                        {deleting === entry.id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <Trash2 className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                  <p className="truncate opacity-80 leading-tight">{entry.className}</p>
                  <div className="flex items-center gap-1 mt-1.5 opacity-70">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{entry.startTime}–{entry.endTime}</span>
                  </div>
                  {entry.room && (
                    <p className="mt-0.5 opacity-60 truncate">📍 {entry.room}</p>
                  )}
                </div>
              ))}

              {getDay(d.num).length === 0 && (
                <button onClick={() => openAdd(d.num)}
                  className="w-full h-16 rounded-xl border-2 border-dashed flex items-center justify-center gap-1 text-xs transition-all hover:opacity-70"
                  style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))", opacity: 0.4 }}>
                  <Plus className="w-3 h-3" /> Add
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile list view */}
      <div className="md:hidden space-y-3">
        {DAYS.map(d => {
          const dayEntries = getDay(d.num);
          return (
            <div key={d.num} className="card">
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "hsl(var(--border))" }}>
                <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>{d.full}</p>
                <button onClick={() => openAdd(d.num)} className="btn-sm btn-ghost gap-1" style={{ color: "hsl(var(--primary))" }}>
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
              {dayEntries.length === 0 ? (
                <p className="px-4 py-4 text-xs text-center" style={{ color: "hsl(var(--muted-foreground))" }}>No classes</p>
              ) : (
                <div className="divide-y" style={{ borderColor: "hsl(var(--border))" }}>
                  {dayEntries.map(entry => (
                    <div key={entry.id} className="flex items-center gap-3 px-4 py-3.5">
                      <div className="w-1 h-10 rounded-full flex-shrink-0"
                        style={{ background: "hsl(var(--primary))" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "hsl(var(--foreground))" }}>
                          {entry.subjectName}
                        </p>
                        <p className="text-xs mt-0.5 truncate" style={{ color: "hsl(var(--muted-foreground))" }}>
                          {entry.className} · {entry.startTime}–{entry.endTime}
                          {entry.room ? ` · ${entry.room}` : ""}
                        </p>
                      </div>
                      <div className="flex gap-0.5 flex-shrink-0">
                        <button onClick={() => openEdit(entry)} className="btn-sm btn-ghost p-1.5">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          disabled={deleting === entry.id}
                          className="btn-sm btn-ghost p-1.5 text-red-500">
                          {deleting === entry.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div
            className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto"
            style={{ background: "hsl(var(--card))" }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 z-10"
              style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}>
              <h3 className="text-base font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                {modal.mode === "add" ? "Add Class" : "Edit Class"}
              </h3>
              <button onClick={() => setModal(null)} className="btn-sm btn-ghost p-1.5">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {error && (
                <p className="text-xs px-3 py-2.5 rounded-lg border"
                  style={{ background: "hsl(0 50% 97%)", color: "hsl(0 70% 50%)", borderColor: "hsl(0 60% 90%)" }}>
                  {error}
                </p>
              )}

              <div>
                <label className="label">Day</label>
                <select
                  value={form.dayOfWeek}
                  onChange={e => setForm(f => ({ ...f, dayOfWeek: Number(e.target.value) }))}
                  className="select"
                >
                  {DAYS.map(d => <option key={d.num} value={d.num}>{d.full}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Start Time</label>
                  <input type="time" value={form.startTime}
                    onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} className="input" />
                </div>
                <div>
                  <label className="label">End Time</label>
                  <input type="time" value={form.endTime}
                    onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} className="input" />
                </div>
              </div>

              <div>
                <label className="label">Class <span className="text-red-500">*</span></label>
                <select value={form.classId} onChange={e => setForm(f => ({ ...f, classId: e.target.value }))} className="select">
                  <option value="">Select class…</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="label">Subject <span className="text-red-500">*</span></label>
                <select value={form.subjectId} onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))} className="select">
                  <option value="">Select subject…</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                </select>
              </div>

              <div>
                <label className="label">Room (optional)</label>
                <input type="text" value={form.room}
                  onChange={e => setForm(f => ({ ...f, room: e.target.value }))}
                  placeholder="e.g. Room 101"
                  className="input" />
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={() => setModal(null)} className="btn-md btn-secondary flex-1">Cancel</button>
                <button onClick={handleSave} disabled={loading} className="btn-md btn-primary flex-1">
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                    : modal.mode === "add" ? "Add Class" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
