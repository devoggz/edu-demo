import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { TeacherGradingClient } from "@/components/teacher/TeacherGradingClient";

export default async function TeacherGradesPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    include: {
      classes: {
        include: {
          students: {
            include: {
              performance: {
                include: { subject: true },
                orderBy: { createdAt: "desc" },
              },
            },
            orderBy: { name: "asc" },
          },
        },
        orderBy: { name: "asc" },
      },
      subjects: { include: { subject: true } },
    },
  });

  if (!teacher) redirect("/auth/login");

  // Serialise for client
  const classes = teacher.classes.map((cls) => ({
    id: cls.id,
    name: cls.name,
    grade: cls.grade,
    students: cls.students.map((s) => ({
      id: s.id,
      name: s.name,
      studentId: s.studentId,
      gender: s.gender,
      performance: s.performance.map((p) => ({
        id: p.id,
        subjectId: p.subjectId,
        subjectName: p.subject.name,
        score: p.score,
        grade: p.grade,
        term: p.term,
        examType: p.examType,
        remarks: p.remarks,
        createdAt: p.createdAt.toISOString(),
      })),
    })),
  }));

  const subjects = teacher.subjects.map((ts) => ({
    id: ts.subject.id,
    name: ts.subject.name,
    code: ts.subject.code,
  }));

  return (
    <div>
      <TopNav
        title="CBC Grading"
        subtitle="Record and manage learner assessments"
        userName={session.user.name}
      />
      <div className="page-body">
        <TeacherGradingClient classes={classes} subjects={subjects} />
      </div>
    </div>
  );
}
