# Story 1.1: Fast, Trustworthy Marketing Shell

Status: ready-for-dev

<!-- Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a prospective fracture recovery user,
I want the website to load as a fast, credible English product site,
so that I trust it enough to keep reading instead of bouncing.

## Acceptance Criteria

1. **AC1 - Project bootstrapped from approved stack**
   **Given** the repository is initialized from the approved stack
   **When** a developer runs `pnpm install` and `pnpm dev`
   **Then** the app boots on Next.js 16 App Router + React 19 + TypeScript 5 + Tailwind CSS 4 + `pnpm` with no lint or typecheck errors
   **And** the toolchain matches `技术架构详细设计.md` §2-§3 and `lease-guard` scaffolding.

2. **AC2 - Root marketing shell renders on mobile and desktop**
   **Given** the public site is deployed or running locally
   **When** a user opens `/` on a mobile viewport (≤ 375 px) and on a desktop viewport (≥ 1280 px)
   **Then** the root marketing shell renders without layout overflow, hydration errors, or console errors
   **And** the page behaves mobile-first with stable responsive spacing (single-column mobile, container-constrained desktop).

3. **AC3 - Shared providers, layout, SEO and monitoring foundation in place**
   **Given** the architecture defines a reusable foundation
   **When** the root layout renders
   **Then** it wraps children with `Providers` (SessionProvider + QueryProvider + ThemeProvider + Toaster), root `<html lang="en">` and default `metadata` (title/description/openGraph/twitter/robots)
   **And** Sentry client/server/edge configs plus `instrumentation.ts` are loaded and capture a smoke error in dev
   **And** `scripts/verify-env.ts` validates core env vars and is wired to `pnpm deploy:verify`.

4. **AC4 - Product-like visual structure, not a blog article**
   **Given** a user lands on the site
   **When** the first screen is shown
   **Then** the visual structure reads as a product landing shell (top navigation, centered hero slot, footer) rather than a blog article layout
   **And** the hero slot exposes a clearly styled primary CTA placeholder (copy/behavior is intentionally left to Story 1.2).

5. **AC5 - Global header, footer and legal links**
   **Given** the marketing shell is rendered
   **When** a user inspects the top and bottom of any `(marketing)` route
   **Then** a global `MarketingHeader` shows the product wordmark and a single primary CTA slot
   **And** a global `MarketingFooter` shows copyright, disclaimer line and links to `/legal/privacy`, `/legal/terms`, `/legal/refund`, `/legal/disclaimer`
   **And** the four legal routes render placeholder pages with the shared shell (real copy lands in Story 1.4).

6. **AC6 - No multi-locale, no `[locale]` routing**
   **Given** v1 is English-only
   **When** a developer inspects the route tree and dependencies
   **Then** there is no `[locale]` segment, no `next-intl` dependency, and no dictionary-provider wiring
   **And** all user-facing strings are hardcoded in English in components (i18n is explicitly out of scope).

7. **AC7 - Baseline E2E shell smoke passes**
   **Given** Playwright is configured
   **When** the smoke spec runs `pnpm test:e2e`
   **Then** the test navigates `/`, asserts the shell renders (header wordmark, footer disclaimer, hero region) and returns HTTP 200
   **And** the test passes on both mobile and desktop viewports.

## Tasks / Subtasks

- [ ] **T1 - Scaffold Next.js 16 project from approved stack** (AC: 1)
  - [ ] 1.1 Run `pnpm create next-app@latest` targeting Next.js 16 + App Router + TypeScript + Tailwind + ESLint; confirm React 19 and Next 16 in `package.json`
  - [ ] 1.2 Pin versions aligned with `lease-guard/package.json` (next `16.x`, react `19.x`, tailwindcss `^4`, typescript `^5`, `@tanstack/react-query`, `next-auth@^4`, `@sentry/nextjs`, `next-themes`, `sonner`, `zod`, `zustand`, `react-hook-form`, `lucide-react`, `clsx`, `tailwind-merge`, `class-variance-authority`, `@prisma/client`, `prisma`, `@playwright/test`)
  - [ ] 1.3 Do NOT install `next-intl` (v1 single-locale constraint per ADR-002)
  - [ ] 1.4 Configure `tsconfig.json` with `@/*` path alias and `strict: true`
  - [ ] 1.5 Add `pnpm-workspace.yaml` if needed; set `packageManager` in `package.json` to pnpm
  - [ ] 1.6 Commit as `chore: bootstrap next.js 16 app shell`

- [ ] **T2 - Copy directly-reusable infrastructure from `lease-guard`** (AC: 1, 3)
  - [ ] 2.1 Copy `lease-guard/next.config.ts` → `next.config.ts`; remove any `next-intl` plugin, strip i18n routing
  - [ ] 2.2 Copy `lease-guard/instrumentation.ts`, `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` as-is, update `dsn` env var reference to `process.env.SENTRY_DSN`
  - [ ] 2.3 Copy `lease-guard/playwright.config.ts` → `playwright.config.ts`; update `baseURL` and `projects` for mobile + desktop viewports
  - [ ] 2.4 Copy `lease-guard/src/lib/prisma.ts` → `src/lib/prisma.ts` (leave schema work to Epic 3)
  - [ ] 2.5 Copy `lease-guard/src/lib/query-client.ts` → `src/lib/query-client.ts`
  - [ ] 2.6 Copy providers: `src/components/providers/query-provider.tsx`, `session-provider.tsx`, and a trimmed `index.tsx` that excludes `dictionary-provider.tsx` (v1 is single-locale)
  - [ ] 2.7 Create `src/lib/utils.ts` with shadcn-standard `cn` helper (clsx + tailwind-merge)

- [ ] **T3 - Set up Tailwind 4 + shadcn/ui base** (AC: 2, 4)
  - [ ] 3.1 Configure `tailwind.config.ts` (or `@tailwindcss/postcss` CSS-first approach) with brand tokens; keep palette minimal and trust-oriented (neutral + accent + semantic success/warning/danger)
  - [ ] 3.2 Create `src/app/globals.css` with Tailwind 4 directives and CSS variables for theme (light + dark)
  - [ ] 3.3 Install shadcn-style `Button` and `Sonner` primitives under `src/components/ui/` (aligned with `lease-guard` radix versions)
  - [ ] 3.4 Do NOT bulk-generate every shadcn component; only add what the shell needs (button, sonner)

- [ ] **T4 - Build root layout with providers and SEO** (AC: 2, 3, 6)
  - [ ] 4.1 Create `src/app/layout.tsx` as a Server Component, `<html lang="en" suppressHydrationWarning>`
  - [ ] 4.2 Render `<Providers>` (SessionProvider + QueryProvider + ThemeProvider + Toaster) around `{children}`
  - [ ] 4.3 Export root `metadata` (title template, description, openGraph, twitter card, robots, canonical base URL from `NEXT_PUBLIC_APP_URL`)
  - [ ] 4.4 Export `viewport` (width=device-width, initialScale=1, mobile-first) as a separate export per Next 16 conventions
  - [ ] 4.5 Ensure hydration parity: no `window`/`document` use in Server Components; `"use client"` only in provider files

- [ ] **T5 - Build `(marketing)` route group with shared header/footer** (AC: 2, 4, 5)
  - [ ] 5.1 Create `src/app/(marketing)/layout.tsx` wrapping children with `<MarketingHeader />` and `<MarketingFooter />`
  - [ ] 5.2 Create `src/components/marketing/marketing-header.tsx`: product wordmark on the left, single primary CTA slot on the right; sticky on mobile only if it doesn't cover the hero CTA; use `lucide-react` icons sparingly
  - [ ] 5.3 Create `src/components/marketing/marketing-footer.tsx`: copyright line, one-line disclaimer (`Education and companion — not a medical device, not for diagnosis.`), and links to `/legal/privacy`, `/legal/terms`, `/legal/refund`, `/legal/disclaimer`
  - [ ] 5.4 Create `src/app/(marketing)/page.tsx`: renders a minimal hero container with heading placeholder, subheading placeholder, and a disabled-styled primary CTA slot labeled `Start my 2-minute quiz` (behavior lands in Story 1.2); this slot confirms the product-landing feel without implementing hero copy/conversion yet
  - [ ] 5.5 Create placeholder pages under `src/app/(marketing)/legal/{privacy,terms,refund,disclaimer}/page.tsx` — each page exports `metadata` (title/description/noindex:false) and renders a typographic shell with one paragraph `TBD — see Story 1.4`
  - [ ] 5.6 Confirm no `[locale]` folder exists anywhere under `src/app/`

- [ ] **T6 - Environment and config hygiene** (AC: 1, 3)
  - [ ] 6.1 Create `.env.example` with core keys only for this story: `NEXT_PUBLIC_APP_URL`, `SENTRY_DSN`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET` (placeholders are fine; future stories add the rest)
  - [ ] 6.2 Create `scripts/verify-env.ts` by adapting `lease-guard/scripts/verify-env.ts`; validate only the 4 keys above with `zod`; exit non-zero on missing keys in `production` mode
  - [ ] 6.3 Wire `pnpm deploy:verify` and `pnpm build` (`prisma generate && next build`) in `package.json`; keep Prisma step optional-no-op if schema not present yet (use `prisma generate --schema=./prisma/schema.prisma || true` guard if necessary, or defer until Epic 3 and document the gap)
  - [ ] 6.4 Add `.gitignore` entries for `.env*.local`, `.next`, `.vercel`, `playwright-report`, `test-results`, `node_modules`

- [ ] **T7 - Playwright smoke E2E** (AC: 2, 4, 5, 7)
  - [ ] 7.1 Create `e2e/marketing-shell.spec.ts` with two projects: `mobile-chromium` (iPhone 14 viewport) and `desktop-chromium` (1280×800)
  - [ ] 7.2 Test: navigate to `/`, assert response is 200, wordmark visible in header, disclaimer text visible in footer, hero region heading visible, primary CTA slot visible
  - [ ] 7.3 Test: legal links in footer resolve to 200 for `/legal/privacy`, `/legal/terms`, `/legal/refund`, `/legal/disclaimer`
  - [ ] 7.4 Visual smoke: no full pixel snapshot in this story (hero copy lands in 1.2); just assert layout structure

- [ ] **T8 - README and runbook delta** (AC: 1, 3)
  - [ ] 8.1 Update project `README.md` with `Getting Started`: prerequisites (Node 20+, pnpm 8+), `pnpm install`, `pnpm dev`, `pnpm build`, `pnpm test:e2e`, `pnpm deploy:verify`
  - [ ] 8.2 Add an `Environment Variables` section pointing to `.env.example`
  - [ ] 8.3 Reference `技术架构详细设计.md` §3 for the `lease-guard` reuse map

## Dev Notes

### 架构依据与复用策略

- 本 story 属于 Epic 1 的第 1 个 story，也是整个项目的工程起点；首要目标是把 `lease-guard` 基础骨架搬过来并裁剪，而不是现场重写 —— 参见 `技术架构详细设计.md` §2.2 与 §3。
- 严格区分「可直接复制」与「需要改造」两类文件：
  - 直接复制（本 story 内落地）：`next.config.ts`、`instrumentation.ts`、`sentry.*.config.ts`、`playwright.config.ts`、`src/lib/prisma.ts`、`src/lib/query-client.ts`、`providers/query-provider.tsx`、`providers/session-provider.tsx`、`scripts/verify-env.ts` 的结构。
  - 改造后复用（本 story **不**落地，留给 Epic 2/3/4/5）：`src/lib/auth.ts`、`src/lib/stripe/*`、`src/lib/security/rate-limiter.ts`、业务 schema。
  - 明确不复用：`next-intl`、`[locale]` 路由、`dictionary-provider.tsx`、合同上传/PDF/OCR、订阅套餐、团队版、面向中国 provider 的 AI 降级链。
- `providers/index.tsx` 直接复用原文件的组合顺序（SessionProvider → QueryProvider → ThemeProvider → Toaster），但删掉 `dictionary-provider.tsx` 的 import 与包裹层；这是 v1 英文单站约束（ADR-002）的直接体现。

### 技术栈与版本锚点

- Next.js `16.x` App Router + React `19.x` + TypeScript `^5` + Tailwind CSS `^4`（参考 `lease-guard/package.json`）。
- 包管理器固定为 `pnpm 8+`；在 `package.json` 设置 `"packageManager": "pnpm@8.x"`。
- 关键运行时依赖（仅本 story 需要）：`@tanstack/react-query ^5`、`@tanstack/react-query-devtools ^5`、`next-themes ^0.4`、`sonner ^2`、`@sentry/nextjs ^10`、`next-auth ^4`、`@prisma/client ^6`、`zod ^4`、`lucide-react`、`clsx`、`tailwind-merge`、`class-variance-authority`。
- Playwright `^1.57` 仅用于 shell smoke；视觉回归放到 Story 1.2 之后再加。

### 目录与命名必须遵循

- 路由分组：`src/app/(marketing)/...` 和 `src/app/(app)/...`；本 story 只落地 `(marketing)`。
- 不允许出现 `src/app/[locale]/` 这一层。
- 新增业务代码路径遵循 `技术架构详细设计.md` §6 的目录结构：
  - `src/components/providers/`
  - `src/components/ui/`
  - `src/components/marketing/`
  - `src/lib/`（含 `prisma.ts`、`query-client.ts`、`utils.ts`）
  - `scripts/`（含 `verify-env.ts`）
  - `content/`（本 story 预留空目录与 `.gitkeep` 即可）

### SEO 与元数据基线

- 根 `metadata` 至少包含 `title.template`、`title.default`、`description`、`openGraph.{title,description,url,siteName,type:"website",locale:"en_US"}`、`twitter.card:"summary_large_image"`、`metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL)`、`robots: { index: true, follow: true }`。
- 页面级 `metadata` 只覆写 `title`/`description`/`alternates.canonical`，保持模板一致性。
- 不在本 story 做 sitemap、robots.txt、结构化数据；这些属于 Story 1.4。

### 共享交互与视觉约束

- 按钮层级（来自 `UX设计规格说明.md` §4.1）：Primary / Secondary / Tertiary / Danger；每屏仅一个 Primary。本 story 只需预留 Primary 的视觉样式，不实现点击行为。
- 合规边界文案需始终可见（`NFR5`、`UX-DR9`）。Footer 里的一句 disclaimer 是本 story 的主要承载位。
- 设计 mobile-first：`(marketing)/layout.tsx` 用 Tailwind `container mx-auto px-4 md:px-6 lg:px-8`，headline 排版在移动端单列、桌面端保持同一中轴。
- 不做深色/浅色 visual 差异化设计，但 `ThemeProvider` 必须装上（后续 Story 可能开启），`defaultTheme="system"`、`enableSystem`、`disableTransitionOnChange`。

### 可观测性基线

- Sentry 仅配置 `dsn`、`tracesSampleRate: 0.1`、`environment: process.env.NODE_ENV`；`replaysSessionSampleRate` 与 `replaysOnErrorSampleRate` 先留空或默认（本 story 不做 session replay）。
- `instrumentation.ts` 走 Next 16 官方写法，`register()` 内部根据 `NEXT_RUNTIME` 分发到 `sentry.server.config` 或 `sentry.edge.config`。
- 埋点（`landing_view` 等）不在本 story 落地，属于 Epic 7 Story 7.1。

### 不做什么（显式边界）

- 不实现 Hero 的真实文案、CTA 行为、跳转 `/onboarding` —— 留给 Story 1.2。
- 不实现 Pain Points / How It Works / What You Get / FAQ / Safety 区块 —— 留给 Story 1.2 / 1.3。
- 不实现 NextAuth 路由、Stripe 路由、Prisma schema、业务 API —— 留给 Epic 2/3。
- 不做多语言、`[locale]`、`next-intl`、dictionary-provider。
- 不做内容 CMS 集成（ADR：内容在 `content/` 目录，本 story 只建空目录）。
- 不做 Prisma migration / Supabase 真实连接 —— `prisma.ts` 复制过来即可，真正的 `schema.prisma` 在 Story 3.1。

### 低风险陷阱提醒

- Next 16 App Router 下，`viewport` 必须从 `metadata` 中拆出来单独 `export const viewport`，否则会报 warning。
- `ThemeProvider` 必须在 Client Component 内；`src/components/providers/index.tsx` 文件头保留 `"use client"`。
- Tailwind v4 推荐 CSS-first 配置（`@import "tailwindcss"` + `@theme` 块），不需要 `tailwind.config.ts`。如选择 v4 CSS-first，确认 `@tailwindcss/postcss` 已装。
- 从 `lease-guard` 复制文件时，务必替换掉硬编码的 `lease-guard` 字眼和双语文案；尤其 `providers/index.tsx` 里不要把 `dictionary-provider` 引用留下。
- 若 `next.config.ts` 里还带 `next-intl` 插件包裹，记得删掉 `withNextIntl(...)` 调用。
- Sentry v10 与 Next 16 的集成依赖 `withSentryConfig`，复制 `lease-guard/next.config.ts` 的 `withSentryConfig(...)` 包装层。

### 质量基线

- `pnpm lint` 无 error；`pnpm typecheck`（或 `tsc --noEmit`）无 error。
- `pnpm test:e2e` 在 CI-like 环境下 `mobile-chromium` + `desktop-chromium` 两个 project 全部通过。
- `pnpm deploy:verify` 在缺失任一核心变量时非零退出。
- `pnpm build` 成功产出 `.next/`，无 hydration mismatch 报错。

### Project Structure Notes

- 本项目仓库当前根目录为 **Windows** `D:\work\MyStartupProject1\`、**macOS** `/Users/stark/Desktop/work/MyStartupProject1/`；该目录当时仅有文档（`README.md`、`epics.md`、`技术架构详细设计.md`、`UX设计规格说明.md`、`产品Brief.md`、`路线图与MVP.md`、`项目主档案.md`），无任何代码脚手架。本 story 负责初始化完整工程目录。
- 本 story 交付后，目录应具备：`src/app/(marketing)/`、`src/app/(marketing)/legal/*`、`src/components/providers/`、`src/components/ui/`、`src/components/marketing/`、`src/lib/`、`scripts/`、`e2e/`、`content/`（空目录占位）、`prisma/`（空目录占位）。
- `(app)`、`api/`、业务模块（`lib/auth`、`lib/billing`、`lib/program`、`lib/chat`、`lib/rag`、`lib/safety`）由后续 story 建立，本 story 不预先创建空壳，避免幻像结构。
- 与 `技术架构详细设计.md` §6 目录图的偏差：本 story 暂缓创建 `lib/env/` 子目录，直接用单文件 `scripts/verify-env.ts`；若 Epic 7 的 verify-env 扩展需要子模块，再拆分。

### References

- [Source: epics.md#Epic 1 / Story 1.1]
- [Source: 技术架构详细设计.md#2. 架构原则]
- [Source: 技术架构详细设计.md#3.1 可直接复制]
- [Source: 技术架构详细设计.md#3.3 明确不复用]
- [Source: 技术架构详细设计.md#5. 逻辑分层]
- [Source: 技术架构详细设计.md#6. 目录与模块设计]
- [Source: 技术架构详细设计.md#14.1 监控]
- [Source: 技术架构详细设计.md#15.2 环境变量分组]
- [Source: 技术架构详细设计.md#15.3 环境校验]
- [Source: 技术架构详细设计.md#16. 关键技术决策（ADR 摘要）]
- [Source: 技术架构详细设计.md#18. 实施顺序建议]
- [Source: UX设计规格说明.md#4. 共享交互模式]
- [Source: UX设计规格说明.md#5. Page Spec: Landing]
- [Source: UX设计规格说明.md#5.7 Story 拆分建议]
- [Source: 路线图与MVP.md]（总体 MVP 范围与 FR1/FR11 口径）
- [Source: 产品Brief.md]（合规边界 `education & companion`、`not a medical device`）
- [Reuse base: D:\work\MyStartupProject\lease-guard\next.config.ts]
- [Reuse base: D:\work\MyStartupProject\lease-guard\instrumentation.ts]
- [Reuse base: D:\work\MyStartupProject\lease-guard\sentry.client.config.ts]
- [Reuse base: D:\work\MyStartupProject\lease-guard\sentry.server.config.ts]
- [Reuse base: D:\work\MyStartupProject\lease-guard\sentry.edge.config.ts]
- [Reuse base: D:\work\MyStartupProject\lease-guard\playwright.config.ts]
- [Reuse base: D:\work\MyStartupProject\lease-guard\src\lib\prisma.ts]
- [Reuse base: D:\work\MyStartupProject\lease-guard\src\lib\query-client.ts]
- [Reuse base: D:\work\MyStartupProject\lease-guard\src\components\providers\index.tsx]
- [Reuse base: D:\work\MyStartupProject\lease-guard\src\components\providers\query-provider.tsx]
- [Reuse base: D:\work\MyStartupProject\lease-guard\src\components\providers\session-provider.tsx]
- [Reuse base: D:\work\MyStartupProject\lease-guard\scripts\verify-env.ts]
- [Reuse base: D:\work\MyStartupProject\lease-guard\package.json]（依赖版本锚点）

## Dev Agent Record

### Agent Model Used

_待 dev 执行时填充（建议 Composer 2 Fast / Claude 4.6 Sonnet / GPT-5.4）_

### Debug Log References

_待 dev 执行时填充_

### Completion Notes List

- Ultimate context engine analysis completed — comprehensive developer guide created.
- 本 story 为项目工程起点，严格遵循「复用 `lease-guard` 基础设施 + 不复用业务模型」原则。
- 明确把 Hero/Pain Points/FAQ/Safety 等内容区块推迟到 1.2/1.3/1.4，避免本 story 过载。

### File List

_待 dev 执行时按实际落地文件填写，例如：_

- `package.json` _(new)_
- `pnpm-lock.yaml` _(new)_
- `next.config.ts` _(new)_
- `tsconfig.json` _(new)_
- `playwright.config.ts` _(new)_
- `instrumentation.ts` _(new)_
- `sentry.client.config.ts` / `sentry.server.config.ts` / `sentry.edge.config.ts` _(new)_
- `.env.example` / `.gitignore` _(new)_
- `src/app/layout.tsx` _(new)_
- `src/app/globals.css` _(new)_
- `src/app/(marketing)/layout.tsx` _(new)_
- `src/app/(marketing)/page.tsx` _(new)_
- `src/app/(marketing)/legal/{privacy,terms,refund,disclaimer}/page.tsx` _(new)_
- `src/components/providers/{index,query-provider,session-provider}.tsx` _(new)_
- `src/components/ui/{button,sonner}.tsx` _(new)_
- `src/components/marketing/{marketing-header,marketing-footer}.tsx` _(new)_
- `src/lib/{prisma,query-client,utils}.ts` _(new)_
- `scripts/verify-env.ts` _(new)_
- `e2e/marketing-shell.spec.ts` _(new)_
- `README.md` _(update: add Getting Started section)_
