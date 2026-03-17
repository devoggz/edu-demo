import { prisma } from "@/lib/prisma";
import { TopNav } from "@/components/shared/TopNav";
import { auth } from "@/auth";
import { getInitials, formatDate } from "@/lib/utils";
import { GraduationCap, Search } from "lucide-react";
import Link from "next/link";

export default async function AdminStudentsPage() {
  const session = await auth();
  const students = await prisma.student.findMany({
    orderBy: { name: "asc" },
    include: {
      class: true,
      parent: { include: { user: true } },
      fees: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return (
    <div>
      <TopNav title="Students" subtitle={`${students.length} total enrolled`} userName={session?.user.name ?? ""} />
      <div className="page-body">
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search students..."
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none w-64"
              />
            </div>
            <Link href="/dashboard/admin/students/new" className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-blue-700 transition">
              + Add Student
            </Link>
          </div>

          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>ID</th>
                  <th>Class</th>
                  <th>Gender</th>
                  <th>Parent / Guardian</th>
                  <th>Fee Status</th>
                  <th>Enrolled</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const fee = s.fees[0];
                  const feeStatus = fee?.status ?? "—";
                  const feeColor: Record<string, string> = {
                    PAID: "bg-green-50 text-green-700",
                    PENDING: "bg-yellow-50 text-yellow-700",
                    OVERDUE: "bg-red-50 text-red-700",
                    PARTIAL: "bg-blue-50 text-blue-700",
                  };
                  return (
                    <tr key={s.id} className="hover:bg-slate-50 transition">
                      <td>
                        <Link href={`/dashboard/admin/students/${s.id}`} className="flex items-center gap-3 hover:opacity-80 transition">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {getInitials(s.name)}
                          </div>
                          <span className="font-medium text-blue-600 hover:underline">{s.name}</span>
                        </Link>
                      </td>
                      <td><span className="font-mono text-xs text-slate-500">{s.studentId}</span></td>
                      <td><span className="badge bg-slate-100 text-slate-700">{s.class.name}</span></td>
                      <td>
                        <span className={`badge ${s.gender === "Male" ? "bg-blue-50 text-blue-700" : "bg-pink-50 text-pink-700"}`}>
                          {s.gender}
                        </span>
                      </td>
                      <td className="text-slate-600">{s.parent.user.name}</td>
                      <td>
                        <span className={`badge ${feeColor[feeStatus] ?? "bg-slate-50 text-slate-500"}`}>{feeStatus}</span>
                      </td>
                      <td className="text-slate-500">{formatDate(s.enrollmentDate)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {students.length === 0 && (
            <div className="flex flex-col items-center py-16">
              <GraduationCap className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">No students found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
