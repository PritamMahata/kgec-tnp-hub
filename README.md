# KGEC TNP Hub

A full placement-workflow app: a Student side (personalized job feed, application
tracker, calendar, action center) and a TNP Office side (drive creation, an
automatic eligibility engine, document uploads, correction/versioning, and an
AI notice-parser that turns a pasted WhatsApp-style notice into a structured
draft for review).

This is the Next.js follow-up to an HTML prototype — same design language,
now backed by a real database, real auth, and real file storage.

## Quick start

```bash
npm install
cp .env.example .env      # already done if you unzipped this as-is
npm run dev
```

Open http://localhost:3000. The database and 120 synthetic students are
created and seeded automatically on the first request — there's no separate
migrate/seed step.

- **Student login:** roll number `21CS0142` signs in as the seeded demo
  student (Pritam Sarkar, CSE, batch 2027) with a realistic mix of
  applications already in flight. Any other roll number creates a fresh
  profile from the fields on the login screen.
- **TNP Office login:** passcode `tnpadmin` (change via `ADMIN_PASSCODE` in
  `.env`).

## What's implemented

**Student:** dashboard, opportunities feed with a live eligibility checklist
per drive, application tracker with pipeline visualization, calendar, action
center (do-now / upcoming / just-updated), editable profile that the
eligibility engine reads from immediately.

**TNP Office:** dashboard with real per-company funnel numbers (computed from
the database, not hardcoded), Create Drive (manual form **or** paste-a-notice
→ "Extract with AI" → review → publish), drive detail page (add a correction
that bumps the version and notifies students, add a round, upload a
document, change any applicant's status), students roster with live
eligibility counts.

**AI notice-parser:** `/api/parse-notice` sends the pasted text to the
Anthropic API with a strict JSON-only extraction prompt and returns the
draft for the admin to edit before anything is published — nothing is ever
auto-published. Requires `ANTHROPIC_API_KEY` in `.env`; without it, this one
button returns a clear error and the rest of the app is unaffected.

## Stack, and why

- **Next.js 14 (App Router)** — server components read the database
  directly; a handful of client components handle the interactive bits
  (apply button, forms, file upload).
- **Database: Node's built-in `node:sqlite`**, not Prisma. This sandbox's
  network egress couldn't reach Prisma's engine-binary CDN, and rather than
  hand you a project that can't `npm install` in a similarly locked-down CI
  or grading environment, everything runs on `node:sqlite` — zero external
  services, zero native-binary downloads, `npm install && npm run dev` and
  you're running. It needs **Node 22.5+**. The whole database layer lives in
  one file, `src/lib/db.js`; every query goes through it. Swapping to
  Postgres + Prisma for a real multi-instance deployment means rewriting
  that one file and keeping the exported function names the same — nothing
  else in the app talks to SQLite directly. `node:sqlite` is marked
  "experimental" by Node itself; it's stable enough for this, but that's
  worth knowing before you rely on it for something load-bearing.
- **Auth is deliberately simple**: a cookie holding a base64 JSON blob, not
  a signed/encrypted session token, and the "admin" role is a single shared
  passcode rather than per-person accounts. Fine for a self-hosted college
  project behind normal HTTPS; not fine as-is for anything handling real
  personal data at scale. `src/lib/session.js` is the one file to replace
  with NextAuth.js (or your institution's SSO) when that matters — every
  page and API route reads the session through `getSession()` there.
- **File uploads** are written to `public/uploads/<jobId>/...` on local
  disk. That's fine for local dev or a server with a persistent disk; on a
  serverless host (Vercel, etc.) that filesystem is ephemeral, so point
  `UPLOAD_DIR` at S3/R2/etc. instead and adjust
  `src/app/api/jobs/[id]/documents/route.js`.

## Environment variables

See `.env.example` for the full list with explanations. The short version:
nothing is required to run the app itself; `ANTHROPIC_API_KEY` is only
needed for the AI notice-parser button.

## Known limitations / what a production version would add next

- Auth and file storage, as above.
- No password reset, email verification, or real student-identity
  proofing — a roll number alone gets you in, which is fine for a demo,
  not for production.
- The AI parser reads pasted text only; there's no PDF/image OCR step, so a
  scanned notice would need to be transcribed first.
- No pagination on the students/applicants tables (capped at a readable
  slice); fine at hundreds of rows, would need real pagination at
  thousands.
- `npm audit` will flag a couple of Next.js advisories that mostly apply to
  features this app doesn't use (custom servers, i18n routing, remote image
  patterns) — worth a look before a public production deployment, but pinned
  here to the latest 14.2.x patch rather than jumping to a major version
  this project hasn't been tested against.
- Sections 20 (QR attendance) and 32's "auto-extract from a forwarded
  WhatsApp bot" pipeline from the original spec aren't built — the
  notice-parser covers the AI-extraction half of that idea, but there's no
  WhatsApp Business API integration here.
