import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { TimetableClient } from "@/components/teacher/TimetableClient";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default async function TeacherTimetablePage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    include: {
      classes: true,
      subjects: { include: { subject: true } },
      timetable: {
        include: {
          class: true,
          subject: true,
        },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      },
    },
  });

  if (!teacher) redirect("/auth/login");

  const timetableData = teacher.timetable.map(e => ({
    id: e.id,
    dayOfWeek: e.dayOfWeek,
    dayName: DAYS[e.dayOfWeek - 1],
    startTime: e.startTime,
    endTime: e.endTime,
    className: e.class.name,
    classId: e.classId,
    subjectName: e.subject.name,
    subjectId: e.subjectId,
    room: e.room ?? "",
  }));

  const classes = teacher.classes.map(c => ({ id: c.id, name: c.name }));
  const subjects = teacher.subjects.map(ts => ({ id: ts.subject.id, name: ts.subject.name, code: ts.subject.code }));

  return (
    <div>
      <TopNav title="Timetable" subtitle="Your weekly teaching schedule" userName={session.user.name} />
      <div className="page-body">
        <TimetableClient
          teacherId={teacher.id}
          entries={timetableData}
          classes={classes}
          subjects={subjects}
        />
      </div>
    </div>
  );
}
