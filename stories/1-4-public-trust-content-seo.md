# Story 1.4: Public Trust Content and SEO Entry Pages

Status: done

<!-- Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a search-driven user,
I want to find credible supporting content before I commit,
so that I feel this product is grounded in real recovery knowledge.

## Acceptance Criteria

1. **AC1 - Public SEO content route exists**
   **Given** a user lands on a public content URL
   **When** they open the first keyword-targeted article page
   **Then** the site renders a readable long-form content template
   **And** the route fits the approved English single-site structure without introducing `[locale]`, CMS, or authentication.

2. **AC2 - SEO metadata is article-specific**
   **Given** the public article route is rendered
   **When** metadata is generated
   **Then** the article has a specific title and description aligned with post-cast finger or metacarpal recovery search intent
   **And** the metadata does not reuse a generic landing-page title.

3. **AC3 - Content reinforces trust without medical overclaiming**
   **Given** a cautious user reads the article
   **When** they inspect the content
   **Then** it references the product's informational boundary, common post-cast uncertainty, and when to contact a clinician
   **And** it avoids diagnosis, treatment guarantees, doctor-approved claims, or prescriptive medical instructions.

4. **AC4 - Article includes a clear conversion path**
   **Given** a user finishes or scans the article
   **When** they decide they want structured help
   **Then** the page includes a clear `Start my 2-minute quiz` CTA pointing to `/onboarding`
   **And** the CTA does not require onboarding, payment, auth, or checkout to be implemented in this story.

5. **AC5 - Legal shell and public trust pages remain reachable**
   **Given** the current legal pages already exist
   **When** Story 1.4 is implemented
   **Then** `/legal/privacy`, `/legal/terms`, `/legal/refund`, and `/legal/disclaimer` continue to render with their existing test ids
   **And** the article links to relevant legal or disclaimer content where it helps user trust.

6. **AC6 - Regression coverage protects the new public content surface**
   **Given** Story 1.1-1.3 marketing shell and landing sections are already complete
   **When** Story 1.4 changes are implemented
   **Then** existing landing, FAQ, footer CTA, legal, 404, and mobile no-horizontal-overflow E2E coverage continue to pass
   **And** new E2E coverage proves the public article page renders, exposes metadata-critical copy, and links to `/onboarding`.

## Tasks / Subtasks

- [x] **T1 - Define the first public content source** (AC: 1, 2, 3)
  - [x] 1.1 Create a Git-managed content source for the first keyword-targeted article; prefer `content/blog/<slug>.json` or a small typed content module if JSON import friction appears.
  - [x] 1.2 Use the first slug `finger-stiff-after-cast-removal` unless implementation constraints require a clearer slug.
  - [x] 1.3 Include title, description, excerpt, updated date, keywords, sections, and disclaimer/trust callout content.
  - [x] 1.4 Keep content English-only and focused on post-cast finger/metacarpal stiffness uncertainty.

- [x] **T2 - Implement `/blog/[slug]` public article route** (AC: 1, 2, 3, 4, 5)
  - [x] 2.1 Add `src/app/(marketing)/blog/[slug]/page.tsx`.
  - [x] 2.2 Implement `generateStaticParams` for the initial article slug.
  - [x] 2.3 Implement `generateMetadata` with article-specific title and description.
  - [x] 2.4 Render a readable long-form article layout using existing Tailwind and `.container` patterns.
  - [x] 2.5 Return `notFound()` for unknown blog slugs.
  - [x] 2.6 Include a legal/disclaimer link, preferably `/legal/disclaimer`, in the article trust callout or footer.

- [x] **T3 - Add article conversion CTA** (AC: 4)
  - [x] 3.1 Include one clear primary CTA with text exactly `Start my 2-minute quiz`.
  - [x] 3.2 Link the CTA to `/onboarding`.
  - [x] 3.3 Add short supporting copy that frames the product as a structured 14-day companion, not a diagnosis or treatment replacement.

- [x] **T4 - Preserve current public shell boundaries** (AC: 5, 6)
  - [x] 4.1 Keep existing legal route files and test ids intact unless a regression proves a direct fix is needed.
  - [x] 4.2 Do not add `/pricing`, onboarding, payment, auth, analytics, CMS, MDX, RAG indexing, or database-backed content in this story.
  - [x] 4.3 Do not add `[locale]`, dictionaries, or `next-intl`.
  - [x] 4.4 Do not weaken Story 1.2/1.3 landing assertions.

- [x] **T5 - Update Playwright coverage for Story 1.4** (AC: 1, 2, 3, 4, 5, 6)
  - [x] 5.1 Update `e2e/marketing-shell.spec.ts`; do not create a second E2E file unless the spec becomes too large.
  - [x] 5.2 Assert the first article route renders by visiting `/blog/finger-stiff-after-cast-removal`.
  - [x] 5.3 Assert article heading, representative trust/medical-boundary copy, and the `/legal/disclaimer` link.
  - [x] 5.4 Assert the article CTA text and `href="/onboarding"`.
  - [x] 5.5 Assert unknown blog slugs return the not-found page.
  - [x] 5.6 Preserve existing legal route and landing E2E coverage.
  - [x] 5.7 Run `pnpm typecheck`, `pnpm lint`, and `pnpm test:e2e` after implementation.

### Review Findings

- [x] [Review][Patch] Static blog content interface did not explicitly carry readonly constraints through nested article fields — fixed by marking article, section, keyword, and trust callout fields as readonly. [`src/lib/content/blog.ts`]

## Dev Notes

### Product and UX Intent

- Story 1.4 closes Epic 1 by creating the first public trust / SEO entry surface beyond the landing page.
- The target user may arrive from Google, Reddit, or a shared link before trusting the product enough to start the quiz.
- The article should feel like credible educational support, not a medical protocol and not generic SEO filler.
- Keep all public content English-only.
- Primary CTA remains fixed: `Start my 2-minute quiz`.
- Medical boundary remains explicit: education and companion only, not diagnosis, not treatment replacement.
- Source: `epics.md` Epic 1 Story 1.4, `UX设计规格说明.md` §5.2-§5.7 and §9.5, `技术架构详细设计.md` §6 Code Structure and §7.1 Public Routes, `产品Brief.md` §1, §5, §6, §8.

### Current Real Code Baseline

- `src/app/(marketing)/page.tsx` currently implements Landing sections through Story 1.3:
  - `landing-hero`
  - `landing-pain-points`
  - `landing-how-it-works`
  - `landing-what-you-get`
  - `landing-safety`
  - `landing-faq`
  - `landing-footer-cta`
- `src/components/marketing/landing-faq.tsx` is a focused client component used only by the landing FAQ. Do not reuse it for article content unless the article truly needs interactive FAQ behavior.
- Legal pages already exist:
  - `src/app/(marketing)/legal/privacy/page.tsx` with `data-testid="legal-privacy"`.
  - `src/app/(marketing)/legal/terms/page.tsx` with `data-testid="legal-terms"`.
  - `src/app/(marketing)/legal/refund/page.tsx` with `data-testid="legal-refund"`.
  - `src/app/(marketing)/legal/disclaimer/page.tsx` with `data-testid="legal-disclaimer"`.
- There is currently no `src/app/(marketing)/blog/[slug]/page.tsx`.
- There is currently no `content/` directory. Story 1.4 may create the first static content source.
- `e2e/marketing-shell.spec.ts` currently has 12 passing tests covering landing shell, Story 1.3 FAQ/trust sections, legal routes, unknown route 404, and mobile no-horizontal-overflow.

### Required Implementation Pattern

- Use Next.js App Router under `src/app/(marketing)/blog/[slug]/page.tsx`.
- Keep the article route public and unauthenticated.
- Use Server Component rendering for the article page.
- Use `generateStaticParams` for the initial slug.
- Use `generateMetadata` from typed content data.
- Use `notFound()` for unknown slugs.
- Reuse `Button` from `src/components/ui/button.tsx` for the CTA.
- Reuse `.container`, Tailwind 4 utility classes, and existing card/border visual patterns.
- If content lives under `content/blog`, keep it static and Git-managed. Do not introduce CMS, MDX dependencies, file-system runtime reads, or database reads in this story.
- If JSON imports are awkward with the current TypeScript config, use a small typed module such as `src/lib/content/blog.ts` and note the choice in Dev Agent Record during implementation.

### Content Guardrails

- Recommended first article intent: users searching after cast removal because their finger still feels stiff, swollen, or scary to move.
- Safe article title direction:
  - `Finger Still Stiff After Cast Removal? What to Know Before You Start Moving Again`
- Safe article themes:
  - why this moment feels confusing,
  - why generic search results are fragmented,
  - what the product can help structure,
  - danger signs that should prompt contacting a clinician,
  - why the 14-day companion starts with a quiz.
- Avoid claims like:
  - `doctor-approved`,
  - `guaranteed recovery`,
  - `cure stiffness`,
  - `treatment plan`,
  - `clinically proven`,
  - `FDA compliant`.
- Do not give exact medical exercise prescriptions, reps, or timelines in the public article. Program-specific instructions belong to paid content in later epics.
- Link to `/legal/disclaimer` for the full medical disclaimer.

### Testing Requirements

- Update existing `e2e/marketing-shell.spec.ts`; do not weaken existing Story 1.1-1.3 tests.
- Add article assertions for:
  - route `/blog/finger-stiff-after-cast-removal`,
  - article heading,
  - representative body copy around cast removal / stiffness,
  - medical boundary copy,
  - `/legal/disclaimer` link,
  - `Start my 2-minute quiz` CTA linking to `/onboarding`.
- Add an unknown blog slug assertion. It may share the existing not-found heading expectation.
- Preserve legal route loop and global unknown route test.
- Run after implementation:
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm test:e2e`

### Scope Exclusions

- No CMS.
- No MDX dependency.
- No public FAQ route unless implementation naturally stays small; the required deliverable is one keyword-targeted article route.
- No `/pricing` implementation.
- No analytics events; Epic 7 owns tracking.
- No onboarding, checkout, Stripe, auth, or payment work.
- No RAG indexing or `KnowledgeDocument` persistence.
- No Prisma schema changes.
- No legal policy finalization beyond preserving existing legal pages and linking to them.

### Project Structure Notes

- Files expected to change or be created:
  - `src/app/(marketing)/blog/[slug]/page.tsx`
  - `e2e/marketing-shell.spec.ts`
  - either `content/blog/finger-stiff-after-cast-removal.json` or `src/lib/content/blog.ts`
- Files expected to remain unchanged unless a direct regression requires otherwise:
  - `src/app/(marketing)/page.tsx`
  - `src/components/marketing/landing-faq.tsx`
  - `src/components/marketing/marketing-header.tsx`
  - `src/components/marketing/marketing-footer.tsx`
  - `src/app/(marketing)/legal/**/page.tsx`
  - `prisma/schema.prisma`
  - `package.json`

### Previous Story Intelligence

- Story 1.3 is authoritative as `done` in `stories/sprint-status.yaml`.
- Story 1.3 added a client FAQ component, a stronger safety section, and a footer CTA on the Landing page.
- Story 1.3 review follow-up expanded E2E coverage for all FAQ answer copy plus click, Tab, Enter, and Space interactions.
- Story 1.3 confirmed that legal routes are still placeholder-level but reachable and covered by E2E.
- Playwright mobile intentionally uses Chromium mobile viewport. Do not switch to a WebKit/iPhone preset.
- Recent git commit titles are not descriptive (`1`), so rely on story files and actual code rather than commit messages.

### References

- `epics.md` §Requirements Inventory and Epic 1 Story 1.4.
- `UX设计规格说明.md` §5.2 Landing entry/exit, §5.5 page states, §5.7 Story L4, §9.5 accessibility.
- `技术架构详细设计.md` §6 Code Structure, §7.1 Public Routes, §7.5 Landing Page, §11 AI/RAG/Safety future context.
- `产品Brief.md` §1 Executive Summary, §5 Product Scope, §6 MVP, §8 Risk and Mitigation.
- `stories/1-3-safety-faq-conversion-confidence.md` previous story implementation and review fixes.

## Dev Agent Record

### Agent Model Used

GPT-5.5

### Debug Log References

- Red phase: `pnpm test:e2e` failed as expected before `/blog/[slug]` existed; the new article test received the generic landing title.
- Green/refine phase: narrowed Playwright article assertions to avoid strict-mode collisions with repeated article/footer text.
- Final validation: `pnpm typecheck`, `pnpm lint`, and `pnpm test:e2e` pass.
- Code review patch validation: after readonly content type hardening and metadata keyword copy, `pnpm typecheck`, `pnpm lint`, and `pnpm test:e2e` pass.

### Completion Notes List

- Created a typed, Git-managed blog content source at `src/lib/content/blog.ts`. Chose a typed module instead of JSON so article data and route helpers stay type-safe without runtime file reads or CMS/MDX setup.
- Added the public `/blog/finger-stiff-after-cast-removal` route with static params, article-specific metadata, readable long-form layout, `notFound()` for unknown slugs, a `/legal/disclaimer` trust link, and the required `/onboarding` CTA.
- Preserved legal route files and existing Landing / FAQ / footer CTA assertions; no auth, payment, CMS, database, localization, analytics, or pricing scope was added.
- Expanded `e2e/marketing-shell.spec.ts` to cover the public article page and unknown blog slug while keeping existing marketing, legal, 404, and mobile overflow coverage.
- Addressed the only patch-level code review finding by making the blog content interfaces explicitly readonly and copying readonly keywords when passing them into Next metadata.

### File List

- `src/lib/content/blog.ts`
- `src/app/(marketing)/blog/[slug]/page.tsx`
- `e2e/marketing-shell.spec.ts`
- `stories/1-4-public-trust-content-seo.md`
- `stories/sprint-status.yaml`
- `项目主档案.md`

### Change Log

- 2026-04-26: Implemented Story 1.4 public trust article route and E2E coverage; moved story to `code-review`.
- 2026-04-26: Addressed lightweight code review patch finding; moved story to `done`.
