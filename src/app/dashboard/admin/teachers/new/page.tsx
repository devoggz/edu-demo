import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AdminAddTeacherForm } from "@/components/admin/AdminAddTeacherForm";

export default async function AdminNewTeacherPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const subjects = await prisma.subject.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <div className="page-header-back">
        <Link href="/dashboard/admin/teachers" className="btn-sm btn-ghost p-1.5">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-base font-bold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
            Add New Teacher
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
            Create a teacher account and assign subjects
          </p>
        </div>
      </div>
      <div className="page-body">
        <AdminAddTeacherForm subjects={subjects} />
      </div>
    </div>
  );
}
