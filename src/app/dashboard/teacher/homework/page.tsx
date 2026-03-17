import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { formatDate } from "@/lib/utils";
import { ClipboardList, CheckCircle, Clock, Plus } from "lucide-react";
import Link from "next/link";

export default async function TeacherHomeworkPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    include: {
      homework: {
        orderBy: { dueDate: "asc" },
        include: {
          subject: true,
          class: { include: { students: true } },
          submissions: true,
        },
      },
    },
  });

  if (!teacher) redirect("/auth/login");

  const now = new Date();
  const upcoming = teacher.homework.filter((h) => new Date(h.dueDate) >= now);
  const past     = teacher.homework.filter((h) => new Date(h.dueDate) < now);

  return (
    <div>
      <TopNav
        title="Homework"
        subtitle="Assign and track student homework"
        userName={session.user.name}
      />
      <div className="page-body">

        {/* Assign button */}
        <div className="flex justify-end">
          <Link
            href="/dashboard/teacher/homework/new"
            className="btn-md btn-primary"
          >
            <Plus className="w-4 h-4" />
            Assign Homework
          </Link>
        </div>

        {/* Upcoming */}
        <div>
          <h3 className="section-title mb-3">Upcoming ({upcoming.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {upcoming.map((hw) => {
              const submitted = hw.submissions.filter((s) => s.status !== "PENDING").length;
              const total = hw.class.students.length;
              const pct   = total > 0 ? Math.round((submitted / total) * 100) : 0;

              return (
                <Link key={hw.id} href={`/dashboard/teacher/homework/${hw.id}`}>
                  <div className="card card-body hover:shadow-md hover:border-blue-200 transition cursor-pointer h-full">
                    <div className="flex items-start justify-between mb-2">
                      <span className={`badge ${hw.isWeekly ? "bg-violet-50 text-violet-700" : "bg-blue-50 text-blue-700"}`}>
                        {hw.isWeekly ? "Weekly" : "Daily"}
                      </span>
                      <span className="badge bg-emerald-50 text-emerald-700">{hw.subject.name}</span>
                    </div>

                    <h4 className="font-semibold text-slate-900 mb-1">{hw.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">{hw.description}</p>

                    <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                      <span className="badge bg-slate-100 text-slate-600">{hw.class.name}</span>
                    </div>

                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Submissions</span>
                        <span>{submitted}/{total}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-1 text-xs text-orange-600 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      Due {formatDate(hw.dueDate)}
                    </div>
                  </div>
                </Link>
              );
            })}

            {upcoming.length === 0 && (
              <div className="col-span-3 flex flex-col items-center py-12 card card-body">
                <ClipboardList className="w-10 h-10 text-slate-300 mb-3" />
                <p className="text-slate-500">No upcoming homework</p>
              </div>
            )}
          </div>
        </div>

        {/* Past assignments */}
        {past.length > 0 && (
          <div>
            <h3 className="section-title mb-3">Past Assignments ({past.length})</h3>
            <div className="card overflow-hidden">
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Class</th>
                      <th>Subject</th>
                      <th>Due Date</th>
                      <th>Submissions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {past.map((hw) => {
                      const submitted = hw.submissions.filter((s) => s.status !== "PENDING").length;
                      return (
                        <tr key={hw.id}>
                          <td>
                            <Link
                              href={`/dashboard/teacher/homework/${hw.id}`}
                              className="font-medium text-blue-600 hover:underline"
                            >
                              {hw.title}
                            </Link>
                          </td>
                          <td>
                            <span className="badge bg-slate-100 text-slate-600">{hw.class.name}</span>
                          </td>
                          <td>
                            <span className="badge bg-emerald-50 text-emerald-700">{hw.subject.name}</span>
                          </td>
                          <td className="text-slate-500">{formatDate(hw.dueDate)}</td>
                          <td>
                            <div className="flex items-center gap-1 text-slate-600">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                              {submitted}/{hw.class.students.length}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
