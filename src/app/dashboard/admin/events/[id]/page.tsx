import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin, DollarSign, Users, Clock, CheckCircle, Pencil, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { AdminEventActions } from "@/components/admin/AdminEventActions";

const TYPE_COLORS: Record<string, string> = {
  EXAM: "badge-red", TRIP: "badge-purple", EVENT: "badge-blue",
  MEETING: "badge-yellow", HOLIDAY: "badge-green", CLASS: "badge-slate",
};

export default async function AdminEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/auth/login");

  const event = await prisma.calendarEvent.findUnique({
    where: { id },
    include: {
      class: true,
      teacher: { include: { user: true } },
      payments: {
        include: {
          student: true,
          parent: { include: { user: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!event) notFound();

  const paidCount    = event.payments.filter(p => p.status === "PAID").length;
  const totalCollected = event.payments.filter(p => p.status === "PAID").reduce((s, p) => s + p.amount, 0);
  const isPast       = new Date(event.endDate) < new Date();
  const isDeadlinePassed = event.paymentDeadline && new Date(event.paymentDeadline) < new Date();

  return (
    <div>
      <div className="page-header-back">
        <Link href="/dashboard/admin/events" className="btn-sm btn-ghost p-1.5">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] font-bold truncate tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
            {event.title}
          </h1>
          <p className="text-xs mt-0.5 truncate" style={{ color: "hsl(var(--muted-foreground))" }}>
            {formatDate(event.startDate)}{event.startDate !== event.endDate ? ` – ${formatDate(event.endDate)}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`badge ${TYPE_COLORS[event.type] ?? "badge-slate"}`}>{event.type}</span>
          {isPast && <span className="badge badge-slate">Past</span>}
        </div>
      </div>

      <div className="page-body">
        {/* Event header card */}
        <div className="card card-body">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: (event.color ?? "#3b82f6") + "22", border: `2px solid ${event.color ?? "#3b82f6"}` }}>
              <Calendar className="w-6 h-6" style={{ color: event.color ?? "#3b82f6" }} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
                {event.title}
              </h2>
              {event.description && (
                <p className="text-sm mt-1.5 leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {event.description}
                </p>
              )}
            </div>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t" style={{ borderColor: "hsl(var(--border))" }}>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>Start</p>
              <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>{formatDate(event.startDate)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>End</p>
              <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>{formatDate(event.endDate)}</p>
            </div>
            {event.location && (
              <div>
                <p className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>Location</p>
                <p className="text-sm font-semibold flex items-center gap-1" style={{ color: "hsl(var(--foreground))" }}>
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />{event.location}
                </p>
              </div>
            )}
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>Audience</p>
              <p className="text-sm font-semibold flex items-center gap-1" style={{ color: "hsl(var(--foreground))" }}>
                <Users className="w-3.5 h-3.5 text-slate-400" />
                {event.class ? event.class.name : "All classes"}
              </p>
            </div>
            {event.teacher && (
              <div>
                <p className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>Organiser</p>
                <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>{event.teacher.user.name}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>Visibility</p>
              <span className={`badge ${event.isPublic ? "badge-green" : "badge-slate"}`}>
                {event.isPublic ? "Public" : "Staff only"}
              </span>
            </div>
          </div>
        </div>

        {/* Payment section */}
        {event.requiresPayment && event.amount && (
          <div className="card card-body">
            <p className="section-title mb-4">Payment Details</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: "Fee per learner", value: `KES ${event.amount.toLocaleString()}`, color: "text-emerald-600" },
                { label: "Paid",            value: paidCount,                               color: "text-emerald-600" },
                { label: "Pending",         value: event.payments.length - paidCount,        color: "text-amber-600" },
                { label: "Total collected", value: `KES ${totalCollected.toLocaleString()}`, color: "text-blue-600" },
              ].map(s => (
                <div key={s.label} className="card card-body">
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{s.label}</p>
                </div>
              ))}
            </div>

            {event.paymentDeadline && (
              <p className={`text-xs mb-4 flex items-center gap-1.5 ${isDeadlinePassed ? "text-red-500" : ""}`}
                style={isDeadlinePassed ? {} : { color: "hsl(var(--muted-foreground))" }}>
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                Payment deadline: {formatDate(event.paymentDeadline)}
                {isDeadlinePassed && " — deadline passed"}
              </p>
            )}

            {/* Payments table */}
            {event.payments.length > 0 && (
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr><th>Student</th><th>Parent</th><th>Amount</th><th>Status</th><th>Paid At</th></tr>
                  </thead>
                  <tbody>
                    {event.payments.map(p => (
                      <tr key={p.id}>
                        <td className="font-medium" style={{ color: "hsl(var(--foreground))" }}>{p.student.name}</td>
                        <td style={{ color: "hsl(var(--muted-foreground))" }}>{p.parent.user.name}</td>
                        <td className="font-semibold text-emerald-600">KES {p.amount.toLocaleString()}</td>
                        <td>
                          {p.status === "PAID"
                            ? <span className="badge badge-green flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" />Paid</span>
                            : <span className="badge badge-yellow">{p.status}</span>
                          }
                        </td>
                        <td style={{ color: "hsl(var(--muted-foreground))" }}>
                          {p.paidAt ? formatDate(p.paidAt) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <AdminEventActions eventId={event.id} />
      </div>
    </div>
  );
}
