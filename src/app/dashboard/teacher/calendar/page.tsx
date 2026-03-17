import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { TeacherCalendarWidget } from "@/components/teacher/TeacherCalendarWidget";

export default async function TeacherCalendarPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    include: {
      calendarEvents: { orderBy: { startDate: "asc" } },
      classes: {
        include: {
          calendarEvents: { orderBy: { startDate: "asc" } },
        },
      },
    },
  });

  if (!teacher) redirect("/auth/login");

  // Merge teacher + class events
  const allEvents = [
    ...teacher.calendarEvents,
    ...teacher.classes.flatMap((c) => c.calendarEvents),
  ];

  // Deduplicate by id
  const seen = new Set<string>();
  const events = allEvents.filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });

  return (
    <div>
      <TopNav title="My Calendar" subtitle="Classes, events and school activities" userName={session.user.name} />
      <div className="page-body">
        <div className="max-w-3xl">
          <TeacherCalendarWidget events={events} />
        </div>
      </div>
    </div>
  );
}
