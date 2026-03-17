import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AdminNewEventFormV2 } from "@/components/admin/AdminNewEventFormV2";

export default async function AdminNewEventPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");
  const classes = await prisma.class.findMany({ orderBy: { name: "asc" } });
  return (
    <div>
      <div className="page-header-back">
        <Link href="/dashboard/admin/events" className="btn-sm btn-ghost p-1.5">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-base font-bold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>Create Event</h1>
          <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Add a new school event to the calendar</p>
        </div>
      </div>
      <div className="page-body">
        <AdminNewEventFormV2 classes={classes.map(c => ({ id: c.id, name: c.name }))} />
      </div>
    </div>
  );
}
