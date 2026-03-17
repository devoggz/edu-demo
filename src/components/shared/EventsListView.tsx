"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, MapPin, Banknote, Users, Clock, CheckCircle, Loader2, X, Smartphone } from "lucide-react";

const TYPE_COLORS: Record<string, string> = {
  EXAM:    "badge-red",
  TRIP:    "badge-purple",
  EVENT:   "badge-blue",
  MEETING: "badge-yellow",
  HOLIDAY: "badge-green",
  CLASS:   "badge-slate",
};

interface EventPayment { status: string; amount: number; }
interface EventItem {
  id: string; title: string; description: string | null;
  startDate: string; endDate: string; allDay: boolean;
  type: string; location: string | null; color: string | null;
  requiresPayment: boolean; amount: number | null;
  paymentDeadline: string | null;
  class: { name: string } | null;
  payments: EventPayment[];
}

interface Props {
  events: EventItem[];
  role: "admin" | "teacher" | "parent" | "student";
  parentPhone?: string;
  studentIds?: string[];
  parentId?: string;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-KE", { weekday: "short", month: "short", day: "numeric" });
}

function PaymentModal({ event, studentIds, parentPhone, onClose, onPaid }: {
  event: EventItem; studentIds: string[]; parentPhone: string;
  onClose: () => void; onPaid: () => void;
}) {
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
        body: JSON.stringify({ eventId: event.id, studentId: selectedStudent, phone, amount: event.amount }),
      });
      const data = await res.json() as { success?: boolean; message?: string; error?: string };
      if (res.ok && data.success) { setMsg(data.message ?? "Payment processed."); setStep("done"); onPaid(); }
      else { setMsg(data.error ?? "Payment failed."); setStep("error"); }
    } catch { setMsg("Network error."); setStep("error"); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto transition-colors"
        style={{ background: "hsl(var(--card))" }}>
        <div className="bg-emerald-600 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-white font-bold text-sm">Pay Event Fee</p>
            <p className="text-emerald-100 text-xs mt-0.5">{event.title}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          {step === "form" && (
            <>
              <div className="rounded-xl p-4" style={{ background: "hsl(var(--muted))" }}>
                <div className="flex justify-between text-sm mb-1">
                  <span style={{ color: "hsl(var(--muted-foreground))" }}>Event Fee</span>
                  <span className="font-bold text-emerald-600">KES {event.amount?.toLocaleString()}</span>
                </div>
                {event.paymentDeadline && (
                  <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                    Pay by: {formatDate(event.paymentDeadline)}
                  </p>
                )}
              </div>
              {studentIds.length > 1 && (
                <div>
                  <label className="label">Student</label>
                  <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} className="input">
                    {studentIds.map(id => <option key={id} value={id}>{id}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="label"><Smartphone className="w-3.5 h-3.5 inline mr-1" />M-PESA Phone</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0712 345 678" className="input" />
              </div>
              <button onClick={handlePay} disabled={!phone} className="btn-lg btn-success w-full">
                Send M-PESA Prompt
              </button>
            </>
          )}
          {step === "processing" && (
            <div className="py-10 text-center">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-3" />
              <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Processing payment…</p>
              <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>Check your phone for M-PESA prompt</p>
            </div>
          )}
          {step === "done" && (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Payment Successful!</p>
              <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{msg}</p>
              <button onClick={onClose} className="btn-md btn-success w-full">Done</button>
            </div>
          )}
          {step === "error" && (
            <div className="py-6 text-center space-y-3">
              <p className="text-sm text-red-500">{msg}</p>
              <div className="flex gap-2">
                <button onClick={() => setStep("form")} className="btn-md btn-secondary flex-1">Try Again</button>
                <button onClick={onClose} className="btn-md btn-ghost flex-1">Close</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function EventsListView({ events, role, parentPhone = "", studentIds = [], parentId }: Props) {
  const [payModal, setPayModal] = useState<EventItem | null>(null);
  const [paidEvents, setPaidEvents] = useState<Set<string>>(new Set(
    events.filter(e => e.payments.some(p => p.status === "PAID")).map(e => e.id)
  ));

  const now = new Date();
  const upcoming = events.filter(e => new Date(e.endDate) >= now);
  const past = events.filter(e => new Date(e.endDate) < now);

  const renderEvent = (evt: EventItem) => {
    const isPaid = paidEvents.has(evt.id);
    const myPayment = evt.payments[0];
    const isOverdue = evt.paymentDeadline && new Date(evt.paymentDeadline) < now;

    const detailHref = `${basePath}/${evt.id}`;
    return (
      <Link key={evt.id} href={detailHref} className="block group">
      <div className="card card-body hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: (evt.color ?? "#3b82f6") + "22", border: `2px solid ${evt.color ?? "#3b82f6"}` }}>
            <Calendar className="w-4 h-4" style={{ color: evt.color ?? "#3b82f6" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: "hsl(var(--foreground))" }}>{evt.title}</p>
            <span className={`badge ${TYPE_COLORS[evt.type] ?? "badge-slate"} text-[10px] mt-1`}>{evt.type}</span>
          </div>
        </div>

        {evt.description && (
          <p className="text-xs mb-3 leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
            {evt.description}
          </p>
        )}

        <div className="space-y-1.5 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{formatDate(evt.startDate)}{evt.startDate !== evt.endDate ? ` – ${formatDate(evt.endDate)}` : ""}</span>
          </div>
          {evt.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{evt.location}</span>
            </div>
          )}
          {evt.class && (
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{evt.class.name}</span>
            </div>
          )}
        </div>

        {/* Payment section */}
        {evt.requiresPayment && evt.amount && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: "hsl(var(--border))" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  KES {evt.amount.toLocaleString()}
                </span>
              </div>
              {role === "parent" && (
                isPaid || myPayment?.status === "PAID" ? (
                  <span className="badge badge-green text-xs flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Paid
                  </span>
                ) : (
                  <button onClick={(e) => { e.preventDefault(); setPayModal(evt); }}
                    className={`btn-sm ${isOverdue ? "btn-destructive" : "btn-success"}`}>
                    Pay Now
                  </button>
                )
              )}
            </div>
            {evt.paymentDeadline && (
              <p className={`text-[10px] mt-1 ${isOverdue ? "text-red-500" : ""}`}
                style={isOverdue ? {} : { color: "hsl(var(--muted-foreground))" }}>
                {isOverdue ? "⚠ Deadline passed: " : "Pay by: "}{formatDate(evt.paymentDeadline)}
              </p>
            )}
          </div>
        )}
      </div>
      </Link>
    );
  };

  const basePath = role === "admin" ? "/dashboard/admin/events"
    : role === "teacher" ? "/dashboard/teacher/events"
    : role === "parent"  ? "/dashboard/parent/events"
    : "/dashboard/student/events";

  return (
    <>
      {/* Upcoming */}
      <div>
        <p className="section-title mb-3">Upcoming ({upcoming.length})</p>
        {upcoming.length === 0 ? (
          <div className="card card-body text-center py-12">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>No upcoming events</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {upcoming.map(renderEvent)}
          </div>
        )}
      </div>

      {/* Past */}
      {past.length > 0 && (
        <div>
          <p className="section-title mb-3">Past Events ({past.length})</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 opacity-70">
            {past.slice(0, 6).map(renderEvent)}
          </div>
        </div>
      )}

      {/* Pay modal */}
      {payModal && (
        <PaymentModal
          event={payModal}
          studentIds={studentIds}
          parentPhone={parentPhone}
          onClose={() => setPayModal(null)}
          onPaid={() => setPaidEvents(s => new Set([...s, payModal.id]))}
        />
      )}
    </>
  );
}
