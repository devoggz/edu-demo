"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BookOpen, Mail, Lock, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";

const DEMO_ACCOUNTS = [
  { label: "Admin",   email: "admin@schoolms.com",    role: "Administrator" },
  { label: "Teacher", email: "teacher1@schoolms.com", role: "Class Teacher" },
  { label: "Parent",  email: "parent1@example.com",   role: "Guardian" },
  { label: "Student", email: "student@schoolms.com",  role: "Grade 7A" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      setError("Incorrect email or password.");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  const quickFill = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword("password123");
    setError("");
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── Left panel (hero) — hidden on mobile, full-height on lg ── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative bg-blue-600 flex-col justify-between p-12 overflow-hidden">
        {/* Geometric background */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)"
        }} />
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }} />
        {/* Floating blobs */}
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-15%] left-[-5%] w-80 h-80 bg-blue-400/20 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">EduTrack</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight mb-5">
            Education<br />management<br />simplified.
          </h1>
          <p className="text-blue-100 text-lg leading-relaxed max-w-sm">
            A unified platform for school administrators, teachers, parents, and students.
          </p>
        </div>

        <div className="relative z-10">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            {[
              { value: "1,200+", label: "Students" },
              { value: "80+",    label: "Teachers" },
              { value: "4",      label: "Grades" },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <p className="text-white text-2xl font-bold tracking-tight">{s.value}</p>
                <p className="text-blue-200 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <p className="text-blue-300 text-xs">
            © {new Date().getFullYear()} EduTrack · Built on Kenya CBC Curriculum
          </p>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0 transition-colors duration-200" style={{ background: "hsl(var(--card))" }}>

        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 px-5 pt-12 pb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-lg leading-none">EduTrack</p>
            <p className="text-slate-500 text-xs mt-0.5">School Management System</p>
          </div>
        </div>

        {/* Form container */}
        <div className="flex-1 flex flex-col justify-center px-5 sm:px-10 lg:px-14 xl:px-20 pb-10 lg:pb-0 lg:py-16 max-w-md mx-auto w-full lg:max-w-none">

          <div className="mb-8 lg:mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
              Sign in
            </h2>
            <p className="mt-1.5 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
              Welcome back. Enter your credentials to continue.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@school.com"
                  className="input pl-9"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Password</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="input pl-9 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-lg btn-primary w-full mt-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
              ) : "Sign in"}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8 pt-7 border-t" style={{ borderColor: "hsl(var(--border))" }}>
            <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "hsl(var(--muted-foreground))" }}>
              Demo accounts
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => quickFill(acc)}
                  className="text-left p-3 rounded-lg border hover:border-blue-300 hover:bg-blue-50/10 transition-all group" style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}
                >
                  <p className="text-sm font-semibold group-hover:text-blue-600 transition-colors" style={{ color: "hsl(var(--foreground))" }}>
                    {acc.label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{acc.role}</p>
                </button>
              ))}
            </div>
            <p className="text-xs mt-3 text-center" style={{ color: "hsl(var(--muted-foreground))" }}>
              Password for all demo accounts: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">password123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
