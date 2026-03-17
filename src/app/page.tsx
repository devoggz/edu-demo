import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();
  if (!session) redirect("/auth/login");
  const role = session.user.role;
  if (role === "SUPER_ADMIN" || role === "ADMIN") redirect("/dashboard/admin");
  if (role === "TEACHER") redirect("/dashboard/teacher");
  if (role === "PARENT")  redirect("/dashboard/parent");
  if (role === "STUDENT") redirect("/dashboard/student");
  redirect("/auth/login");
}
