"use client";

import { useState } from "react";
import { formatCurrency, formatDate, getFeeStatusColor, getInitials } from "@/lib/utils";
import { Loader2, CheckCircle, AlertCircle, Smartphone, X, CreditCard } from "lucide-react";

interface FeeRecord {
  id: string;
  term: string;
  academicYear: string;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  status: string;
  description: string | null;
  studentName: string;
  studentId: string;
  className: string;
}

interface PaymentState {
  step: "idle" | "confirm" | "processing" | "success" | "error";
  fee: FeeRecord | null;
  paymentType: "full" | "partial";
  customAmount: string;
  message: string;
  transactionId: string;
}

function MpesaModal({
  fee,
  parentPhone,
  onClose,
  onSuccess,
}: {
  fee: FeeRecord;
  parentPhone: string;
  onClose: () => void;
  onSuccess: (updatedFee: { id: string; paidAmount: number; totalAmount: number; status: string; balance: number }) => void;
}) {
  const balance = fee.totalAmount - fee.paidAmount;
  const [paymentType, setPaymentType] = useState<"full" | "partial">("full");
  const [customAmount, setCustomAmount] = useState("");
  const [phone, setPhone] = useState(parentPhone || "");
  const [step, setStep] = useState<"confirm" | "processing" | "success" | "error">("confirm");
  const [message, setMessage] = useState("");
  const [transactionId, setTransactionId] = useState("");

  const amount = paymentType === "full" ? balance : Number(customAmount);
  const isValidAmount = amount > 0 && amount <= balance;
  const isValidPhone = /^(\+254|254|07|01)\d{8,9}$/.test(phone.replace(/\s/g, ""));

  const handlePay = async () => {
    if (!isValidAmount || !isValidPhone) return;
    setStep("processing");

    try {
      const res = await fetch("/api/mpesa/stk-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feeId: fee.id,
          amount,
          phone: phone.replace(/\s/g, ""),
          paymentType,
        }),
      });

      const data = await res.json() as {
        success?: boolean;
        message?: string;
        transactionId?: string;
        error?: string;
        fee?: { id: string; paidAmount: number; totalAmount: number; status: string; balance: number };
        simulated?: boolean;
      };

      if (res.ok && data.success) {
        setTransactionId(data.transactionId ?? "");
        setMessage(data.message ?? "Payment processed successfully");
        setStep("success");
        if (data.fee) onSuccess(data.fee);
      } else {
        setMessage(data.error ?? "Payment failed. Please try again.");
        setStep("error");
      }
    } catch {
      setMessage("Network error. Please check your connection and try again.");
      setStep("error");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md overflow-hidden max-h-[90vh] overflow-y-auto transition-colors" style={{ background: "hsl(var(--card))" }}>
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.022.505 3.927 1.395 5.594L.058 23.292a.5.5 0 0 0 .65.65l5.698-1.337A11.934 11.934 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
              </svg>
            </div>
            <div>
              <p className="text-white font-bold">Pay via M-PESA</p>
              <p className="text-green-100 text-xs">{fee.studentName} · {fee.term} {fee.academicYear}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Confirm step */}
          {step === "confirm" && (
            <>
              {/* Fee summary */}
              <div className="rounded-2xl p-4" style={{ background: "hsl(var(--muted))" }}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">Total Fees</span>
                  <span className="font-semibold">{formatCurrency(fee.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">Already Paid</span>
                  <span className="font-semibold text-green-600">{formatCurrency(fee.paidAmount)}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between">
                  <span className="text-sm font-semibold text-slate-700">Outstanding Balance</span>
                  <span className="font-bold text-red-600">{formatCurrency(balance)}</span>
                </div>
              </div>

              {/* Payment type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Payment Option</label>
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaymentType("full")}
                    className={`py-3 px-4 rounded-xl border-2 text-sm font-semibold transition ${
                      paymentType === "full"
                        ? "border-green-600 bg-green-50 text-green-700"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <div>Full Payment</div>
                    <div className="text-xs font-normal mt-0.5">{formatCurrency(balance)}</div>
                  </button>
                  <button
                    onClick={() => setPaymentType("partial")}
                    className={`py-3 px-4 rounded-xl border-2 text-sm font-semibold transition ${
                      paymentType === "partial"
                        ? "border-green-600 bg-green-50 text-green-700"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <div>Partial Payment</div>
                    <div className="text-xs font-normal mt-0.5">Enter amount</div>
                  </button>
                </div>
              </div>

              {/* Partial amount input */}
              {paymentType === "partial" && (
                <div>
                  <label className="label">Amount (KES)</label>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder={`Max: ${balance.toLocaleString()}`}
                    min={1}
                    max={balance}
                    className="input focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  {customAmount && Number(customAmount) > balance && (
                    <p className="text-xs text-red-500 mt-1">Amount exceeds outstanding balance</p>
                  )}
                </div>
              )}

              {/* Phone number */}
              <div>
                <label className="label">
                  <Smartphone className="w-3.5 h-3.5 inline mr-1" />
                  M-PESA Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 0712 345 678"
                  className="input focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <p className="text-xs text-slate-400 mt-1">You will receive an M-PESA PIN prompt on this number</p>
              </div>

              {/* Pay amount summary */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex justify-between items-center">
                <span className="text-sm text-green-700 font-medium">Amount to Pay</span>
                <span className="text-lg font-bold text-green-700">
                  {isValidAmount ? formatCurrency(amount) : "—"}
                </span>
              </div>

              <button
                onClick={handlePay}
                disabled={!isValidAmount || !isValidPhone}
                className="btn-lg btn-success w-full"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.022.505 3.927 1.395 5.594L.058 23.292a.5.5 0 0 0 .65.65l5.698-1.337A11.934 11.934 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
                </svg>
                Send M-PESA Prompt
              </button>
            </>
          )}

          {/* Processing step */}
          {step === "processing" && (
            <div className="py-10 text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-lg">Processing Payment</p>
                <p className="text-sm text-slate-500 mt-1">Sending M-PESA prompt to <strong>{phone}</strong></p>
                <p className="text-xs text-slate-400 mt-2">Check your phone and enter your M-PESA PIN</p>
              </div>
            </div>
          )}

          {/* Success step */}
          {step === "success" && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-9 h-9 text-green-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-lg">Payment Successful!</p>
                <p className="text-sm text-slate-600 mt-1">{message}</p>
                {transactionId && (
                  <p className="text-xs text-slate-400 mt-2">
                    Transaction ID: <code className="bg-slate-100 px-1.5 py-0.5 rounded">{transactionId}</code>
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-1">You will receive an M-PESA confirmation SMS shortly.</p>
              </div>
              <button
                onClick={onClose}
                className="btn-md btn-success w-full"
              >
                Done
              </button>
            </div>
          )}

          {/* Error step */}
          {step === "error" && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-9 h-9 text-red-500" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-lg">Payment Failed</p>
                <p className="text-sm text-slate-500 mt-1">{message}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStep("confirm")}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition"
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-slate-800 text-white font-medium rounded-xl hover:bg-slate-900 transition"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ParentFeesClient({
  fees: initialFees,
  parentPhone,
}: {
  fees: FeeRecord[];
  parentPhone: string;
}) {
  const [fees, setFees] = useState(initialFees);
  const [activeFee, setActiveFee] = useState<FeeRecord | null>(null);

  const handlePaymentSuccess = (updated: { id: string; paidAmount: number; totalAmount: number; status: string; balance: number }) => {
    setFees((prev) =>
      prev.map((f) =>
        f.id === updated.id
          ? { ...f, paidAmount: updated.paidAmount, status: updated.status }
          : f
      )
    );
  };

  // Group by student
  const byStudent: Record<string, { name: string; studentId: string; className: string; fees: FeeRecord[] }> = {};
  for (const fee of fees) {
    if (!byStudent[fee.studentId]) {
      byStudent[fee.studentId] = {
        name: fee.studentName,
        studentId: fee.studentId,
        className: fee.className,
        fees: [],
      };
    }
    byStudent[fee.studentId].fees.push(fee);
  }

  return (
    <>
      {Object.values(byStudent).map((student) => {
        const totalPaid = student.fees.reduce((s, f) => s + f.paidAmount, 0);
        const totalDue = student.fees.reduce((s, f) => s + f.totalAmount, 0);

        return (
          <div key={student.studentId} className="card overflow-hidden">
            {/* Student header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {getInitials(student.name)}
                </div>
                <div>
                  <h3 className="section-title">{student.name}</h3>
                  <p className="text-xs text-slate-500">{student.className} · {student.studentId}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800">{formatCurrency(totalPaid)} paid</p>
                <p className="text-xs text-slate-400">of {formatCurrency(totalDue)}</p>
              </div>
            </div>

            {/* Fee records */}
            <div className="divide-y divide-slate-50">
              {student.fees.map((fee) => {
                const balance = fee.totalAmount - fee.paidAmount;
                const pct = Math.round((fee.paidAmount / fee.totalAmount) * 100);
                const isPaid = fee.status === "PAID";
                const isOverdue = !isPaid && new Date(fee.dueDate) < new Date();

                return (
                  <div key={fee.id} className="p-4 hover:bg-slate-50/50 transition">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-slate-800">{fee.term} {fee.academicYear}</p>
                          <span className={`badge text-xs ${getFeeStatusColor(fee.status)}`}>{fee.status}</span>
                          {isOverdue && (
                            <span className="badge bg-red-50 text-red-600 text-xs">OVERDUE</span>
                          )}
                        </div>
                        {fee.description && (
                          <p className="text-xs text-slate-500 mb-2">{fee.description}</p>
                        )}
                        <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                          <div>
                            <p className="text-slate-400">Total</p>
                            <p className="font-semibold text-slate-700">{formatCurrency(fee.totalAmount)}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Paid</p>
                            <p className="font-semibold text-green-600">{formatCurrency(fee.paidAmount)}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Balance</p>
                            <p className={`font-semibold ${balance > 0 ? "text-red-600" : "text-green-600"}`}>
                              {formatCurrency(balance)}
                            </p>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${isPaid ? "bg-green-500" : "bg-blue-500"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400">{pct}%</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Due {formatDate(fee.dueDate)}
                        </p>
                      </div>

                      {/* Pay button */}
                      {!isPaid && (
                        <button
                          onClick={() => setActiveFee(fee)}
                          className="flex items-center gap-1.5 px-4 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition flex-shrink-0"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.022.505 3.927 1.395 5.594L.058 23.292a.5.5 0 0 0 .65.65l5.698-1.337A11.934 11.934 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
                          </svg>
                          Pay Now
                        </button>
                      )}
                      {isPaid && (
                        <div className="flex items-center gap-1.5 px-4 py-2.5 bg-green-50 text-green-600 text-sm font-medium rounded-xl flex-shrink-0">
                          <CheckCircle className="w-4 h-4" />
                          Cleared
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* M-PESA Modal */}
      {activeFee && (
        <MpesaModal
          fee={activeFee}
          parentPhone={parentPhone}
          onClose={() => setActiveFee(null)}
          onSuccess={(updated) => {
            handlePaymentSuccess(updated);
            setActiveFee(null);
          }}
        />
      )}
    </>
  );
}
