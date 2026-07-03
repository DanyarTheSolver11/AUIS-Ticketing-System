# AUIS Helpdesk

A ticketing system for AUIS IT support requests. Students/staff submit tickets,
technicians triage and resolve them, admins see reporting.

## Stack
- Next.js 14 (App Router) + TypeScript
- PostgreSQL via Neon
- Prisma ORM
- NextAuth (Google OAuth, restricted to `@auis.edu.krd`)
- UploadThing (file/screenshot attachments)
- Tailwind CSS

## Roles
- `SUBMITTER` — default role for anyone who signs in. Can create tickets, view own tickets, comment.
- `TECHNICIAN` — can view all tickets, update status/priority/assignment, comment.
- `ADMIN` — same as technician + full dashboard access. (Currently technician/admin share the same permissions — split further if your PM docs require it.)

New sign-ups always start as `SUBMITTER`. Promote yourself using the seed script (see below).

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Set up your database (Neon)
1. Go to https://neon.tech, create a free account and a new project.
2. Copy the connection string it gives you.
3. Paste it into `.env` as `DATABASE_URL`.

### 3. Set up Google OAuth
1. Go to https://console.cloud.google.com/apis/credentials
2. Create a new project (or use an existing one).
3. Create an **OAuth 2.0 Client ID** (Application type: Web application).
4. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
   (add your production URL later too, e.g. `https://yourapp.vercel.app/api/auth/callback/google`)
5. Copy the Client ID and Client Secret into `.env`.

Note: sign-in is restricted in code (`src/lib/auth.ts`) to emails ending in
`@auis.edu.krd` — this works with a regular "External" OAuth consent screen,
you don't need a Google Workspace admin to configure anything on Google's side.

### 4. Set up UploadThing
1. Go to https://uploadthing.com, create a free account and a new app.
2. Copy the API keys into `.env` as `UPLOADTHING_SECRET` and `UPLOADTHING_APP_ID`.

### 5. Generate a NextAuth secret
```bash
openssl rand -base64 32
```
Paste the result into `.env` as `NEXTAUTH_SECRET`.

### 6. Copy the env file and fill it in
```bash
cp .env.example .env
```

### 7. Push the Prisma schema to your database
```bash
npx prisma db push
```

### 8. Run the dev server
```bash
npm run dev
```
Visit http://localhost:3000, sign in with your AUIS Google account.

### 9. Promote yourself to Technician/Admin
After signing in once (so your user row exists in the DB):
```bash
npx tsx prisma/seed.ts your.email@auis.edu.krd ADMIN
```
Sign out and back in (or just refresh) — you should now see the Dashboard link
and status-update controls on tickets.

## Project structure
```
src/
  app/
    api/
      auth/[...nextauth]/   NextAuth handler
      tickets/              Ticket CRUD + comments
      dashboard/            Aggregate stats
      uploadthing/          File upload handler
    tickets/                Ticket list, new ticket form, ticket detail
    dashboard/               Stats page (technician/admin only)
  components/                Navbar, StatusBadge, Providers
  lib/                       auth.ts, prisma.ts, uploadthing.ts
prisma/
  schema.prisma              Data model
  seed.ts                    Role-promotion helper script
```

## What's built (MVP)
- [x] Google OAuth restricted to AUIS domain
- [x] Role-based access (Submitter / Technician / Admin)
- [x] Ticket submission with category, priority, file/screenshot attachments
- [x] Ticket list (scoped by role) and detail view
- [x] Status updates (Open → In Progress → Resolved → Closed)
- [x] Comments on tickets
- [x] Basic dashboard with ticket counts and avg. resolution time

## Ideas for later (good "future work" section for your PM docs)
- Auto-assignment logic (round robin or by category/technician specialty)
- Email notifications on status change (Resend or Nodemailer)
- SLA timers / overdue ticket alerts
- Per-technician workload view on dashboard
- Search/filter UI on ticket list (API already supports `?status=` and `?priority=`)
- Admin panel to manually change user roles (currently CLI-only via seed script)
