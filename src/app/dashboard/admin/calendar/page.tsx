import { prisma } from "@/lib/prisma";
import { TopNav } from "@/components/shared/TopNav";
import { auth } from "@/auth";
import { TeacherCalendarWidget } from "@/components/teacher/TeacherCalendarWidget";
import Link from "next/link";

export default async function AdminCalendarPage() {
  const session = await auth();
  const events = await prisma.calendarEvent.findMany({
    orderBy: { startDate: "asc" },
    include: { class: true, teacher: { include: { user: true } } },
  });

  return (
    <div>
      <TopNav title="School Calendar" subtitle="All events, trips and class schedules" userName={session?.user.name ?? ""} />
      <div className="page-body">
        <div className="flex justify-end mb-4">
          <Link href="/dashboard/admin/calendar/new" className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-blue-700 transition">
            + Add Event
          </Link>
        </div>

        {/* Upcoming events list */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <TeacherCalendarWidget events={events} />
          </div>

          <div className="space-y-3">
            <h3 className="section-title">All Events</h3>
            {events.map((evt) => (
              <div
                key={evt.id}
                className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex gap-3"
                style={{ borderLeft: `3px solid ${evt.color ?? "#3b82f6"}` }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{evt.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(evt.startDate).toLocaleDateString("en-KE", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="text-xs font-medium px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: `${evt.color}22`, color: evt.color ?? "#3b82f6" }}
                    >
                      {evt.type}
                    </span>
                    {evt.class && <span className="text-xs text-slate-400">{evt.class.name}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
