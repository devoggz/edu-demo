"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn, getInitials } from "@/lib/utils";
import type { ElementType } from "react";
import {
  BookOpen,
  LayoutDashboard,
  Users,
  GraduationCap,
  BookMarked,
  Calendar,
  CalendarDays,
  LayoutGrid,
  Bell,
  DollarSign,
  ClipboardList,
  LogOut,
  TrendingUp,
  ChevronRight,
  School,
  FileText,
  MessageSquare,
  Menu,
  X,
  Award,
  BarChart2,
  Banknote,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: ElementType;
}
interface SidebarProps {
  role: "admin" | "teacher" | "parent" | "student";
  userName: string;
  userEmail: string;
}
const navConfig: Record<string, NavItem[]> = {
  admin: [
    { href: "/dashboard/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/admin/teachers", label: "Teachers", icon: Users },
    { href: "/dashboard/admin/students", label: "Students", icon: GraduationCap },
    { href: "/dashboard/admin/classes", label: "Classes", icon: School },
    { href: "/dashboard/admin/subjects", label: "Subjects", icon: BookMarked },
    { href: "/dashboard/admin/events", label: "Events", icon: CalendarDays },
    { href: "/dashboard/admin/calendar", label: "Calendar", icon: Calendar },
    { href: "/dashboard/admin/fees", label: "Accounts", icon: Banknote },
    { href: "/dashboard/admin/notifications", label: "Notifications", icon: Bell },
  ],
  teacher: [
    { href: "/dashboard/teacher", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/teacher/classes", label: "My Classes", icon: School },
    { href: "/dashboard/teacher/students", label: "Students", icon: GraduationCap },
    { href: "/dashboard/teacher/grades", label: "CBC Grading", icon: TrendingUp },
    { href: "/dashboard/teacher/homework", label: "Homework", icon: ClipboardList },
    { href: "/dashboard/teacher/timetable", label: "Timetable", icon: LayoutGrid },
    { href: "/dashboard/teacher/events", label: "Events", icon: CalendarDays },
    { href: "/dashboard/teacher/calendar", label: "Calendar", icon: Calendar },
    { href: "/dashboard/teacher/notifications", label: "Notifications", icon: Bell },
  ],
  parent: [
    { href: "/dashboard/parent", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/parent/children", label: "My Children", icon: GraduationCap },
    { href: "/dashboard/parent/homework", label: "Homework", icon: BookOpen },
    { href: "/dashboard/parent/performance", label: "Performance", icon: FileText },
    { href: "/dashboard/parent/events", label: "Events", icon: CalendarDays },
    { href: "/dashboard/parent/fees", label: "Fees", icon: Banknote },
    { href: "/dashboard/parent/notifications", label: "Notifications", icon: MessageSquare },
  ],
  student: [
    { href: "/dashboard/student", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/student/performance", label: "Performance", icon: BarChart2 },
    { href: "/dashboard/student/attendance", label: "Attendance", icon: Calendar },
    { href: "/dashboard/student/subjects", label: "Subjects", icon: BookMarked },
    { href: "/dashboard/student/homework", label: "Homework", icon: ClipboardList },
    { href: "/dashboard/student/activities", label: "Activities", icon: Award },
    { href: "/dashboard/student/events", label: "Events", icon: CalendarDays },
    { href: "/dashboard/student/classmates", label: "Classmates", icon: Users },
    { href: "/dashboard/student/notifications", label: "Notifications", icon: Bell },
  ],
};

const rolePill: Record<string, string> = {
  admin: "bg-violet-500/20 text-violet-300",
  teacher: "bg-blue-500/20 text-blue-300",
  parent: "bg-emerald-500/20 text-emerald-300",
  student: "bg-amber-500/20 text-amber-300",
};
const roleLabel: Record<string, string> = {
  admin: "Administrator",
  teacher: "Teacher",
  parent: "Guardian",
  student: "Student",
};

function NavContent({
  role,
  userName,
  userEmail,
  onNavClick,
}: SidebarProps & { onNavClick?: () => void }) {
  const pathname = usePathname();
  const navItems = navConfig[role] ?? [];

  return (
    <div className="flex flex-col h-full sidebar-root">
      {/* Logo */}
      <div
        className="px-4 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid hsl(var(--sidebar-border))" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "hsl(var(--primary))" }}
          >
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-[15px] leading-tight tracking-tight text-white">
              EduTrack
            </p>
            <span
              className={cn(
                "text-[10px] font-semibold px-1.5 py-0.5 rounded-md inline-block mt-0.5 uppercase tracking-wide",
                rolePill[role],
              )}
            >
              {roleLabel[role]}
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard/" + role &&
              pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              onClick={onNavClick}
              className={cn(
                "sidebar-link",
                isActive ? "sidebar-link-active" : "sidebar-link-inactive",
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0 opacity-90" />
              <span className="truncate text-[13px]">{item.label}</span>
              {isActive && (
                <ChevronRight className="w-3 h-3 ml-auto flex-shrink-0 opacity-60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div
        className="p-3 flex-shrink-0"
        style={{ borderTop: "1px solid hsl(var(--sidebar-border))" }}
      >
        <div className="flex items-center gap-2.5 mb-2 px-1">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
            style={{ background: "hsl(var(--primary))" }}
          >
            {getInitials(userName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold truncate text-white">
              {userName}
            </p>
            <p
              className="text-[11px] truncate"
              style={{ color: "hsl(var(--sidebar-text))" }}
            >
              {userEmail}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ redirectTo: "/auth/login" })}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[13px] transition-colors"
          style={{ color: "hsl(var(--sidebar-text))" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239,68,68,0.15)";
            e.currentTarget.style.color = "#fca5a5";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "";
            e.currentTarget.style.color = "hsl(var(--sidebar-text))";
          }}
        >
          <LogOut className="w-3.5 h-3.5" /> Sign Out
        </button>
      </div>
    </div>
  );
}

export function Sidebar(props: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const close = useCallback(() => setMobileOpen(false), []);
  const pathname = usePathname();

  useEffect(() => {
    close();
  }, [pathname, close]);
  useEffect(() => {
    document.body.classList.toggle("sidebar-open", mobileOpen);
    return () => document.body.classList.remove("sidebar-open");
  }, [mobileOpen]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [close]);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3.5 left-4 z-50 w-8 h-8 rounded-lg border flex items-center justify-center transition-colors"
        style={{
          background: "hsl(var(--card))",
          borderColor: "hsl(var(--border))",
          color: "hsl(var(--foreground))",
        }}
        aria-label="Open menu"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Desktop */}
      <aside className="hidden lg:flex flex-col w-[220px] xl:w-[236px] h-screen sticky top-0 flex-shrink-0 sidebar-root">
        <NavContent {...props} />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={close} aria-hidden />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "sidebar-drawer fixed inset-y-0 left-0 z-50 w-[220px] flex flex-col shadow-2xl lg:hidden sidebar-root",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <button
          onClick={close}
          className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center transition-colors z-10"
          style={{
            background: "rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.7)",
          }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
        <NavContent {...props} onNavClick={close} />
      </aside>
    </>
  );
}
