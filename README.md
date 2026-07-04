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
npm install --legacy-peer-deps
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

Remember to add yourself (and anyone testing) as a **Test user** under
Google Auth Platform → Audience, while the app is in "Testing" publishing status.

### 4. Set up UploadThing
1. Go to https://uploadthing.com, create a free account and a new app.
2. Copy the API keys into `.env` as `UPLOADTHING_SECRET` and `UPLOADTHING_APP_ID`.

### 5. Set up Resend (optional — email notifications)
1. Go to https://resend.com, create a free account.
2. Create an API key, paste it into `.env` as `RESEND_API_KEY`.
3. On the free tier without a verified domain, `onboarding@resend.dev` as the
   `EMAIL_FROM` works for testing. Once you have a real domain, verify it in
   Resend and update `EMAIL_FROM`.
4. If you skip this entirely, the app still works — emails are just logged to
   the console instead of sent.

### 6. Generate a NextAuth secret
```bash
openssl rand -base64 32
```
Paste the result into `.env` as `NEXTAUTH_SECRET`.

### 7. Copy the env file and fill it in
```bash
cp .env.example .env
```

### 8. Push the Prisma schema to your database
```bash
npx prisma db push
```

### 9. Run the dev server
```bash
npm run dev
```
Visit http://localhost:3000, sign in with your AUIS Google account.

### 10. Promote yourself to Admin
The first time, you still need the CLI since no admin exists yet:
```bash
npx tsx prisma/seed.ts your.email@auis.edu.krd ADMIN
```
After that, use the in-app **People** panel (visible in the sidebar under
"Manage" once you're an Admin) to promote anyone else — no CLI needed.

## Project structure
```
src/
  app/
    api/
      auth/[...nextauth]/   NextAuth handler
      tickets/              Ticket CRUD + comments (sends email on create/status/comment)
      dashboard/            Aggregate stats
      admin/users/          Role management (admin only)
      uploadthing/          File upload handler
    tickets/                Ticket list (search + filter), new ticket form, ticket detail
    dashboard/               Stats page (technician/admin only)
    admin/users/             People panel — change roles from the UI (admin only)
  components/                Sidebar, SignInButton, StatusBadge, Toast, PageContainer
  lib/                       auth.ts, prisma.ts, uploadthing.ts, email.ts
prisma/
  schema.prisma              Data model
  seed.ts                    Role-promotion helper script (first admin only)
```

## Design system
Built around a literal "ticket stub" metaphor — see the homepage and ticket
list cards. Tokens live in `tailwind.config.ts`:
- **Colors**: navy (primary), brass (accent), paper (background), resolved-green, urgent-clay
- **Type**: Fraunces (display/headings), Inter (body/UI), IBM Plex Mono (ticket IDs, statuses, timestamps)
- **Layout**: persistent sidebar app-shell for daily use, not a marketing-style top nav

## What's built

**Core (MVP)**
- [x] Google OAuth restricted to AUIS domain
- [x] Role-based access (Submitter / Technician / Admin)
- [x] Ticket submission with category, priority, file/screenshot attachments
- [x] Status updates (Open → In Progress → Resolved → Closed)
- [x] Comments on tickets

**Phase 1 (daily-use readiness)**
- [x] Full visual redesign — sidebar app-shell, custom type/color system, ticket-stub cards
- [x] Search + status filter on the ticket list
- [x] Email notifications on ticket creation, status changes, and new comments (Resend)
- [x] In-app admin "People" panel for role management (no more CLI after the first admin)
- [x] Toast confirmations for actions (status update, comment posted)
- [x] Empty states and loading skeletons throughout

**Phase 2 (workflow depth)**
- [x] SLA due dates — auto-calculated from priority on creation (Urgent: 4h, High: 24h, Medium: 3d, Low: 7d), recalculated if priority changes
- [x] Overdue flagging — shown on both the ticket list and ticket detail page
- [x] Internal notes — technicians/admins can post notes marked "not visible to submitter," kept separate from public comments
- [x] One-click "Claim ticket" button for technicians/admins on unassigned tickets
- [x] CSV export from the dashboard — all tickets with status, priority, assignee, timestamps

## Ideas for later phases
**Phase 3**: rate limiting, error monitoring (Sentry), audit trail, staging
environment separate from production database, configurable SLA windows (currently hardcoded in `src/lib/sla.ts`)
