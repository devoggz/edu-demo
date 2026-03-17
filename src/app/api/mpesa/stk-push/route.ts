import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────────────────────────────────────
// M-PESA STK Push API (Daraja / Safaricom)
// In production, replace the simulate block with real Daraja API calls.
// Required .env vars for production:
//   MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE,
//   MPESA_PASSKEY, MPESA_CALLBACK_URL, MPESA_ENV (sandbox | production)
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "PARENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    feeId: string;
    amount: number;
    phone: string;
    paymentType: "full" | "partial";
  };

  const { feeId, amount, phone, paymentType } = body;

  if (!feeId || !amount || !phone) {
    return NextResponse.json({ error: "feeId, amount and phone are required" }, { status: 400 });
  }

  if (amount <= 0) {
    return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });
  }

  // Fetch and validate the fee record
  const fee = await prisma.fee.findUnique({
    where: { id: feeId },
    include: { student: { include: { parent: true } } },
  });

  if (!fee) return NextResponse.json({ error: "Fee record not found" }, { status: 404 });

  // Verify the parent owns this fee record
  const parent = await prisma.parent.findUnique({ where: { userId: session.user.id } });
  if (!parent || fee.student.parentId !== parent.id) {
    return NextResponse.json({ error: "Unauthorized – not your fee record" }, { status: 403 });
  }

  const balance = fee.totalAmount - fee.paidAmount;
  if (amount > balance) {
    return NextResponse.json({ error: `Amount exceeds outstanding balance of KES ${balance.toLocaleString()}` }, { status: 400 });
  }

  // ─── M-PESA STK Push ──────────────────────────────────────────
  // In production, call Safaricom Daraja API here.
  // For this demo, we simulate a successful STK push and immediately update.

  const isProduction = process.env.MPESA_ENV === "production";

  if (isProduction && process.env.MPESA_CONSUMER_KEY) {
    // Production: real Daraja STK Push
    try {
      // 1. Get OAuth token
      const credentials = Buffer.from(
        `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
      ).toString("base64");

      const tokenRes = await fetch(
        "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
        { headers: { Authorization: `Basic ${credentials}` } }
      );
      const { access_token } = await tokenRes.json() as { access_token: string };

      // 2. Generate password
      const timestamp = new Date()
        .toISOString()
        .replace(/[^0-9]/g, "")
        .slice(0, 14);
      const password = Buffer.from(
        `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
      ).toString("base64");

      // 3. STK Push
      const stkRes = await fetch(
        "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            BusinessShortCode: process.env.MPESA_SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline",
            Amount: Math.ceil(amount),
            PartyA: phone.replace("+", "").replace(/^0/, "254"),
            PartyB: process.env.MPESA_SHORTCODE,
            PhoneNumber: phone.replace("+", "").replace(/^0/, "254"),
            CallBackURL: process.env.MPESA_CALLBACK_URL,
            AccountReference: fee.student.studentId,
            TransactionDesc: `${fee.term} ${fee.academicYear} school fees`,
          }),
        }
      );

      const stkData = await stkRes.json() as { ResponseCode?: string; CheckoutRequestID?: string; errorMessage?: string };

      if (stkData.ResponseCode !== "0") {
        return NextResponse.json(
          { error: stkData.errorMessage ?? "M-PESA request failed" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `M-PESA prompt sent to ${phone}. Enter your PIN to complete payment.`,
        checkoutRequestId: stkData.CheckoutRequestID,
        simulated: false,
      });
    } catch (err) {
      return NextResponse.json({ error: "Failed to initiate M-PESA payment" }, { status: 500 });
    }
  }

  // ─── DEMO / Sandbox: Simulate immediate successful payment ────
  const newPaidAmount = fee.paidAmount + amount;
  const newBalance = fee.totalAmount - newPaidAmount;
  const newStatus: "PAID" | "PARTIAL" | "PENDING" =
    newBalance <= 0 ? "PAID" : "PARTIAL";

  const updatedFee = await prisma.fee.update({
    where: { id: feeId },
    data: {
      paidAmount: newPaidAmount,
      status: newStatus,
    },
  });

  // Simulate a 2-second M-PESA processing delay via response message
  return NextResponse.json({
    success: true,
    simulated: true,
    message: `M-PESA prompt sent to ${phone}. Payment of KES ${amount.toLocaleString()} processed successfully.`,
    transactionId: `SIM${Date.now()}`,
    fee: {
      id: updatedFee.id,
      paidAmount: updatedFee.paidAmount,
      totalAmount: updatedFee.totalAmount,
      status: updatedFee.status,
      balance: updatedFee.totalAmount - updatedFee.paidAmount,
    },
  });
}
