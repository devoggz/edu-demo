import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // More precise type definition – allows string booleans which is very common from forms
  const body = await req.json() as {
    title?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    type?: string;
    color?: string;
    classId?: string | null;
    location?: string;
    isPublic?: boolean;
    requiresPayment?: boolean;
    amount?: number | null;
    paymentDeadline?: string | null;
    allDay?: boolean | string | null;     // ← updated: allow string | null
  };

  const {
    title,
    description,
    startDate,
    endDate,
    type,
    classId,
    location,
    color,
    allDay,
  } = body;

  // Required fields validation
  if (!title || !startDate || !endDate) {
    return NextResponse.json(
        { error: "Title, start date and end date are required" },
        { status: 400 }
    );
  }

  // Parse dates safely
  let parsedStartDate: Date;
  let parsedEndDate: Date;

  try {
    parsedStartDate = new Date(startDate);
    parsedEndDate = new Date(endDate);

    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      throw new Error("Invalid date format");
    }
  } catch {
    return NextResponse.json(
        { error: "Invalid startDate or endDate format" },
        { status: 400 }
    );
  }

  // Normalize allDay to boolean (fixes TS2367 and handles common string values)
  const isAllDay =
      allDay === true ||
      allDay === "true" ||
      allDay === "True" ||
      String(allDay).toLowerCase() === "true";

  const event = await prisma.calendarEvent.create({
    data: {
      title,
      description: description ?? null,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      type: type || "EVENT",
      classId: classId ?? null,
      location: location ?? null,
      color: color || "#3b82f6",
      allDay: isAllDay,
    },
  });

  return NextResponse.json(event, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const events = await prisma.calendarEvent.findMany({
    orderBy: { startDate: "asc" },
    include: { class: true },
  });

  return NextResponse.json(events);
}