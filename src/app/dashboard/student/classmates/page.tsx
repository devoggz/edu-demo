import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import Link from "next/link";
import { getInitials } from "@/lib/utils";
import { Users } from "lucide-react";

export default async function StudentClassmatesPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      student: {
        include: {
          class: {
            include: {
              classTeacher: { include: { user: true } },
              students: {
                include: {
                  activities: true,
                  performance: { orderBy: { createdAt: "desc" } },
                },
                orderBy: { name: "asc" },
              },
            },
          },
        },
      },
    },
  });
  if (!profile) redirect("/auth/login");

  const me        = profile.student;
  const classmates = me.class.students.filter((s) => s.id !== me.id);

  const avatarGradients = [
    "from-blue-400 to-blue-600",
    "from-violet-400 to-violet-600",
    "from-emerald-400 to-emerald-600",
    "from-rose-400 to-rose-600",
    "from-amber-400 to-amber-600",
    "from-teal-400 to-teal-600",
    "from-pink-400 to-pink-600",
    "from-indigo-400 to-indigo-600",
  ];

  return (
    <div>
      <TopNav
        title="Classmates"
        subtitle={`${me.class.name} · ${classmates.length} students`}
        userName={session.user.name}
      />
      <div className="page-body">

        {/* Class info */}
        <div className="card card-body flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800">{me.class.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {me.class.classTeacher
                ? `Class Teacher: ${me.class.classTeacher.user.name}`
                : "No class teacher assigned"}
              {" · "}Room {me.class.room ?? "TBD"}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-bold text-slate-800">{me.class.students.length}</p>
            <p className="text-xs text-slate-400">students</p>
          </div>
        </div>

        {/* Student grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {classmates.map((s, i) => {
            const avgScore =
              s.performance.length > 0
                ? Math.round(s.performance.reduce((acc, p) => acc + p.score, 0) / s.performance.length)
                : null;
            const topActivity = s.activities[0];
            const gradient = avatarGradients[i % avatarGradients.length];

            return (
              <Link key={s.id} href={`/dashboard/student/classmates/${s.id}`}>
                <div className="card card-body card-hover group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-11 h-11 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                      {getInitials(s.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate group-hover:text-blue-600 transition-colors">
                        {s.name}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{s.studentId}</p>
                    </div>
                    <span className={`badge text-[10px] ${s.gender === "Male" ? "bg-blue-50 text-blue-600" : "bg-pink-50 text-pink-600"}`}>
                      {s.gender}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      {topActivity ? (
                        <>
                          <span className="badge badge-purple text-[10px]">{topActivity.category}</span>
                          <span className="truncate max-w-[80px]">{topActivity.name}</span>
                        </>
                      ) : (
                        <span className="text-slate-300">No activities</span>
                      )}
                    </span>
                    {avgScore !== null && (
                      <span className="font-semibold text-slate-600">{avgScore}% avg</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {classmates.length === 0 && (
          <div className="card card-body text-center py-14">
            <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No other students in your class yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
