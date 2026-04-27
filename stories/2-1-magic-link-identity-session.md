# Story 2.1: Magic Link Identity and Session Recovery

Status: done

<!-- Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a prospective paying user,
I want my identity to be created and recoverable without a complex account flow,
so that I can buy and return to my plan with minimal friction.

## Acceptance Criteria

1. **AC1 - NextAuth Magic Link route exists**
   **Given** the current app already has `next-auth`, `SessionProvider`, and Prisma installed
   **When** Story 2.1 is implemented
   **Then** `/api/auth/[...nextauth]` handles NextAuth.js v4 requests in the App Router
   **And** Magic Link email is the primary production auth path.

2. **AC2 - Auth persistence is backed by minimal NextAuth Prisma tables**
   **Given** Magic Link email auth requires persistent verification tokens
   **When** the Prisma schema is updated
   **Then** it includes the minimal NextAuth-compatible `User`, `Account`, `Session`, and `VerificationToken` models
   **And** it does not introduce recovery profile, purchase, program, chat, billing, or RAG business models in this story.

3. **AC3 - Session fields stay minimal and product-aligned**
   **Given** a user is authenticated
   **When** server or client code reads the session
   **Then** the session exposes only `user.id`, `user.email`, `user.hasPurchase`, and `user.activeProgramId`
   **And** `hasPurchase` and `activeProgramId` may safely resolve to `false` / `null` until purchase and program stories add real backing data.

4. **AC4 - Minimal sign-in and recovery UX is available**
   **Given** a user needs identity before purchase or session recovery
   **When** they open the sign-in entry
   **Then** they can enter an email address and request a Magic Link without creating a password account
   **And** development builds provide a safe dev-only shortcut for local E2E without sending real email.

5. **AC5 - Unauthorized protected entry is handled safely**
   **Given** a user opens a protected app route without a valid session
   **When** access control runs
   **Then** the user is redirected to the sign-in flow with a safe callback target
   **And** public marketing, blog, legal, and landing routes remain publicly reachable.

6. **AC6 - Regression coverage protects auth skeleton and existing public shell**
   **Given** Story 1.1-1.4 public routes are already complete
   **When** Story 2.1 changes are implemented
   **Then** existing landing, legal, blog, 404, FAQ, CTA, and mobile E2E coverage continue to pass
   **And** new tests prove the sign-in page renders, dev login can establish a session in development, and unauthenticated users cannot enter the first protected app route.

## Tasks / Subtasks

- [x] **T1 - Add minimal auth persistence and dependencies** (AC: 1, 2)
  - [x] 1.1 Add the NextAuth v4-compatible Prisma adapter package; use `@next-auth/prisma-adapter` for `next-auth@4.x`, not Auth.js v5 handler syntax.
  - [x] 1.2 Add `nodemailer` if Email Provider SMTP transport is used by the implementation.
  - [x] 1.3 Update `prisma/schema.prisma` with only NextAuth-compatible `User`, `Account`, `Session`, and `VerificationToken` models.
  - [x] 1.4 Preserve the existing Postgres datasource and generator; do not add business models here.
  - [x] 1.5 Ensure `pnpm db:generate` and `pnpm typecheck` can run after schema/dependency changes.

- [x] **T2 - Implement NextAuth v4 auth configuration** (AC: 1, 3, 4)
  - [x] 2.1 Add auth configuration under `src/lib/auth/`, e.g. `src/lib/auth/options.ts`; keep it reusable by API routes and server helpers.
  - [x] 2.2 Add `src/app/api/auth/[...nextauth]/route.ts` using the v4 App Router pattern: `const handler = NextAuth(authOptions); export { handler as GET, handler as POST };`.
  - [x] 2.3 Configure Email Provider for Magic Link with project-specific English email copy and product name; remove all `lease-guard` Chinese / tenant / contract copy if reusing code.
  - [x] 2.4 Add a development-only Credentials provider or equivalent test shortcut gated by `process.env.NODE_ENV !== "production"`.
  - [x] 2.5 Implement callbacks so session shape is minimal: `id`, `email`, `hasPurchase`, `activeProgramId`.
  - [x] 2.6 Avoid Google OAuth, password accounts, subscriptions, locale fields, monthly quota fields, debug log spam, or broad JWT payloads.

- [x] **T3 - Add minimal auth UI and protected shell route** (AC: 4, 5)
  - [x] 3.1 Add a public sign-in page, preferably `src/app/(auth)/sign-in/page.tsx`, with email input, Magic Link submit, and clear “check your email” state.
  - [x] 3.2 Add a minimal protected app route, preferably `src/app/(app)/onboarding/page.tsx`, as the first authenticated conversion surface skeleton.
  - [x] 3.3 The protected skeleton may show placeholder onboarding copy only; Story 2.2 owns Eligibility Gate and Story 2.3 owns Recovery Profile form.
  - [x] 3.4 Add server-side access control for the protected skeleton using the shared auth helper; unauthenticated users redirect to sign-in.
  - [x] 3.5 Keep `/`, `/blog/[slug]`, and `/legal/**` public and unchanged unless tests reveal a direct regression.

- [x] **T4 - Update environment documentation and verification** (AC: 1, 4)
  - [x] 4.1 Update `.env.example` with the email variables required for Magic Link, such as `EMAIL_SERVER` / `EMAIL_FROM` or the exact SMTP fields chosen by the implementation.
  - [x] 4.2 Update `scripts/verify-env.ts` to validate the Story 2.1 auth/email variables without requiring Stripe, AI, Upstash, or future story variables.
  - [x] 4.3 Preserve existing `NEXT_PUBLIC_APP_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, and optional Sentry validation behavior.
  - [x] 4.4 Do not add real secrets or provider keys to committed files.

- [x] **T5 - Add E2E coverage for auth skeleton** (AC: 4, 5, 6)
  - [x] 5.1 Extend the existing Playwright suite or add a focused auth spec if the marketing spec becomes too large.
  - [x] 5.2 Assert `/sign-in` renders an email field, Magic Link CTA, and passwordless copy.
  - [x] 5.3 Assert unauthenticated access to `/onboarding` redirects to sign-in with a safe callback URL.
  - [x] 5.4 Assert development-only login can establish a session locally without sending real email.
  - [x] 5.5 Re-run existing public shell E2E to protect Story 1.1-1.4.
  - [x] 5.6 Run `pnpm db:generate`, `pnpm typecheck`, `pnpm lint`, and `pnpm test:e2e` after implementation.

## Dev Notes

### Product and UX Intent

- Story 2.1 opens Epic 2 by adding identity recovery, not by completing onboarding, checkout, or paid access.
- The product wants “buy and return with minimal friction,” so Magic Link must feel like a lightweight recovery mechanism, not a full account setup.
- Public users should be able to read Landing / Blog / Legal without auth. Protected product routes should require a session.
- Source: `epics.md` Epic 2 Story 2.1, FR12, UX-DR3/UX-DR4, and `技术架构详细设计.md` §7.2, §7.3, §8.2, §12.

### Current Real Code Baseline

- `package.json` already includes:
  - `next@16.1.1`
  - `next-auth@^4.24.13`
  - `@prisma/client@^6.19.0`
  - `prisma@^6.19.0`
- `src/components/providers/session-provider.tsx` already wraps `next-auth/react` `SessionProvider`.
- `src/components/providers/index.tsx` already composes `SessionProvider -> QueryProvider -> ThemeProvider -> Toaster`.
- `src/app/layout.tsx` currently renders `<Providers>{children}</Providers>` without passing an initial server session.
- `prisma/schema.prisma` currently has only `generator client` and `datasource db`; no auth models exist yet.
- `src/lib/prisma.ts` exists as the Prisma singleton and should be reused.
- There is no current `src/lib/auth*`, `src/lib/auth/**`, `src/app/api/auth/**`, `(auth)` route group, or `(app)` route group.
- `scripts/verify-env.ts` currently validates only shell-level env vars from Story 1.1 plus optional Sentry DSNs.
- Existing public E2E coverage lives in `e2e/marketing-shell.spec.ts` and currently protects Landing, FAQ, Blog, Legal, 404, and mobile no-horizontal-overflow.

### Required Architecture Pattern

- Use NextAuth.js v4, not Auth.js v5 APIs.
- Use App Router route handler at `src/app/api/auth/[...nextauth]/route.ts`.
- Keep auth config reusable from `src/lib/auth/`.
- Use Prisma adapter with the project’s existing `prisma` singleton.
- Use Magic Link Email as the primary production provider.
- Use a development-only shortcut for local E2E; it must not be available in production.
- Session fields must remain minimal:
  - `user.id`
  - `user.email`
  - `user.hasPurchase`
  - `user.activeProgramId`
- Until purchase/program tables exist, `hasPurchase` should default to `false` and `activeProgramId` to `null`. Do not create fake Purchase or Program models in this story.

### Latest Technical Notes

- NextAuth.js v4 Email Provider requires a database adapter because verification tokens must be persisted.
- NextAuth.js v4 Email Provider uses `nodemailer` for SMTP email sending; add the dependency if using SMTP transport.
- For `next-auth@4.x`, use the v4-compatible Prisma adapter package `@next-auth/prisma-adapter`. Do not copy `lease-guard`’s `@auth/prisma-adapter` import unless the developer first proves type compatibility with the installed NextAuth version.
- App Router v4 route handler pattern is:
  - `import NextAuth from "next-auth"`
  - `const handler = NextAuth(authOptions)`
  - `export { handler as GET, handler as POST }`

### Lease-Guard Reuse Notes

- `D:\work\MyStartupProject\lease-guard\src\lib\auth.ts` is useful only as a reference for:
  - EmailProvider wiring shape
  - dev-only CredentialsProvider concept
  - callback placement
  - route handler pattern via `src/app/api/auth/[...nextauth]/route.ts`
- Do not copy these `lease-guard` pieces:
  - `GoogleProvider`
  - `Plan`, `Locale`, monthly analysis, upload quota, subscription, storage, tenant, lease, contract, bilingual email copy
  - broad debug logging of env vars
  - `@auth/prisma-adapter` import with type casts unless explicitly verified for this repo
- If custom email copy is implemented now, it must be English-only and use Fracture Recovery Companion branding.

### Scope Exclusions

- No Eligibility Gate questions or decisions; Story 2.2 owns them.
- No Recovery Profile form; Story 2.3 owns it.
- No Stripe Checkout, Purchase model, paid unlock, or billing recovery; Story 2.4 and Epic 7 own them.
- No Program, ProgramDay, ChatMessage, KnowledgeChunk, pgvector, RAG, or AI runtime work.
- No Google OAuth, username/password accounts, subscriptions, pricing page, analytics events, or i18n.
- No database seed data beyond what is strictly needed for tests.

### Testing Requirements

- At minimum, automated coverage must prove:
  - `/sign-in` renders passwordless Magic Link copy and email form.
  - `/onboarding` is not reachable unauthenticated.
  - dev-only login establishes an authenticated session locally.
  - public `/`, `/blog/finger-stiff-after-cast-removal`, and `/legal/**` remain public and passing.
- Prefer Playwright for the critical auth flow because this story is about route/session behavior.
- If unit tests are added for auth helpers, keep them behavior-oriented and avoid testing NextAuth internals.
- Required validation commands after implementation:
  - `pnpm db:generate`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm test:e2e`

### Project Structure Notes

- Files expected to change or be created:
  - `package.json`
  - `pnpm-lock.yaml`
  - `prisma/schema.prisma`
  - `.env.example`
  - `scripts/verify-env.ts`
  - `src/lib/auth/options.ts`
  - `src/lib/auth/session.ts` or equivalent shared server auth helper
  - `src/app/api/auth/[...nextauth]/route.ts`
  - `src/app/(auth)/sign-in/page.tsx`
  - `src/app/(app)/onboarding/page.tsx`
  - `e2e/marketing-shell.spec.ts` or a new focused auth E2E file
- Files expected to remain unchanged unless a direct regression requires otherwise:
  - `src/app/(marketing)/**`
  - `src/components/marketing/**`
  - `src/lib/content/blog.ts`
  - `src/app/(marketing)/blog/[slug]/page.tsx`
  - `src/app/(marketing)/legal/**/page.tsx`

### Previous Story Intelligence

- Epic 1 is authoritative as `done` in `stories/sprint-status.yaml`; do not regress public marketing surfaces.
- Story 1.4 added `/blog/finger-stiff-after-cast-removal`, typed blog content, article metadata, and E2E for unknown blog slugs.
- Story 1.4 review hardened readonly typed content and copied readonly keywords into Next metadata. Preserve this pattern when passing readonly data into mutable framework APIs.
- Playwright mobile intentionally uses Chromium via Pixel 5. Do not switch back to a WebKit/iPhone preset.
- Recent git commit titles are non-descriptive (`1`), so rely on story files and actual code rather than commit history for implementation context.

### References

- `epics.md` Requirements Inventory FR12 and Epic 2 Story 2.1.
- `UX设计规格说明.md` §6 Page Spec: Onboarding, especially entry/exit and 3-step structure.
- `技术架构详细设计.md` §3.2 Auth reuse, §6 Code Structure, §7.2 Auth / Conversion Routes, §7.3 Protected App Routes, §8.2 User/Auth models, §12 Auth and Session.
- `README.md` Technical Stack Baseline, where auth is listed as NextAuth.js v4 + Resend Magic Link and Story 2.1 scope.
- `stories/1-4-public-trust-content-seo.md` Previous Story Intelligence and completed public route coverage.

## Dev Agent Record

### Agent Model Used

GPT-5.5

### Debug Log References

- Red phase: `pnpm test:e2e` failed with 6 new auth failures before `/sign-in`, protected `/onboarding`, and dev login existed; existing 16 public shell tests still passed.
- Dependency correction: initial `nodemailer@8` install produced a NextAuth peer warning, so it was adjusted to `nodemailer@^7.0.7`.
- Final validation: `pnpm db:generate`, `pnpm typecheck`, `pnpm lint`, and `pnpm test:e2e` pass; E2E result is 22 passed.
- Lightweight local code review completed after implementation; no real patch-level findings remained.

### Completion Notes List

- Added minimal NextAuth-compatible Prisma auth models only: `User`, `Account`, `Session`, and `VerificationToken`. No recovery, purchase, program, chat, billing, RAG, or analytics models were introduced.
- Added NextAuth v4 auth configuration using `@next-auth/prisma-adapter`, Magic Link Email Provider with English Fracture Recovery Companion email copy, JWT sessions, and a dev-only Credentials provider for local E2E.
- Added shared server session helper, App Router auth route, public `/sign-in` passwordless UI, and protected `/onboarding` skeleton that redirects unauthenticated users to sign-in.
- Updated `.env.example` and `scripts/verify-env.ts` for Story 2.1 auth persistence and Magic Link email variables without requiring future Stripe, AI, or Upstash env vars.
- Added `e2e/auth-shell.spec.ts` covering sign-in rendering, unauthenticated onboarding redirect, and dev-only session recovery; existing public shell coverage remains green.
- Lightweight review checked NextAuth v4/App Router usage, Prisma auth-only schema scope, dev-only Credentials gating, callback URL normalization, protected route behavior, and E2E coverage; no code changes were required.

### File List

- `package.json`
- `pnpm-lock.yaml`
- `prisma/schema.prisma`
- `.env.example`
- `scripts/verify-env.ts`
- `src/types/next-auth.d.ts`
- `src/lib/auth/options.ts`
- `src/lib/auth/session.ts`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/components/auth/sign-in-form.tsx`
- `src/app/(auth)/sign-in/page.tsx`
- `src/app/(app)/onboarding/page.tsx`
- `e2e/auth-shell.spec.ts`
- `stories/2-1-magic-link-identity-session.md`
- `stories/sprint-status.yaml`
- `项目主档案.md`

### Change Log

- 2026-04-27: Implemented Story 2.1 Magic Link identity/session skeleton and E2E coverage; moved story to `code-review`.
- 2026-04-27: Completed lightweight code review with no patch findings; moved story to `done`.
