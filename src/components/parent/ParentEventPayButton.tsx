"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, X, Smartphone } from "lucide-react";

interface Props {
  eventId: string;
  amount: number;
  studentIds: string[];
  studentNames: Record<string, string>;
  parentPhone: string;
}

export function ParentEventPayButton({ eventId, amount, studentIds, studentNames, parentPhone }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState(parentPhone);
  const [selectedStudent, setSelectedStudent] = useState(studentIds[0] ?? "");
  const [step, setStep] = useState<"form" | "processing" | "done" | "error">("form");
  const [msg, setMsg] = useState("");

  const handlePay = async () => {
    if (!phone || !selectedStudent) return;
    setStep("processing");
    try {
      const res = await fetch("/api/events/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, studentId: selectedStudent, phone, amount }),
      });
      const data = await res.json() as { success?: boolean; message?: string; error?: string };
      if (res.ok && data.success) {
        setMsg(data.message ?? "Payment successful.");
        setStep("done");
        setTimeout(() => { setOpen(false); router.refresh(); }, 2000);
      } else {
        setMsg(data.error ?? "Payment failed.");
        setStep("error");
      }
    } catch {
      setMsg("Network error. Please try again.");
      setStep("error");
    }
  };

  return (
    <>
      <button onClick={() => { setOpen(true); setStep("form"); }} className="btn-md btn-success gap-2">
        Pay KES {amount.toLocaleString()}
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: "hsl(var(--card))" }}>
            <div className="flex items-center justify-between px-5 py-4 bg-emerald-600">
              <p className="text-white font-bold text-sm">Pay via M-PESA</p>
              <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {step === "form" && (
                <>
                  <div className="rounded-xl p-4" style={{ background: "hsl(var(--muted))" }}>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: "hsl(var(--muted-foreground))" }}>Event Fee</span>
                      <span className="font-bold text-emerald-600">KES {amount.toLocaleString()}</span>
                    </div>
                  </div>

                  {studentIds.length > 1 && (
                    <div>
                      <label className="label">Select Student</label>
                      <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} className="input">
                        {studentIds.map(sid => (
                          <option key={sid} value={sid}>{studentNames[sid] ?? sid}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="label">
                      <Smartphone className="w-3.5 h-3.5 inline mr-1" />M-PESA Phone
                    </label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="0712 345 678" className="input" />
                  </div>

                  <button onClick={handlePay} disabled={!phone || !selectedStudent}
                    className="btn-lg btn-success w-full">
                    Send M-PESA Prompt
                  </button>
                </>
              )}

              {step === "processing" && (
                <div className="py-10 text-center">
                  <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-3" />
                  <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Processing…</p>
                  <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>Enter your M-PESA PIN on your phone</p>
                </div>
              )}

              {step === "done" && (
                <div className="py-8 text-center space-y-3">
                  <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                  </div>
                  <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Payment Successful!</p>
                  <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{msg}</p>
                </div>
              )}

              {step === "error" && (
                <div className="py-4 space-y-3">
                  <p className="text-sm text-red-500 text-center">{msg}</p>
                  <div className="flex gap-2">
                    <button onClick={() => setStep("form")} className="btn-md btn-secondary flex-1">Try Again</button>
                    <button onClick={() => setOpen(false)} className="btn-md btn-ghost flex-1">Close</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
