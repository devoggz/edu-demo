# EduTrack — School Management System

A comprehensive, production-ready school management platform built for Kenya's CBC curriculum.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Database | PostgreSQL (Neon recommended) |
| ORM | Prisma 7 |
| Auth | NextAuth v5 (beta) |
| Styling | Tailwind CSS v3 |
| Charts | Recharts |
| Icons | Lucide React |
| PWA | Custom Service Worker |

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env .env
# Fill in DATABASE_URL and AUTH_SECRET

# 3. Run database migrations
npx prisma migrate dev --name init

# 4. Seed with demo data
npx prisma db seed

# 5. Start dev server
npm run dev
```

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@schoolms.com | password123 |
| Teacher | teacher1@schoolms.com | password123 |
| Parent | parent1@example.com | password123 |
| Student | student@schoolms.com | password123 |

## Environment Variables

```env
DATABASE_URL=postgresql://...
AUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000

# M-PESA (optional — demo mode works without these)
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=
MPESA_PASSKEY=
MPESA_CALLBACK_URL=
```

## Prisma 7 Setup

This project uses Prisma 7 with the new `prisma.config.ts` configuration file.

```bash
# Generate client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (configured in prisma.config.ts)
npx prisma db seed

# Open Prisma Studio
npx prisma studio
```

## Features

- **Admin Dashboard** — Statistics, fee balances with payment prompts, event management, teacher CRUD
- **Teacher Dashboard** — CBC grading, timetable management, class calendar, homework tracking
- **Parent Dashboard** — Children's performance, fee payments via M-PESA, event payments
- **Student Dashboard** — Homework submission, attendance, performance, events, classmates
- **Dark Mode** — Full dark/light theme with system detection (defaults to light)
- **PWA** — Install banner, offline support, push notification badge API
- **Responsive** — Mobile-first, works on all screen sizes

## CBC Grading Scale

| Grade | Range | Meaning |
|-------|-------|---------|
| EE | 80–100% | Exceeds Expectations |
| ME | 65–79% | Meets Expectations |
| AE | 50–64% | Approaching Expectations |
| BE | 0–49% | Below Expectations |
