import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { EventsListView } from "@/components/shared/EventsListView";

export default async function TeacherEventsPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id }, select: { classes: { select: { id: true } } } });
  const classIds = teacher?.classes.map(c => c.id) ?? [];

  const events = await prisma.calendarEvent.findMany({
    where: { OR: [{ isPublic: true }, { classId: { in: classIds } }, { teacherId: (await prisma.teacher.findUnique({ where: { userId: session.user.id } }))?.id }] },
    include: { class: true, payments: true },
    orderBy: { startDate: "asc" },
  });

  return (
    <div>
      <TopNav title="Events" subtitle="Upcoming school events" userName={session.user.name} />
      <div className="page-body">
        <EventsListView events={events.map(e => ({ ...e, startDate: e.startDate.toISOString(), endDate: e.endDate.toISOString(), createdAt: e.createdAt.toISOString(), updatedAt: e.updatedAt.toISOString(), paymentDeadline: e.paymentDeadline?.toISOString() ?? null }))} role="teacher" />
      </div>
    </div>
  );
}
