import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminNewStudentForm } from "@/components/admin/AdminNewStudentForm";

export default async function AdminNewStudentPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const [classes, parents] = await Promise.all([
    prisma.class.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.parent.findMany({
      orderBy: { user: { name: "asc" } },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  return (
    <div>
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center gap-3 sticky top-0 z-30">
        <Link href="/dashboard/admin/students" className="p-1.5 rounded-lg hover:bg-slate-100 transition">
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Add New Student</h1>
          <p className="text-sm text-slate-500">Enrol a new student into the school</p>
        </div>
      </div>
      <div className="p-6 max-w-2xl">
        <AdminNewStudentForm classes={classes} parents={parents} />
      </div>
    </div>
  );
}
