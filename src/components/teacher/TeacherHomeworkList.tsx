import { formatDate } from "@/lib/utils";
import { ClipboardList, CheckCircle, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Homework {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  isWeekly: boolean;
  subject: { name: string };
  class: { name: string };
  submissions: { id: string; status: string }[];
}

export function TeacherHomeworkList({ homework }: { homework: Homework[] }) {
  return (
    <div className="card card-body">
        <div className="flex items-center justify-between mb-4">
        <h3 className="section-title">Recent Homework</h3>
        <div className="flex gap-2">
          <Link
            href="/dashboard/teacher/homework"
            className="text-xs text-blue-600 hover:underline"
          >
            View all
          </Link>
          <Link
            href="/dashboard/teacher/homework/new"
            className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition"
          >
            + Assign
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {homework.map((hw) => {
          const isOverdue = new Date(hw.dueDate) < new Date();
          const submitted = hw.submissions.filter((s) => s.status !== "PENDING").length;

          return (
            <div key={hw.id} className="border border-slate-100 rounded-xl p-4 hover:border-blue-200 hover:bg-blue-50/30 transition">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="text-sm font-semibold text-slate-900 line-clamp-2">{hw.title}</h4>
                <span className={`badge flex-shrink-0 text-xs ${hw.isWeekly ? "bg-violet-50 text-violet-700" : "bg-blue-50 text-blue-700"}`}>
                  {hw.isWeekly ? "Weekly" : "Daily"}
                </span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2 mb-3">{hw.description}</p>

              <div className="flex items-center gap-2 mb-3">
                <span className="badge bg-slate-100 text-slate-600">{hw.class.name}</span>
                <span className="badge bg-emerald-50 text-emerald-700">{hw.subject.name}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className={`flex items-center gap-1 font-medium ${isOverdue ? "text-red-600" : "text-orange-600"}`}>
                  {isOverdue ? <AlertCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  Due {formatDate(hw.dueDate)}
                </div>
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {submitted}/{hw.submissions.length} done
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {homework.length === 0 && (
        <div className="flex flex-col items-center py-12">
          <ClipboardList className="w-10 h-10 text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">No homework assigned yet</p>
          <Link
            href="/dashboard/teacher/homework/new"
            className="mt-3 text-sm text-blue-600 hover:underline"
          >
            Assign your first homework
          </Link>
        </div>
      )}
    </div>
  );
}
