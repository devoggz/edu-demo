import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { feeId: string };
  const { feeId } = body;
  if (!feeId) {
    return NextResponse.json({ error: "feeId required" }, { status: 400 });
  }

  const fee = await prisma.fee.findUnique({
    where: { id: feeId },
    include: {
      student: {
        include: {
          parent: {
            include: { user: true },
          },
        },
      },
    },
  });

  if (!fee) {
    return NextResponse.json({ error: "Fee not found" }, { status: 404 });
  }

  const balance = fee.totalAmount - fee.paidAmount;
  if (balance <= 0) {
    return NextResponse.json({ error: "No outstanding balance" }, { status: 400 });
  }

  // Update prompt tracking
  const updatedFee = await prisma.fee.update({
    where: { id: feeId },
    data: {
      lastPromptedAt: new Date(),
      promptCount: { increment: 1 },
    },
  });

  // Get sender (current admin user)
  const sender = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });

  if (!sender) {
    console.error(`Authenticated user not found in database: ${session.user.email}`);
    return NextResponse.json(
        { error: "Internal server error - sender account not found" },
        { status: 500 },
    );
  }

  // Send notification to parent
  const parentUser = fee.student.parent.user;

  const notification = await prisma.notification.create({
    data: {
      title: `Fee Payment Reminder – ${fee.student.name}`,
      message: `Dear ${parentUser.name}, this is a reminder that ${fee.student.name} has an outstanding fee balance of KES ${balance.toLocaleString()} for ${fee.term} ${fee.academicYear}. Please make payment at your earliest convenience. Paybill: 123456, Account: ${fee.student.studentId}.`,
      type: "PAYMENT_PROMPT",
      senderId: sender.id,
      linkType: "FEE",
      linkId: feeId,
    },
  });

  await prisma.userNotification.create({
    data: {
      userId: parentUser.id,
      notificationId: notification.id,
    },
  });

  return NextResponse.json({
    success: true,
    message: `Payment prompt sent to ${parentUser.name}`,
    promptCount: updatedFee.promptCount,
  });
}