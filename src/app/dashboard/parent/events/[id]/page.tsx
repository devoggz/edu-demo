import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { EventDetailView } from "@/components/shared/EventDetailView";
import { ParentEventPayButton } from "@/components/parent/ParentEventPayButton";

export default async function ParentEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/auth/login");

  const parent = await prisma.parent.findUnique({
    where: { userId: session.user.id },
    include: {
      students: { select: { id: true, name: true, classId: true } },
      user: { select: { phone: true } },
    },
  });
  if (!parent) redirect("/auth/login");

  const event = await prisma.calendarEvent.findUnique({
    where: { id },
    include: { class: true, teacher: { include: { user: true } } },
  });
  if (!event) notFound();

  // Check existing payment for any of the parent's students
  const existingPayment = await prisma.eventPayment.findFirst({
    where: { eventId: id, parentId: parent.id },
  });

  const studentIds = parent.students.map(s => s.id);
  const studentNames = Object.fromEntries(parent.students.map(s => [s.id, s.name]));

  const serialised = {
    ...event,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate.toISOString(),
    paymentDeadline: event.paymentDeadline?.toISOString() ?? null,
  };

  return (
    <div>
      <TopNav title="Event Details" userName={session.user.name} />
      <EventDetailView
        event={serialised}
        backHref="/dashboard/parent/events"
        paymentStatus={existingPayment?.status === "PAID" ? "PAID" : existingPayment ? "PENDING" : null}
        payButton={
          event.requiresPayment && event.amount && existingPayment?.status !== "PAID" ? (
            <ParentEventPayButton
              eventId={event.id}
              amount={event.amount}
              studentIds={studentIds}
              studentNames={studentNames}
              parentPhone={parent.user.phone ?? ""}
            />
          ) : undefined
        }
      />
    </div>
  );
}
