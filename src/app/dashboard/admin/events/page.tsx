import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import Link from "next/link";
import { Plus, Calendar, MapPin, DollarSign, Users } from "lucide-react";
import { formatDate } from "@/lib/utils";

const TYPE_COLORS: Record<string, string> = {
  EXAM:    "badge-red",
  TRIP:    "badge-purple",
  EVENT:   "badge-blue",
  MEETING: "badge-yellow",
  HOLIDAY: "badge-green",
  CLASS:   "badge-slate",
};

export default async function AdminEventsPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const now = new Date();
  const events = await prisma.calendarEvent.findMany({
    include: { class: true, payments: true },
    orderBy: { startDate: "asc" },
  });

  const upcoming = events.filter(e => new Date(e.endDate) >= now);
  const past     = events.filter(e => new Date(e.endDate) < now);

  return (
    <div>
      <TopNav title="School Events" subtitle="Manage all school events and activities" userName={session.user.name} />
      <div className="page-body">
        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
            {upcoming.length} upcoming · {past.length} past
          </p>
          <Link href="/dashboard/admin/events/new" className="btn-md btn-primary">
            <Plus className="w-4 h-4" /> New Event
          </Link>
        </div>

        {/* Upcoming */}
        <div>
          <p className="section-title mb-3">Upcoming Events</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {upcoming.map(evt => {
              const paidCount = evt.payments.filter(p => p.status === "PAID").length;
              return (
                <Link key={evt.id} href={`/dashboard/admin/events/${evt.id}`}>
                  <div className="card card-body hover:shadow-md transition-shadow cursor-pointer group">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: evt.color ?? "#3b82f6" + "25", borderLeft: `3px solid ${evt.color ?? "#3b82f6"}` }}>
                        <Calendar className="w-5 h-5" style={{ color: evt.color ?? "#3b82f6" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate group-hover:text-blue-600 transition-colors" style={{ color: "hsl(var(--foreground))" }}>{evt.title}</p>
                        <span className={`badge ${TYPE_COLORS[evt.type] ?? "badge-slate"} text-[10px] mt-1`}>{evt.type}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{formatDate(evt.startDate)}</span>
                      </div>
                      {evt.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{evt.location}</span>
                        </div>
                      )}
                      {evt.class && (
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{evt.class.name}</span>
                        </div>
                      )}
                      {evt.requiresPayment && evt.amount && (
                        <div className="flex items-center justify-between pt-2 mt-2 border-t" style={{ borderColor: "hsl(var(--border))" }}>
                          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <DollarSign className="w-3.5 h-3.5" />
                            KES {evt.amount.toLocaleString()}
                          </div>
                          {evt.payments.length > 0 && (
                            <span className="text-[10px]">{paidCount}/{evt.payments.length} paid</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
            {upcoming.length === 0 && (
              <div className="col-span-3 card card-body text-center py-12">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>No upcoming events</p>
                <Link href="/dashboard/admin/events/new" className="btn-md btn-primary inline-flex mt-4">
                  <Plus className="w-4 h-4" /> Create First Event
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Past */}
        {past.length > 0 && (
          <div>
            <p className="section-title mb-3">Past Events</p>
            <div className="card overflow-hidden">
              <div className="table-scroll">
                <table className="data-table">
                  <thead><tr><th>Event</th><th>Type</th><th>Date</th><th>Class</th><th>Payment</th></tr></thead>
                  <tbody>
                    {past.slice(0, 10).map(evt => (
                      <tr key={evt.id}>
                        <td>
                          <Link href={`/dashboard/admin/events/${evt.id}`} className="font-medium text-blue-600 hover:underline">{evt.title}</Link>
                        </td>
                        <td><span className={`badge ${TYPE_COLORS[evt.type] ?? "badge-slate"}`}>{evt.type}</span></td>
                        <td className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>{formatDate(evt.startDate)}</td>
                        <td className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>{evt.class?.name ?? "All"}</td>
                        <td>
                          {evt.requiresPayment && evt.amount
                            ? <span className="badge badge-green text-[10px]">KES {evt.amount.toLocaleString()}</span>
                            : <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Free</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
