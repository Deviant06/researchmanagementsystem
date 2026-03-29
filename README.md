# ResearchHub TANCU

ResearchHub TANCU is a full-stack research management system for senior high school teachers and students. It provides secure role-based access, structured research stages, submission version history, feedback-to-task conversion, analytics, and a shared resource repository.

## Stack

- Next.js 14 with the App Router
- React + TypeScript
- Supabase Auth with SSR session handling
- Supabase Postgres with role-aware data isolation policies
- Supabase Storage for research submissions and repository assets
- Supabase Realtime for live notification delivery
- SMTP email alerts via `nodemailer`

## Core Features

- Secure login with `ADMIN` and `STUDENT` roles
- Admin student management: create, edit, delete, group assignment, password reset
- Student-only access to their assigned group workspace
- Structured research workflow:
  - Title Proposal
  - Chapter 1
  - Chapter 2
  - Chapter 3
  - Data Gathering
  - Data Analysis
  - Chapter 4-5
  - Final Defense
- Status tracking per stage:
  - Not Started
  - Submitted
  - Under Review
  - Revised
  - Approved
- Submission history with version number, timestamp, uploader, and file download
- Teacher feedback by section with category tagging
- Student replies and "mark addressed" workflow
- Revision task tracker generated from teacher comments
- Resource repository for templates, rubrics, sample papers, and video guides
- Admin analytics for progress, delays, revision hotspots, and submission frequency
- Realtime notification refreshes when new alerts are assigned
- Email alerts for submissions, feedback, task changes, resource uploads, and status updates
- Mobile-responsive dashboard with sidebar navigation and color indicators

## Demo Accounts

- Teacher Admin
  - Email: `teacher@researchhub.local`
  - Password: `ResearchHub123!`
- Student Demo
  - Email: `aira@researchhub.local`
  - Password: `ResearchHub123!`

Additional seeded students:

- `noah@researchhub.local`
- `leah@researchhub.local`

They all use the same temporary password above unless reset by the admin.

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create your environment file:

```bash
cp .env.example .env.local
```

3. Create a Supabase project, then run the SQL migration in [supabase/migrations/20260329150000_researchhub_tancu.sql](/Users/juliusfabian/Documents/Research%20Management%20System/supabase/migrations/20260329150000_researchhub_tancu.sql)

4. Seed the demo accounts and starter data:

```bash
npm run supabase:seed-demo
```

5. Run the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Environment

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
APP_BASE_URL=http://localhost:3000

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
EMAIL_FROM=ResearchHub TANCU <no-reply@example.com>
```

## Project Structure

- `src/app` - pages, layouts, and API route handlers
- `src/components` - reusable UI blocks for dashboards and workspace flows
- `src/lib` - shared constants, types, client helpers, and utilities
- `src/lib/server` - Supabase-backed auth, notifications, email delivery, validation, and domain services
- `src/lib/supabase` - browser, server, and admin Supabase clients
- `supabase/migrations` - SQL schema, RLS, storage bucket, and realtime setup
- `scripts/seed-supabase.mjs` - demo user and sample data seeding

## Notes

- The project now requires Supabase configuration before sign-in works.
- The seed script is intended for a fresh or demo Supabase project and creates the teacher/student demo accounts.
- Submission uploads are limited to PDF and DOCX files.
- Resource uploads support both file uploads and external links.
- Email alerts are optional. If SMTP variables are missing, in-app notifications still work.
