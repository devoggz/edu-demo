import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { formatDate, getInitials } from "@/lib/utils";
import { ArrowLeft, Calendar, BookOpen, User, AlertCircle, CheckCircle, Clock, FileText } from "lucide-react";
import Link from "next/link";
import { HomeworkSubmitForm } from "@/components/student/HomeworkSubmitForm";

export default async function StudentHomeworkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/auth/login");

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    include: { student: true },
  });
  if (!profile) redirect("/auth/login");

  const homework = await prisma.homework.findUnique({
    where: { id },
    include: {
      subject: true,
      class: true,
      teacher: { include: { user: true } },
    },
  });

  if (!homework || homework.classId !== profile.student.classId) notFound();

  const submission = await prisma.homeworkSubmission.findUnique({
    where: { homeworkId_studentId: { homeworkId: id, studentId: profile.student.id } },
  });

  const now = new Date();
  const isOverdue  = new Date(homework.dueDate) < now;
  const isSubmitted = submission && submission.status !== "PENDING";
  const canSubmit   = !isSubmitted;

  const statusConfig = {
    GRADED:    { label: "Graded",    cls: "badge-blue",   icon: CheckCircle },
    SUBMITTED: { label: "Submitted", cls: "badge-green",  icon: CheckCircle },
    PENDING:   { label: isOverdue ? "Overdue" : "Pending", cls: isOverdue ? "badge-red" : "badge-yellow", icon: isOverdue ? AlertCircle : Clock },
  };

  const status = submission?.status ?? "PENDING";
  const cfg = statusConfig[status as keyof typeof statusConfig] ?? statusConfig.PENDING;
  const StatusIcon = cfg.icon;

  return (
    <div>
      <div className="page-header-back">
        <Link href="/dashboard/student/homework" className="btn-sm btn-ghost p-1.5">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-[15px] font-bold truncate tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
            {homework.title}
          </h1>
          <p className="text-xs truncate mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
            {homework.subject.name} · {homework.class.name}
          </p>
        </div>
        <span className={`badge ${cfg.cls} flex-shrink-0`}>
          <StatusIcon className="w-3 h-3" />
          {cfg.label}
        </span>
      </div>

      <div className="page-body">

        {/* Homework details */}
        <div className="card card-body">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
                {homework.title}
              </h2>
              <div className="flex flex-wrap gap-2 mt-1.5">
                <span className="badge badge-blue">{homework.subject.name}</span>
                <span className="badge badge-slate">{homework.class.name}</span>
                {homework.isWeekly && <span className="badge badge-purple">Weekly</span>}
              </div>
            </div>
          </div>

          {/* Meta row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-4 border-y mb-4" style={{ borderColor: "hsl(var(--border))" }}>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>Due Date</p>
                <p className={`text-sm font-semibold ${isOverdue && !isSubmitted ? "text-red-500" : ""}`}
                   style={isOverdue && !isSubmitted ? {} : { color: "hsl(var(--foreground))" }}>
                  {formatDate(homework.dueDate)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>Set By</p>
                <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>{homework.teacher.user.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>Max Score</p>
                <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>{homework.maxScore} marks</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>Description</p>
            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "hsl(var(--foreground))" }}>
              {homework.description}
            </p>
          </div>

          {/* Instructions */}
          {homework.instructions && (
            <div className="rounded-lg p-4" style={{ background: "hsl(var(--muted))" }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
                Instructions
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "hsl(var(--foreground))" }}>
                {homework.instructions}
              </p>
            </div>
          )}
        </div>

        {/* Submission result (if graded) */}
        {submission && submission.status === "GRADED" && (
          <div className="card card-body">
            <p className="text-sm font-semibold mb-3" style={{ color: "hsl(var(--foreground))" }}>Your Result</p>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 border-4"
                   style={{ borderColor: (submission.grade ?? 0) >= 65 ? "#10b981" : "#f59e0b" }}>
                <span className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>
                  {submission.grade !== null ? `${submission.grade}%` : "—"}
                </span>
              </div>
              {submission.feedback && (
                <div className="flex-1 rounded-lg p-3" style={{ background: "hsl(var(--muted))" }}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>Teacher Feedback</p>
                  <p className="text-sm italic" style={{ color: "hsl(var(--foreground))" }}>{submission.feedback}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Previous submission content */}
        {submission && submission.status === "SUBMITTED" && submission.content && (
          <div className="card card-body">
            <p className="text-sm font-semibold mb-2" style={{ color: "hsl(var(--foreground))" }}>
              Your Submission <span className="badge badge-green ml-2">Submitted</span>
            </p>
            <div className="rounded-lg p-3 text-sm" style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}>
              {submission.content}
            </div>
          </div>
        )}

        {/* Submission form */}
        {canSubmit && (
          <HomeworkSubmitForm
            homeworkId={homework.id}
            studentId={profile.student.id}
            isOverdue={isOverdue}
          />
        )}

        {isSubmitted && submission?.status === "GRADED" && (
          <div className="card card-body flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
              This homework has been graded. No further submissions are accepted.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
