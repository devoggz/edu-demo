import { getInitials } from "@/lib/utils";
import Link from "next/link";

interface Student {
  id: string;
  name: string;
  studentId: string;
  gender: string;
  createdAt: Date;
  class: { name: string };
  parent: { user: { name: string } };
}

export function RecentStudents({ students }: { students: Student[] }) {
  return (
    <div className="card card-body">
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title">Recently Enrolled</h3>
        <Link href="/dashboard/admin/students" className="text-xs text-blue-600 hover:underline">View all</Link>
      </div>

      <div className="space-y-2">
        {students.map((s) => (
          <Link key={s.id} href={`/dashboard/admin/students/${s.id}`} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition block">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {getInitials(s.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">{s.name}</p>
              <p className="text-xs text-slate-500">{s.class.name} · {s.studentId}</p>
            </div>
            <div className="text-right">
              <span className={`badge ${s.gender === "Male" ? "bg-blue-50 text-blue-700" : "bg-pink-50 text-pink-700"}`}>
                {s.gender}
              </span>
              <p className="text-xs text-slate-400 mt-1">{s.parent.user.name}</p>
            </div>
          </Link>
        ))}
        {students.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">No students enrolled yet</p>
        )}
      </div>
    </div>
  );
}
