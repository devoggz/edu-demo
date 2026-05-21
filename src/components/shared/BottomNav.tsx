"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, GraduationCap, ClipboardList, Bell, DollarSign,
  TrendingUp, BookOpen, BarChart2, Calendar, Award, CalendarDays,
} from "lucide-react";

interface BottomNavProps { role: "admin" | "teacher" | "parent" | "student"; }

const bottomNav = {
  admin: [
    { href: "/dashboard/admin",               label: "Home",       icon: LayoutDashboard },
    { href: "/dashboard/admin/students",       label: "Students",   icon: GraduationCap },
    { href: "/dashboard/admin/events",         label: "Events",     icon: CalendarDays },
    { href: "/dashboard/admin/fees",           label: "Fees",       icon: DollarSign },
    { href: "/dashboard/admin/notifications",  label: "Alerts",     icon: Bell },
  ],
  teacher: [
    { href: "/dashboard/teacher",              label: "Home",       icon: LayoutDashboard },
    { href: "/dashboard/teacher/grades",       label: "Grades",     icon: TrendingUp },
    { href: "/dashboard/teacher/homework",     label: "Homework",   icon: ClipboardList },
    { href: "/dashboard/teacher/timetable",    label: "Schedule",   icon: Calendar },
    { href: "/dashboard/teacher/notifications",label: "Alerts",     icon: Bell },
  ],
  parent: [
    { href: "/dashboard/parent",               label: "Home",       icon: LayoutDashboard },
    { href: "/dashboard/parent/homework",      label: "Homework",   icon: BookOpen },
    { href: "/dashboard/parent/events",        label: "Events",     icon: CalendarDays },
    { href: "/dashboard/parent/fees",          label: "Fees",       icon: DollarSign },
  ],
  student: [
    { href: "/dashboard/student",              label: "Home",       icon: LayoutDashboard },
    { href: "/dashboard/student/performance",  label: "Grades",     icon: BarChart2 },
    { href: "/dashboard/student/attendance",   label: "Attend.",    icon: Calendar },
    { href: "/dashboard/student/activities",   label: "Activities", icon: Award },
  ],
};

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const items    = bottomNav[role];
  const roleBase = `/dashboard/${role}`;

  return (
    <nav
      className="lg:hidden"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "hsl(var(--sidebar-bg))",
        borderTop: "1px solid hsl(var(--sidebar-border))",
        boxShadow: "0 -2px 16px rgba(0,0,0,0.18)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <div style={{ display: "flex", height: 56 }}>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== roleBase && pathname.startsWith(item.href + "/"));

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                position: "relative",
                color: isActive ? "#ffffff" : "rgba(148,163,184,0.85)",
                textDecoration: "none",
                transition: "color 0.15s",
                minHeight: 44,
              }}
            >
              {/* Active indicator bar */}
              {isActive && (
                <span
                  style={{
                    position: "absolute",
                    top: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 20,
                    height: 2,
                    borderRadius: 99,
                    background: "#ffffff",
                    opacity: 0.9,
                  }}
                />
              )}

              <Icon
                style={{ width: 20, height: 20 }}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 500,
                  lineHeight: 1,
                  letterSpacing: 0.2,
                  fontFamily: "inherit",
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
