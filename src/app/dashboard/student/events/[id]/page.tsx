import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { EventDetailView } from "@/components/shared/EventDetailView";

export default async function StudentEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/auth/login");

  const event = await prisma.calendarEvent.findUnique({
    where: { id },
    include: { class: true, teacher: { include: { user: true } } },
  });
  if (!event) notFound();

  // Verify student can see this event
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    include: { student: true },
  });
  if (!profile) redirect("/auth/login");
  if (!event.isPublic && event.classId !== profile.student.classId) notFound();

  return (
    <div>
      <TopNav title="Event Details" userName={session.user.name} />
      <EventDetailView
        event={{ ...event, startDate: event.startDate.toISOString(), endDate: event.endDate.toISOString(), paymentDeadline: event.paymentDeadline?.toISOString() ?? null }}
        backHref="/dashboard/student/events"
      />
    </div>
  );
}
