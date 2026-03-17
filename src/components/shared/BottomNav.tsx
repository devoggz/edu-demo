"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, GraduationCap, ClipboardList, Bell, DollarSign,
  TrendingUp, BookOpen, FileText, BarChart2, Calendar, Award, CalendarDays, Banknote,
} from "lucide-react";

interface BottomNavProps { role: "admin" | "teacher" | "parent" | "student"; }

const bottomNav = {
  admin: [
    { href: "/dashboard/admin",              label: "Home",   icon: LayoutDashboard },
    { href: "/dashboard/admin/students",      label: "Students", icon: GraduationCap },
    { href: "/dashboard/admin/events",        label: "Events", icon: CalendarDays },
    { href: "/dashboard/admin/fees",          label: "Fees",   icon: Banknote },
    { href: "/dashboard/admin/notifications", label: "Alerts", icon: Bell },
  ],
  teacher: [
    { href: "/dashboard/teacher",              label: "Home",   icon: LayoutDashboard },
    { href: "/dashboard/teacher/grades",       label: "Grades", icon: TrendingUp },
    { href: "/dashboard/teacher/homework",     label: "HomeWork",     icon: ClipboardList },
    { href: "/dashboard/teacher/timetable",    label: "Schedule", icon: Calendar },
    { href: "/dashboard/teacher/notifications",label: "Alerts", icon: Bell },
  ],
  parent: [
    { href: "/dashboard/parent",               label: "Home",   icon: LayoutDashboard },
    { href: "/dashboard/parent/homework",      label: "HW",     icon: BookOpen },
    { href: "/dashboard/parent/events",        label: "Events", icon: CalendarDays },
    { href: "/dashboard/parent/fees",          label: "Fees",   icon: Banknote },
  ],
  student: [
    { href: "/dashboard/student",              label: "Home",     icon: LayoutDashboard },
    { href: "/dashboard/student/performance",  label: "Grades",   icon: BarChart2 },
    { href: "/dashboard/student/attendance",   label: "Attend.",  icon: Calendar },
    { href: "/dashboard/student/activities",   label: "Activities", icon: Award },
  ],
};

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const items = bottomNav[role];

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 safe-bottom"
      style={{
        background: "hsl(var(--sidebar-bg))",
        borderTop: "1px solid hsl(var(--sidebar-border))",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.15)",
      }}
    >
      <div className="flex items-stretch">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard/" + role && pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-2 px-1 gap-0.5 transition-colors relative",
                isActive ? "text-white" : "text-slate-500 hover:text-slate-300"
              )}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-white rounded-full opacity-80" />
              )}
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[9px] font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
