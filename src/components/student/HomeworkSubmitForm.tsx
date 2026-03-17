"use client";

import { useState } from "react";
import { Send, Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  homeworkId: string;
  studentId: string;
  isOverdue: boolean;
}

export function HomeworkSubmitForm({ homeworkId, studentId, isOverdue }: Props) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) { setError("Please write your answer before submitting."); return; }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/student/homework/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homeworkId, studentId, content: content.trim() }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setError(data.error ?? "Failed to submit."); return; }
      setDone(true);
      setTimeout(() => router.refresh(), 1200);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="card card-body flex items-center gap-3">
        <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Send className="w-4 h-4 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Submitted successfully!</p>
          <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Your teacher will review and provide feedback.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card card-body">
      <h3 className="text-sm font-semibold mb-1" style={{ color: "hsl(var(--foreground))" }}>
        Submit Your Work
      </h3>
      <p className="text-xs mb-4" style={{ color: "hsl(var(--muted-foreground))" }}>
        Write your answer or response below. Be thorough and show your working where applicable.
      </p>

      {isOverdue && (
        <div className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            This homework is past due. You can still submit but it will be marked as late.
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="label">Your Answer</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your answer here. Include all working, explanations, and references as required by the instructions above…"
            rows={8}
            className="input resize-none"
            disabled={loading}
          />
          <p className="text-[10px] mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
            {content.length} characters
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="btn-md btn-primary w-full sm:w-auto"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
          ) : (
            <><Send className="w-4 h-4" /> Submit Homework</>
          )}
        </button>
      </form>
    </div>
  );
}
