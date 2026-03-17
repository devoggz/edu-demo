import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { FeeStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "PARENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { eventId: string; studentId: string; phone: string; amount: number };
  const { eventId, studentId, phone, amount } = body;
  if (!eventId || !studentId || !phone || !amount) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  const parent = await prisma.parent.findUnique({ where: { userId: session.user.id } });
  if (!parent) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const event = await prisma.calendarEvent.findUnique({ where: { id: eventId } });
  if (!event || !event.requiresPayment) return NextResponse.json({ error: "Event not found or no payment required" }, { status: 404 });

  // Simulate M-PESA payment (same pattern as fees)
  const payment = await prisma.eventPayment.upsert({
    where: { eventId_studentId: { eventId, studentId } },
    create: { eventId, studentId, parentId: parent.id, amount, status: FeeStatus.PAID, paidAt: new Date(), mpesaRef: `SIM${Date.now()}` },
    update: { status: FeeStatus.PAID, paidAt: new Date(), mpesaRef: `SIM${Date.now()}` },
  });

  return NextResponse.json({
    success: true,
    simulated: true,
    message: `M-PESA prompt sent to ${phone}. Payment of KES ${amount.toLocaleString()} processed.`,
    payment,
  });
}
