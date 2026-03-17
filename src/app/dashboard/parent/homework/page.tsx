import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { formatDate, getInitials } from "@/lib/utils";
import { BookOpen, Clock, AlertCircle, CheckCircle } from "lucide-react";

export default async function ParentHomeworkPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const parent = await prisma.parent.findUnique({
    where: { userId: session.user.id },
    include: {
      students: {
        include: {
          class: {
            include: {
              homework: {
                orderBy: { dueDate: "asc" },
                include: { subject: true, teacher: { include: { user: true } } },
              },
            },
          },
        },
      },
    },
  });
  if (!parent) redirect("/auth/login");

  return (
    <div>
      <TopNav title="Homework" subtitle="Stay on top of assignments" userName={session.user.name} />
      <div className="page-body">
        {parent.students.map((student) => {
          const upcoming = student.class.homework.filter((h) => new Date(h.dueDate) >= new Date());
          const past = student.class.homework.filter((h) => new Date(h.dueDate) < new Date());

          return (
            <div key={student.id}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {getInitials(student.name)}
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">{student.name}</h2>
                  <p className="text-xs text-slate-500">{student.class.name}</p>
                </div>
                <span className="badge bg-orange-50 text-orange-700 ml-2">{upcoming.length} due</span>
              </div>

              {upcoming.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  {upcoming.map((hw) => {
                    const isUrgent = new Date(hw.dueDate).getTime() - Date.now() < 24 * 60 * 60 * 1000;
                    return (
                      <div key={hw.id} className={`bg-white rounded-2xl border p-4 shadow-sm ${isUrgent ? "border-red-200 bg-red-50/30" : "border-slate-100"}`}>
                        <div className="flex items-start justify-between mb-2">
                          <span className="badge bg-blue-50 text-blue-700 text-xs">{hw.subject.name}</span>
                          <span className={`badge text-xs ${hw.isWeekly ? "bg-violet-50 text-violet-700" : "bg-slate-100 text-slate-600"}`}>
                            {hw.isWeekly ? "Weekly" : "Daily"}
                          </span>
                        </div>
                        <h4 className="font-semibold text-slate-900 mb-1">{hw.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2 mb-3">{hw.description}</p>
                        <div className="flex items-center justify-between">
                          <div className={`flex items-center gap-1 text-xs font-medium ${isUrgent ? "text-red-600" : "text-orange-600"}`}>
                            {isUrgent ? <AlertCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                            Due {formatDate(hw.dueDate)}
                          </div>
                          <p className="text-xs text-slate-400">{hw.teacher.user.name}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {upcoming.length === 0 && (
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl mb-4">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-green-700 font-medium">All caught up! No pending homework.</p>
                </div>
              )}

              {past.length > 0 && (
                <div className="card overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-600">Previous Assignments ({past.length})</p>
                  </div>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Subject</th>
                        <th>Due Date</th>
                        <th>Teacher</th>
                      </tr>
                    </thead>
                    <tbody>
                      {past.slice(0, 5).map((hw) => (
                        <tr key={hw.id} className="hover:bg-slate-50">
                          <td className="text-slate-700">{hw.title}</td>
                          <td><span className="badge bg-slate-100 text-slate-600">{hw.subject.name}</span></td>
                          <td className="text-slate-500">{formatDate(hw.dueDate)}</td>
                          <td className="text-slate-500">{hw.teacher.user.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
