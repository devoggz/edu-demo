import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { EventsListView } from "@/components/shared/EventsListView";

export default async function ParentEventsPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const parent = await prisma.parent.findUnique({
    where: { userId: session.user.id },
    include: { students: { select: { id: true, classId: true } } },
  });
  if (!parent) redirect("/auth/login");

  const classIds = parent.students.map(s => s.classId);
  const studentIds = parent.students.map(s => s.id);

  const events = await prisma.calendarEvent.findMany({
    where: { OR: [{ isPublic: true }, { classId: { in: classIds } }] },
    include: { class: true, payments: { where: { parentId: parent.id } } },
    orderBy: { startDate: "asc" },
  });

  return (
    <div>
      <TopNav title="Events" subtitle="School events and activities" userName={session.user.name} />
      <div className="page-body">
        <EventsListView
          events={events.map(e => ({ ...e, startDate: e.startDate.toISOString(), endDate: e.endDate.toISOString(), createdAt: e.createdAt.toISOString(), updatedAt: e.updatedAt.toISOString(), paymentDeadline: e.paymentDeadline?.toISOString() ?? null }))}
          role="parent"
          parentPhone={await prisma.user.findUnique({ where: { id: session.user.id }, select: { phone: true } }).then(u => u?.phone ?? "")}
          studentIds={studentIds}
          parentId={parent.id}
        />
      </div>
    </div>
  );
}
