import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminNewEventForm } from "@/components/admin/AdminNewEventForm";

export default async function AdminNewEventPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const classes = await prisma.class.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center gap-3 sticky top-0 z-30">
        <Link href="/dashboard/admin/calendar" className="p-1.5 rounded-lg hover:bg-slate-100 transition">
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Add Calendar Event</h1>
          <p className="text-sm text-slate-500">Create a school event, trip or exam date</p>
        </div>
      </div>
      <div className="p-6 max-w-2xl">
        <AdminNewEventForm classes={classes} />
      </div>
    </div>
  );
}
