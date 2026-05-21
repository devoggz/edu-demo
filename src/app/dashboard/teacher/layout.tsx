import { auth } from "@/auth";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/shared/Sidebar";
import { BottomNav } from "@/components/shared/BottomNav";
import { PWAInstallBanner } from "@/components/pwa/PWAInstallBanner";

export const dynamic = "force-dynamic";

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session) redirect("/auth/login");
  if (session.user.role !== "TEACHER") redirect("/");

  return (
    <div
      className="flex flex-col lg:flex-row"
      style={{
        height: "100dvh",
        background: "hsl(var(--background))",
        overflow: "hidden",
      }}
    >
      <Sidebar role="teacher" userName={session.user.name} userEmail={session.user.email} />

      <main
        className="flex-1 min-w-0"
        style={{
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 64px)",
        }}
      >
        <div className="lg:pb-0" style={{ minHeight: "100%" }}>
          {children}
        </div>
      </main>

      <BottomNav role="teacher" />
      <PWAInstallBanner />
    </div>
  );
}
