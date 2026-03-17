import { auth } from "@/auth";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/shared/Sidebar";
import { BottomNav } from "@/components/shared/BottomNav";
import { PWAInstallBanner } from "@/components/pwa/PWAInstallBanner";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session) redirect("/auth/login");
  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") redirect("/");

  return (
    <div className="flex min-h-screen" style={{ background: "hsl(var(--background))" }}>
      <Sidebar role="admin" userName={session.user.name} userEmail={session.user.email} />
      <div className="flex-1 flex flex-col min-w-0" style={{ minWidth: 0 }}>
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-20 lg:pb-0">
          {children}
        </main>
      </div>
      <BottomNav role="admin" />
      <PWAInstallBanner />
    </div>
  );
}
