"use client";

import { useState } from "react";
import { Bell, Loader2, CheckCircle } from "lucide-react";

export function FeePromptButton({ feeId, balance, promptCount = 0 }: {
  feeId: string;
  balance: number;
  promptCount?: number;
}) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [count, setCount] = useState(promptCount);

  if (balance <= 0) return null;

  const handlePrompt = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/fees/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feeId }),
      });
      const data = await res.json() as { success?: boolean; promptCount?: number };
      if (res.ok && data.success) {
        setSent(true);
        setCount(data.promptCount ?? count + 1);
        setTimeout(() => setSent(false), 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePrompt}
      disabled={loading || sent}
      title={count > 0 ? `Prompted ${count} time${count !== 1 ? "s" : ""}` : "Prompt parent for payment"}
      className={`btn-sm ${sent ? "btn-success" : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50"} border-0 gap-1.5`}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : sent ? (
        <><CheckCircle className="w-3.5 h-3.5" /> Sent!</>
      ) : (
        <><Bell className="w-3.5 h-3.5" /> Prompt{count > 0 ? ` (${count})` : ""}</>
      )}
    </button>
  );
}
