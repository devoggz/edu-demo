import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { formatCurrency } from "@/lib/utils";
import { ParentFeesClient } from "@/components/parent/ParentFeesClient";

export default async function ParentFeesPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const parent = await prisma.parent.findUnique({
    where: { userId: session.user.id },
    include: {
      students: {
        include: {
          class: true,
          fees: { orderBy: { createdAt: "desc" } },
        },
      },
    },
  });
  if (!parent) redirect("/auth/login");

  const allFees = parent.students.flatMap((s) =>
    s.fees.map((f) => ({
      ...f,
      studentName: s.name,
      studentId: s.studentId,
      className: s.class.name,
      dueDate: f.dueDate.toISOString(),
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
    }))
  );

  const totalAmount = allFees.reduce((s, f) => s + f.totalAmount, 0);
  const paidAmount = allFees.reduce((s, f) => s + f.paidAmount, 0);
  const outstanding = totalAmount - paidAmount;

  const userRecord = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { phone: true },
  });
  const parentPhone = userRecord?.phone ?? "";

  return (
    <div>
      <TopNav
        title="Fee Balances"
        subtitle="Pay and track school fee payments"
        userName={session.user.name}
      />
      <div className="page-body">
        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card card-body">
            <p className="text-xs text-slate-400 mb-1">Total Fees</p>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalAmount)}</p>
          </div>
          <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5 shadow-sm">
            <p className="text-xs text-emerald-700 mb-1">Total Paid</p>
            <p className="text-2xl font-bold text-emerald-700">{formatCurrency(paidAmount)}</p>
          </div>
          <div className={`rounded-2xl p-5 shadow-sm border ${outstanding > 0 ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100"}`}>
            <p className={`text-xs mb-1 ${outstanding > 0 ? "text-red-700" : "text-emerald-700"}`}>Outstanding</p>
            <p className={`text-2xl font-bold ${outstanding > 0 ? "text-red-700" : "text-emerald-700"}`}>
              {formatCurrency(outstanding)}
            </p>
          </div>
        </div>

        {/* M-PESA info banner */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.022.505 3.927 1.395 5.594L.058 23.292a.5.5 0 0 0 .65.65l5.698-1.337A11.934 11.934 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-green-800">Pay via M-PESA</p>
            <p className="text-xs text-green-700 mt-0.5">
              Click <strong>Pay Now</strong> on any fee record to initiate an M-PESA STK push to your registered phone number.
              You will receive a prompt to enter your M-PESA PIN to complete payment.
            </p>
          </div>
        </div>

        {/* Interactive fee records */}
        <ParentFeesClient
          fees={allFees}
          parentPhone={parentPhone}
        />
      </div>
    </div>
  );
}
