import { Calendar, MapPin, Users, Clock, DollarSign, CheckCircle, ArrowLeft, Tag } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

const TYPE_COLORS: Record<string, string> = {
  EXAM: "badge-red", TRIP: "badge-purple", EVENT: "badge-blue",
  MEETING: "badge-yellow", HOLIDAY: "badge-green", CLASS: "badge-slate",
};

export interface EventDetailData {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  allDay: boolean;
  type: string;
  location: string | null;
  color: string | null;
  isPublic: boolean;
  requiresPayment: boolean;
  amount: number | null;
  paymentDeadline: string | null;
  class: { name: string } | null;
  teacher: { user: { name: string } } | null;
}

interface Props {
  event: EventDetailData;
  backHref: string;
  paymentStatus?: "PAID" | "PENDING" | null;
  payButton?: React.ReactNode;
}

export function EventDetailView({ event, backHref, paymentStatus, payButton }: Props) {
  const isPast = new Date(event.endDate) < new Date();
  const isDeadlinePassed = event.paymentDeadline && new Date(event.paymentDeadline) < new Date();

  return (
    <div>
      <div className="page-header-back">
        <Link href={backHref} className="btn-sm btn-ghost p-1.5">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] font-bold truncate tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
            {event.title}
          </h1>
          <p className="text-xs mt-0.5 truncate" style={{ color: "hsl(var(--muted-foreground))" }}>
            {formatDate(event.startDate)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`badge ${TYPE_COLORS[event.type] ?? "badge-slate"}`}>{event.type}</span>
          {isPast && <span className="badge badge-slate">Past</span>}
        </div>
      </div>

      <div className="page-body">
        {/* Main card */}
        <div className="card card-body">
          <div className="flex items-start gap-4 mb-5">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: (event.color ?? "#3b82f6") + "22", border: `2px solid ${event.color ?? "#3b82f6"}` }}
            >
              <Calendar className="w-7 h-7" style={{ color: event.color ?? "#3b82f6" }} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold tracking-tight leading-tight" style={{ color: "hsl(var(--foreground))" }}>
                {event.title}
              </h2>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`badge ${TYPE_COLORS[event.type] ?? "badge-slate"}`}>{event.type}</span>
                {event.class && <span className="badge badge-slate">{event.class.name}</span>}
                {isPast && <span className="badge badge-slate opacity-60">Past event</span>}
              </div>
            </div>
          </div>

          {event.description && (
            <div className="rounded-xl p-4 mb-5" style={{ background: "hsl(var(--muted))" }}>
              <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--foreground))" }}>
                {event.description}
              </p>
            </div>
          )}

          {/* Detail rows */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-400" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Date & Time</p>
                <p className="text-sm" style={{ color: "hsl(var(--foreground))" }}>
                  {event.allDay
                    ? formatDate(event.startDate)
                    : `${formatDate(event.startDate)}${event.startDate !== event.endDate ? ` – ${formatDate(event.endDate)}` : ""}`}
                </p>
              </div>
            </div>

            {event.location && (
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-400" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Location</p>
                  <p className="text-sm" style={{ color: "hsl(var(--foreground))" }}>{event.location}</p>
                </div>
              </div>
            )}

            {event.class && (
              <div className="flex items-start gap-3">
                <Users className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-400" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Class</p>
                  <p className="text-sm" style={{ color: "hsl(var(--foreground))" }}>{event.class.name}</p>
                </div>
              </div>
            )}

            {event.teacher && (
              <div className="flex items-start gap-3">
                <Tag className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-400" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Organiser</p>
                  <p className="text-sm" style={{ color: "hsl(var(--foreground))" }}>{event.teacher.user.name}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment card */}
        {event.requiresPayment && event.amount && (
          <div className="card card-body">
            <p className="section-title mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              Event Fee
            </p>

            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  KES {event.amount.toLocaleString()}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Fee per learner
                </p>
              </div>
              {paymentStatus === "PAID" ? (
                <span className="badge badge-green text-sm flex items-center gap-1.5 px-3 py-1.5">
                  <CheckCircle className="w-4 h-4" /> Paid
                </span>
              ) : payButton ? (
                payButton
              ) : null}
            </div>

            {event.paymentDeadline && (
              <p
                className={`text-xs flex items-center gap-1.5 ${isDeadlinePassed && paymentStatus !== "PAID" ? "text-red-500" : ""}`}
                style={isDeadlinePassed && paymentStatus !== "PAID" ? {} : { color: "hsl(var(--muted-foreground))" }}
              >
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                {isDeadlinePassed && paymentStatus !== "PAID" ? "⚠ Payment deadline passed: " : "Pay by: "}
                {formatDate(event.paymentDeadline)}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
