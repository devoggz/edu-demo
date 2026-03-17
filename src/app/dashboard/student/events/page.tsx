import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { EventsListView } from "@/components/shared/EventsListView";

export default async function StudentEventsPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const profile = await prisma.studentProfile.findUnique({ where: { userId: session.user.id }, include: { student: true } });
  if (!profile) redirect("/auth/login");

  const events = await prisma.calendarEvent.findMany({
    where: { OR: [{ isPublic: true }, { classId: profile.student.classId }] },
    include: { class: true, payments: { where: { studentId: profile.student.id } } },
    orderBy: { startDate: "asc" },
  });

  return (
    <div>
      <TopNav title="Events" subtitle="Upcoming school events" userName={session.user.name} />
      <div className="page-body">
        <EventsListView events={events.map(e => ({ ...e, startDate: e.startDate.toISOString(), endDate: e.endDate.toISOString(), createdAt: e.createdAt.toISOString(), updatedAt: e.updatedAt.toISOString(), paymentDeadline: e.paymentDeadline?.toISOString() ?? null }))} role="student" />
      </div>
    </div>
  );
}
