import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trophy, BookMarked, Users } from "lucide-react";
import { getInitials, formatDate } from "@/lib/utils";

export default async function ClassmateProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/auth/login");

  // Verify the viewer is a student in the same class
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    include: { student: { select: { classId: true } } },
  });
  if (!profile) redirect("/auth/login");

  const classmate = await prisma.student.findUnique({
    where: { id },
    include: {
      class: { include: { classTeacher: { include: { user: true } } } },
      activities: { orderBy: { startDate: "desc" } },
      performance: {
        include: { subject: true },
        orderBy: { createdAt: "desc" },
      },
      homeworkSubmissions: {
        include: { homework: { include: { subject: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  // Only allow viewing classmates from the same class
  if (!classmate || classmate.classId !== profile.student.classId) notFound();

  // Latest grade per subject (public — no scores exposed, just subjects + activity)
  const subjectsDone = [...new Set(classmate.performance.map((p) => p.subject.name))];

  const avatarGradients: Record<string, string> = {
    Male:   "from-blue-400 to-blue-600",
    Female: "from-violet-400 to-violet-600",
  };
  const gradient = avatarGradients[classmate.gender] ?? "from-slate-400 to-slate-600";

  return (
    <div>
      <div className="page-header-back">
        <Link href="/dashboard/student/classmates" className="btn-sm btn-ghost p-1.5">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-base font-bold text-slate-900 truncate">{classmate.name}</h1>
          <p className="text-xs text-slate-400">{classmate.class.name}</p>
        </div>
      </div>

      <div className="page-body">

        {/* Profile card */}
        <div className="card card-body">
          <div className="flex items-start gap-4">
            <div className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0`}>
              {getInitials(classmate.name)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">{classmate.name}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{classmate.studentId}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className={`badge ${classmate.gender === "Male" ? "badge-blue" : "bg-pink-50 text-pink-700"}`}>
                  {classmate.gender}
                </span>
                {classmate.bloodGroup && (
                  <span className="badge badge-slate">{classmate.bloodGroup}</span>
                )}
                <span className="badge badge-slate">{classmate.class.name}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5 pt-5 border-t border-slate-100">
            {[
              { label: "Class", value: classmate.class.name },
              { label: "Class Teacher", value: classmate.class.classTeacher?.user.name ?? "—" },
              { label: "Enrolled", value: formatDate(classmate.enrollmentDate) },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{item.label}</p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Subjects */}
        {subjectsDone.length > 0 && (
          <div className="card card-body">
            <div className="flex items-center gap-2 mb-3">
              <BookMarked className="w-4 h-4 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">Learning Areas</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {subjectsDone.map((name) => (
                <span key={name} className="badge badge-blue">{name}</span>
              ))}
            </div>
          </div>
        )}

        {/* Activities */}
        {classmate.activities.length > 0 && (
          <div className="card card-body">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">Co-Curricular Activities</p>
            </div>
            <div className="space-y-2.5">
              {classmate.activities.map((act) => (
                <div key={act.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-violet-600 text-xs font-bold">{act.category[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{act.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {act.category}{act.role ? ` · ${act.role}` : ""}
                    </p>
                    {act.achievement && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <Trophy className="w-3 h-3 text-amber-500 flex-shrink-0" />
                        <span className="text-xs font-semibold text-amber-700">{act.achievement}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {classmate.activities.length === 0 && subjectsDone.length === 0 && (
          <div className="card card-body text-center py-12">
            <Users className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No additional profile info yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
