import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { getInitials } from "@/lib/utils";
import Link from "next/link";

export default async function TeacherStudentsPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    include: {
      classes: {
        include: {
          students: {
            include: {
              parent: { include: { user: true } },
              performance: { include: { subject: true } },
            },
          },
        },
      },
    },
  });

  if (!teacher) redirect("/auth/login");

  return (
    <div>
      <TopNav title="My Students" subtitle="Students across all your classes" userName={session.user.name} />
      <div className="page-body">
        {teacher.classes.map((cls) => (
          <div key={cls.id}>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-bold text-slate-900">{cls.name}</h2>
              <span className="badge bg-blue-50 text-blue-700">{cls.students.length} students</span>
            </div>

            <div className="card overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Student ID</th>
                    <th>Gender</th>
                    <th>Parent / Guardian</th>
                    <th>Parent Contact</th>
                    <th>Avg. Score</th>
                  </tr>
                </thead>
                <tbody>
                  {cls.students.map((student) => {
                    const avgScore =
                      student.performance.length > 0
                        ? Math.round(student.performance.reduce((s, p) => s + p.score, 0) / student.performance.length)
                        : null;

                    return (
                      <tr key={student.id} className="hover:bg-slate-50 transition">
                        <td>
                          <Link href={`/dashboard/teacher/students/${student.id}`} className="flex items-center gap-3 hover:opacity-80 transition">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {getInitials(student.name)}
                            </div>
                            <span className="font-medium text-blue-600 hover:underline">{student.name}</span>
                          </Link>
                        </td>
                        <td><code className="text-xs text-slate-500">{student.studentId}</code></td>
                        <td>
                          <span className={`badge ${student.gender === "Male" ? "bg-blue-50 text-blue-700" : "bg-pink-50 text-pink-700"}`}>
                            {student.gender}
                          </span>
                        </td>
                        <td className="text-slate-600">{student.parent.user.name}</td>
                        <td className="text-slate-500 text-xs">{student.parent.user.phone ?? "—"}</td>
                        <td>
                          {avgScore !== null ? (
                            <span className={`badge font-semibold ${avgScore >= 75 ? "bg-green-50 text-green-700" : avgScore >= 50 ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-700"}`}>
                              {avgScore}%
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">No data</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {teacher.classes.length === 0 && (
          <div className="flex flex-col items-center py-16 bg-white rounded-2xl border border-slate-100">
            <p className="text-slate-500">No classes assigned yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
