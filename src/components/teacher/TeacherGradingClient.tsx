"use client";

import { useState } from "react";
import { getInitials } from "@/lib/utils";
import { Save, CheckCircle, AlertCircle, Loader2, TrendingUp, Award } from "lucide-react";

// ── Kenya CBC Grading System ─────────────────────────────────────────────────
const CBC_GRADES = [
  { grade: "EE", label: "Exceeds Expectations", range: "80–100", color: "bg-green-500", light: "bg-green-50 text-green-700 border-green-300", description: "Learner performance is well above the expected standard" },
  { grade: "ME", label: "Meets Expectations",   range: "65–79",  color: "bg-blue-500",  light: "bg-blue-50 text-blue-700 border-blue-300",   description: "Learner performance is at the expected standard" },
  { grade: "AE", label: "Approaching Expectations", range: "50–64", color: "bg-yellow-500", light: "bg-yellow-50 text-yellow-700 border-yellow-300", description: "Learner is making progress toward the expected standard" },
  { grade: "BE", label: "Below Expectations",   range: "0–49",   color: "bg-red-500",   light: "bg-red-50 text-red-700 border-red-300",   description: "Learner performance is below the expected standard" },
];

const TERMS = ["Term 1 2024", "Term 2 2024", "Term 3 2024", "Term 1 2025", "Term 2 2025", "Term 3 2025"];
const EXAM_TYPES = [
  "Formative Assessment 1",
  "Formative Assessment 2",
  "Summative Assessment",
  "End of Term",
  "Project Work",
  "Practical Assessment",
];

function getCBCGrade(score: number) {
  if (score >= 80) return CBC_GRADES[0];
  if (score >= 65) return CBC_GRADES[1];
  if (score >= 50) return CBC_GRADES[2];
  return CBC_GRADES[3];
}

interface Student {
  id: string;
  name: string;
  studentId: string;
  gender: string;
  performance: {
    id: string;
    subjectId: string;
    subjectName: string;
    score: number;
    grade: string;
    term: string;
    examType: string;
    remarks: string | null;
    createdAt: string;
  }[];
}

interface ClassData {
  id: string;
  name: string;
  grade: number;
  students: Student[];
}

interface SubjectData {
  id: string;
  name: string;
  code: string;
}

interface GradeEntry {
  studentId: string;
  score: string;
  saving: boolean;
  saved: boolean;
  error: string;
}

export function TeacherGradingClient({
  classes,
  subjects,
}: {
  classes: ClassData[];
  subjects: SubjectData[];
}) {
  const [selectedClass, setSelectedClass] = useState(classes[0]?.id ?? "");
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.id ?? "");
  const [selectedTerm, setSelectedTerm] = useState(TERMS[TERMS.length - 1]);
  const [selectedExamType, setSelectedExamType] = useState(EXAM_TYPES[0]);
  const [entries, setEntries] = useState<Record<string, GradeEntry>>({});
  const [savingAll, setSavingAll] = useState(false);
  const [bulkSuccess, setBulkSuccess] = useState(false);

  const cls = classes.find((c) => c.id === selectedClass);
  const subject = subjects.find((s) => s.id === selectedSubject);

  const getEntry = (studentId: string): GradeEntry =>
    entries[studentId] ?? { studentId, score: "", saving: false, saved: false, error: "" };

  const setScore = (studentId: string, score: string) => {
    const num = Number(score);
    const error = score !== "" && (isNaN(num) || num < 0 || num > 100) ? "Score must be 0–100" : "";
    setEntries((prev) => ({ ...prev, [studentId]: { ...getEntry(studentId), score, error, saved: false } }));
  };

  const saveGrade = async (studentId: string) => {
    const entry = getEntry(studentId);
    const score = Number(entry.score);
    if (isNaN(score) || entry.score === "") return;

    setEntries((prev) => ({ ...prev, [studentId]: { ...entry, saving: true, error: "" } }));

    try {
      const res = await fetch("/api/teacher/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          subjectId: selectedSubject,
          score,
          term: selectedTerm,
          examType: selectedExamType,
        }),
      });
      const data = await res.json() as { error?: string };
      if (res.ok) {
        setEntries((prev) => ({ ...prev, [studentId]: { ...entry, saving: false, saved: true, error: "" } }));
      } else {
        setEntries((prev) => ({ ...prev, [studentId]: { ...entry, saving: false, error: data.error ?? "Failed to save" } }));
      }
    } catch {
      setEntries((prev) => ({ ...prev, [studentId]: { ...entry, saving: false, error: "Network error" } }));
    }
  };

  const saveAll = async () => {
    if (!cls) return;
    setSavingAll(true);
    setBulkSuccess(false);

    const toSave = cls.students.filter((s) => {
      const e = getEntry(s.id);
      return e.score !== "" && !isNaN(Number(e.score));
    });

    await Promise.all(toSave.map((s) => saveGrade(s.id)));
    setSavingAll(false);
    setBulkSuccess(true);
    setTimeout(() => setBulkSuccess(false), 3000);
  };

  // Get existing grade for this student/subject/term/examType
  const getExistingGrade = (student: Student) => {
    return student.performance.find(
      (p) =>
        p.subjectId === selectedSubject &&
        p.term === selectedTerm &&
        p.examType === selectedExamType
    );
  };

  const filledCount = cls?.students.filter((s) => getEntry(s.id).score !== "").length ?? 0;

  return (
    <div className="space-y-6">
      {/* CBC Legend */}
      <div className="card card-body">
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-slate-500" />
          Kenya CBC Grading Scale
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CBC_GRADES.map((g) => (
            <div key={g.grade} className={`rounded-xl border p-3 ${g.light}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold ${g.color}`}>
                  {g.grade}
                </span>
                <span className="text-xs font-bold">{g.range}%</span>
              </div>
              <p className="text-xs font-semibold">{g.label}</p>
              <p className="text-xs opacity-75 mt-0.5 leading-tight">{g.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="card card-body">
        <h3 className="section-title mb-3">Assessment Configuration</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => { setSelectedClass(e.target.value); setEntries({}); }}
              className="input"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Learning Area</label>
            <select
              value={selectedSubject}
              onChange={(e) => { setSelectedSubject(e.target.value); setEntries({}); }}
              className="input"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Term</label>
            <select
              value={selectedTerm}
              onChange={(e) => { setSelectedTerm(e.target.value); setEntries({}); }}
              className="input"
            >
              {TERMS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Assessment Type</label>
            <select
              value={selectedExamType}
              onChange={(e) => { setSelectedExamType(e.target.value); setEntries({}); }}
              className="input"
            >
              {EXAM_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grade Entry Table */}
      {cls && subject ? (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="section-title">
                {cls.name} · {subject.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedTerm} · {selectedExamType} · {filledCount}/{cls.students.length} filled
              </p>
            </div>
            <div className="flex items-center gap-3">
              {bulkSuccess && (
                <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                  <CheckCircle className="w-4 h-4" /> All saved!
                </span>
              )}
              <button
                onClick={saveAll}
                disabled={savingAll || filledCount === 0}
                className="btn-md btn-primary"
              >
                {savingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save All ({filledCount})
              </button>
            </div>
          </div>

          <div className="table-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Learner</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">Score (0–100)</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-28">CBC Grade</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Performance Level</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Previous</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-20">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {cls.students.map((student) => {
                  const entry = getEntry(student.id);
                  const score = Number(entry.score);
                  const cbcGrade = entry.score !== "" && !isNaN(score) ? getCBCGrade(score) : null;
                  const existing = getExistingGrade(student);

                  return (
                    <tr key={student.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {getInitials(student.name)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{student.name}</p>
                            <p className="text-xs text-slate-400">{student.studentId}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={entry.score}
                          onChange={(e) => setScore(student.id, e.target.value)}
                          onBlur={() => entry.score !== "" && !entry.error && saveGrade(student.id)}
                          placeholder={existing ? String(existing.score) : "—"}
                          className={`input text-center ${
                            entry.error ? "border-red-400 ring-2 ring-red-500/20" :
                            entry.saved ? "border-emerald-400 ring-2 ring-emerald-500/20" : ""
                          }`}
                        />
                        {entry.error && (
                          <p className="text-xs text-red-500 text-center mt-0.5">{entry.error}</p>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {cbcGrade ? (
                          <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-white text-sm font-bold ${cbcGrade.color}`}>
                            {cbcGrade.grade}
                          </span>
                        ) : existing ? (
                          <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-white text-sm font-bold ${getCBCGrade(existing.score).color}`}>
                            {existing.grade}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {cbcGrade ? (
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{cbcGrade.label}</p>
                            <p className="text-xs text-slate-400">{cbcGrade.description}</p>
                          </div>
                        ) : existing ? (
                          <div>
                            <p className="text-sm font-semibold text-slate-600">{getCBCGrade(existing.score).label}</p>
                            <p className="text-xs text-slate-400">{existing.remarks}</p>
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs">Enter score to see level</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {existing ? (
                          <div className="text-xs">
                            <span className={`badge font-semibold ${getCBCGrade(existing.score).light} border`}>
                              {existing.grade} · {existing.score}%
                            </span>
                            <p className="text-slate-400 mt-0.5">{existing.term} · {existing.examType}</p>
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs">No record</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {entry.saving ? (
                          <Loader2 className="w-4 h-4 animate-spin text-blue-500 mx-auto" />
                        ) : entry.saved ? (
                          <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                        ) : entry.error ? (
                          <AlertCircle className="w-4 h-4 text-red-500 mx-auto" />
                        ) : entry.score !== "" ? (
                          <button
                            onClick={() => saveGrade(student.id)}
                            className="btn-sm btn-ghost text-blue-600"
                          >
                            Save
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {cls.students.length === 0 && (
            <div className="text-center py-12">
              <TrendingUp className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No students in this class</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
          <p className="text-slate-400">Select a class and learning area to begin grading</p>
        </div>
      )}

      {/* Class performance summary */}
      {cls && (
        <div className="card card-body">
          <h3 className="section-title flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-slate-500" /> Class Performance Summary
          </h3>
          <div className="space-y-3">
            {cls.students.map((student) => {
              const allScores = student.performance;
              if (allScores.length === 0) return null;

              const avg = Math.round(allScores.reduce((s, p) => s + p.score, 0) / allScores.length);
              const grade = getCBCGrade(avg);

              // Count grades
              const gradeCounts = { EE: 0, ME: 0, AE: 0, BE: 0 };
              allScores.forEach((p) => {
                if (p.grade in gradeCounts) gradeCounts[p.grade as keyof typeof gradeCounts]++;
              });

              return (
                <div key={student.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition">
                  <div className="flex items-center gap-3 w-48 flex-shrink-0">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {getInitials(student.name)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{student.name}</p>
                      <p className="text-xs text-slate-400">{allScores.length} assessments</p>
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span>Overall Average</span>
                      <span className={`font-bold text-sm ${grade.color.replace("bg-", "text-")}`}>{avg}% · {grade.grade}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${grade.color}`}
                        style={{ width: `${avg}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-1.5 flex-shrink-0">
                    {Object.entries(gradeCounts).map(([g, count]) =>
                      count > 0 ? (
                        <span
                          key={g}
                          className={`text-xs px-1.5 py-0.5 rounded-md border font-medium ${
                            CBC_GRADES.find((cg) => cg.grade === g)?.light ?? ""
                          }`}
                        >
                          {g}:{count}
                        </span>
                      ) : null
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
