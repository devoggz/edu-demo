import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { StatCard } from "@/components/shared/StatCard";
import { TeacherCalendarWidget } from "@/components/teacher/TeacherCalendarWidget";
import { TeacherHomeworkList } from "@/components/teacher/TeacherHomeworkList";
import { School, GraduationCap, ClipboardList, BookMarked } from "lucide-react";
import Link from "next/link";

async function getTeacherData(userId: string) {
  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    include: {
      user: true,
      classes: {
        include: {
          students: true,
          subjects: { include: { subject: true } },
        },
      },
      subjects: { include: { subject: true } },
      homework: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { subject: true, class: true, submissions: true },
      },
      calendarEvents: {
        where: { startDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
        orderBy: { startDate: "asc" },
        take: 8,
      },
    },
  });
  return teacher;
}

export default async function TeacherDashboard() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const teacher = await getTeacherData(session.user.id);
  if (!teacher) redirect("/auth/login");

  const totalStudents = teacher.classes.reduce((sum, c) => sum + c.students.length, 0);

  return (
    <div>
      <TopNav
        title="My Dashboard"
        subtitle={`${new Date().toLocaleDateString("en-KE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`}
        userName={session.user.name}
      />

      <div className="page-body">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            title="My Classes"
            value={teacher.classes.length}
            icon={School}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
          />
          <StatCard
            title="Total Students"
            value={totalStudents}
            icon={GraduationCap}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
          />
          <StatCard
            title="Subjects"
            value={teacher.subjects.length}
            icon={BookMarked}
            iconColor="text-violet-600"
            iconBg="bg-violet-50"
          />
          <StatCard
            title="Active Homework"
            value={teacher.homework.filter(h => new Date(h.dueDate) >= new Date()).length}
            icon={ClipboardList}
            iconColor="text-orange-600"
            iconBg="bg-orange-50"
          />
        </div>

        {/* Main Grid: Calendar + Classes */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="xl:col-span-2">
            <TeacherCalendarWidget events={teacher.calendarEvents} />
          </div>

          {/* Classes sidebar */}
          <div className="space-y-4">
            <h3 className="section-title">My Classes</h3>
            {teacher.classes.map((cls) => (
              <Link key={cls.id} href={`/dashboard/teacher/classes/${cls.id}`}>
              <div className="card card-body hover:border-blue-200 hover:shadow-md transition cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-slate-900">{cls.name}</h4>
                    <p className="text-xs text-slate-400">Room {cls.room ?? "TBD"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-blue-600">{cls.students.length}</p>
                    <p className="text-xs text-slate-400">students</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {cls.subjects.slice(0, 3).map((cs) => (
                    <span key={cs.subjectId} className="badge bg-blue-50 text-blue-700 text-xs">
                      {cs.subject.name}
                    </span>
                  ))}
                </div>
              </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Homework */}
        <TeacherHomeworkList homework={teacher.homework} />
      </div>
    </div>
  );
}
