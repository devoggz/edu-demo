import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getFeeStatusColor(status: string): string {
  switch (status) {
    case "PAID": return "text-green-600 bg-green-50";
    case "PENDING": return "text-yellow-600 bg-yellow-50";
    case "OVERDUE": return "text-red-600 bg-red-50";
    case "PARTIAL": return "text-blue-600 bg-blue-50";
    default: return "text-gray-600 bg-gray-50";
  }
}

export function getGradeColor(grade: string): string {
  // Kenya CBC grades
  if (grade === "EE") return "text-green-700 bg-green-50";
  if (grade === "ME") return "text-blue-700 bg-blue-50";
  if (grade === "AE") return "text-yellow-700 bg-yellow-50";
  if (grade === "BE") return "text-red-700 bg-red-50";
  // Legacy letter grades fallback
  if (grade.startsWith("A")) return "text-green-700 bg-green-50";
  if (grade.startsWith("B")) return "text-blue-700 bg-blue-50";
  if (grade.startsWith("C")) return "text-yellow-700 bg-yellow-50";
  return "text-red-700 bg-red-50";
}

// CBC Grade label helper
export function getCBCGradeLabel(grade: string): string {
  switch (grade) {
    case "EE": return "Exceeds Expectations";
    case "ME": return "Meets Expectations";
    case "AE": return "Approaching Expectations";
    case "BE": return "Below Expectations";
    default: return grade;
  }
}

// CBC score to grade
export function getCBCGrade(score: number): string {
  if (score >= 80) return "EE";
  if (score >= 65) return "ME";
  if (score >= 50) return "AE";
  return "BE";
}

export function getCBCRemark(grade: string): string {
  switch (grade) {
    case "EE": return "Exceeds Expectations – Outstanding performance";
    case "ME": return "Meets Expectations – Good performance";
    case "AE": return "Approaching Expectations – Needs improvement";
    case "BE": return "Below Expectations – Requires additional support";
    default: return "";
  }
}
