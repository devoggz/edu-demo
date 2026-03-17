import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { formatDate } from "@/lib/utils";
import { Trophy } from "lucide-react";

export default async function StudentActivitiesPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    include: { student: { include: { activities: { orderBy: { startDate: "desc" } } } } },
  });
  if (!profile) redirect("/auth/login");

  const activities = profile.student.activities;

  const categories = [...new Set(activities.map((a) => a.category))];
  const catColors: Record<string, string> = {
    Sports: "badge-green", Academic: "badge-blue", "Performing Arts": "badge-purple",
    Business: "badge-yellow", "Creative Arts": "badge-purple", "Community Service": "badge-slate",
  };
  const catGradient: Record<string, string> = {
    Sports: "from-emerald-400 to-emerald-600", Academic: "from-blue-400 to-blue-600",
    "Performing Arts": "from-violet-400 to-violet-600", Business: "from-amber-400 to-amber-600",
    "Creative Arts": "from-pink-400 to-pink-600", "Community Service": "from-teal-400 to-teal-600",
  };

  return (
    <div>
      <TopNav title="Activities" subtitle={`${activities.length} co-curricular activities`} userName={session.user.name} />
      <div className="page-body">

        {/* Category summary */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const count = activities.filter((a) => a.category === cat).length;
              return (
                <span key={cat} className={`badge ${catColors[cat] ?? "badge-slate"} px-3 py-1 text-xs`}>
                  {cat} · {count}
                </span>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {activities.map((act) => (
            <div key={act.id} className="card card-body">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 bg-gradient-to-br ${catGradient[act.category] ?? "from-slate-400 to-slate-600"} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-xs font-bold">{act.category[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm">{act.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className={`badge text-[10px] ${catColors[act.category] ?? "badge-slate"}`}>{act.category}</span>
                    {act.role && <span className="badge badge-slate text-[10px]">{act.role}</span>}
                  </div>
                  {act.achievement && (
                    <div className="flex items-center gap-1 mt-2">
                      <Trophy className="w-3 h-3 text-amber-500 flex-shrink-0" />
                      <span className="text-xs font-semibold text-amber-700">{act.achievement}</span>
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    Since {formatDate(act.startDate)}{act.endDate ? ` – ${formatDate(act.endDate)}` : " · Ongoing"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {activities.length === 0 && (
          <div className="card card-body text-center py-14">
            <Trophy className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No activities recorded yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
