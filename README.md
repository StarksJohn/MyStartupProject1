# MyStartupProject1

`MyStartupProject1` 当前聚焦的主线产品是：

`Fracture Recovery AI Companion`

这是一个面向海外英语用户的骨折康复 AI 陪伴网站，首版只做 `手指 / 掌骨` 在拆石膏前后 14 天这一极窄场景，核心闭环是：

`Landing -> Onboarding -> One-time Payment -> 14-Day Program -> Daily Completion -> AI Chat -> Completion Report`

## 当前状态

Epic 7 的发布前质量门已完成。Epic 1-7 已覆盖核心 MVP 闭环、发布前 QA、安全回归、环境验证和可观测性门禁；当前发布候选可进入 production configuration / release decision 准备：

`Launch Readiness QA and Regression Safety Net`

Story 7.4 已把已经积累的 Playwright 回归覆盖、环境变量检查、工具链前置要求和发布前人工判断整理成可重复执行的 launch gate；本地 deterministic `pnpm run qa:launch` 已在 Node `20.20.2` + PostgreSQL 17 + pgvector 环境下通过。

已经完成的核心产物：

- `项目主档案.md`：当前阶段、关键结论、下一步入口
- `产品Brief.md`：产品定义、目标用户、MVP 边界、关键决策
- `路线图与MVP.md`：13 周计划、Gate、资源与风险
- `技术架构详细设计.md`：技术方案与 solution design（含 lease-guard 复用映射）
- `UX设计规格说明.md`：Landing / Onboarding / Day / Chat 的可拆 story UX 规格
- `epics.md`：基于以上文档拆出的 epics/stories
- `stories/`：单 story 规格与 `sprint-status.yaml`（当前进度以该文件为准）

## Getting Started

本仓库现在是一个可运行的 Next.js 16 App Router 工程。Next.js 16.1.1 要求 Node `>=20.9.0`；本仓库固定 `packageManager` 为 `pnpm@8.15.0`。

第一次启动：

```bash
node -v   # must be >=20.9.0
pnpm -v   # expected >=8.15.0
pnpm install
cp .env.example .env.local   # 按需填写 NEXTAUTH_SECRET 等值
pnpm dev
```

然后在浏览器打开 <http://localhost:3000>。

常用入口：

- `/` - Landing 页
- `/onboarding` - 登录后的 eligibility / profile / checkout flow
- `/progress` - 付费后的 14-day program 入口
- `/day/[day]` - 每日康复任务
- `/chat` - 付费用户 AI recovery chat
- `/legal/privacy | /legal/terms | /legal/refund | /legal/disclaimer` - 法务与安全边界页面

本地 smoke E2E：

```bash
pnpm dlx playwright install --with-deps   # 首次需要下载浏览器
pnpm test:e2e
```

环境变量自检（部署前）：

```bash
pnpm run deploy:verify
pnpm run deploy:verify:production
```

`deploy:verify` 是本地友好的确定性检查；`deploy:verify:production` 会从本地 shell 显式启用 production-readiness 模式，缺少或格式错误的生产关键变量会阻塞 launch readiness。

## Launch Readiness

Story 7.4 的 launch gate 分为两层：本地确定性 QA 和生产配置验证。

### 工具链前置

- Node：`>=20.9.0`。Next.js 16.1.1 在较低 Node 版本下会阻止 dev server / Playwright 启动；Story 7.3 已在 Node `18.20.8` 上复现过该阻塞。
- pnpm：`>=8.15.0`，当前 `packageManager` 保持为 `pnpm@8.15.0`。
- Playwright：当前配置为 one worker、`Desktop Chrome` + `Mobile Chrome` 两个项目；默认用 `next dev --webpack` 启动测试服务器。如果已经有外部服务器，设置 `PLAYWRIGHT_TEST_BASE_URL` 后会复用该地址。

### 本地确定性 QA

推荐顺序：

```bash
node -v
pnpm -v
pnpm install
pnpm db:generate
pnpm typecheck
pnpm lint
pnpm run deploy:verify
pnpm run qa:launch
```

`qa:launch` 复用现有 Playwright 覆盖形成 launch regression gate：

| Launch area | Existing gate |
| --- | --- |
| Landing, legal, SEO trust content, mobile overflow | `e2e/marketing-shell.spec.ts` |
| Onboarding, profile, dev checkout fallback, checkout success/cancelled states | `e2e/auth-shell.spec.ts` |
| Stripe webhook unlock, idempotency, pending/failure/refund transitions | `e2e/stripe-webhook.spec.ts` |
| Paid Day, completion, report download, sharing, Chat, billing-blocked access | `e2e/program-entry.spec.ts` |
| Analytics no-op/provider behavior and privacy vocabulary | `e2e/analytics-events.spec.ts` |
| Observability sanitization and no-DSN behavior | `e2e/observability.spec.ts` |

Local QA must stay deterministic: dev-mock Stripe checkout, signed test webhook payloads, no-op or mocked analytics, no-DSN Sentry behavior, deterministic chat provider paths, and a reachable local/Supabase Postgres database with Prisma schema applied. It must not call live Stripe, Sentry, Plausible, Umami, Gemini, Groq, Upstash, or send real email.

### Production Configuration Gate

Before public launch, run:

```bash
pnpm run deploy:verify:production
```

This verifies production-critical variable names and formats without printing secret values:

- App/auth/database/email: `NEXT_PUBLIC_APP_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `DATABASE_URL`, `DIRECT_URL`, `EMAIL_SERVER`, `EMAIL_FROM`
- Monitoring: `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`
- Billing: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- AI chat: `GEMINI_API_KEY`, `GROQ_API_KEY`

These remain optional for local deterministic QA unless launch policy changes: `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`, `NEXT_PUBLIC_ANALYTICS_PROVIDER`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.

### Failure Triage

- `node -v` below `20.9.0`：toolchain blocker；升级 Node 后再跑 Playwright。
- `deploy:verify:production` 缺变量：env/config blocker；先补 hosting secrets。
- Prisma / DB 连接失败：DB blocker；检查 Supabase/Postgres URL、pooler、schema generation。
- Auth 或 email flow 失败：auth/email blocker；检查 NextAuth URL/secret 和 SMTP。
- Stripe webhook 或 checkout 状态失败：billing blocker；检查 Stripe keys/webhook secret 与测试签名路径。
- Chat provider / quota 失败：AI/chat blocker；检查 deterministic provider path 或生产 provider key。
- Analytics / observability 失败：monitoring blocker；优先确认没有敏感 payload 泄露。
- 页面断言失败：product assertion blocker；按失败 spec 回到对应 story 代码修复。

记录 release decision 时要写明 `pass / fail / blocked`，不要把 toolchain、env 或 DB 阻塞标成测试通过。

### 技术栈基线

| 类别 | 选型 | 备注 |
| --- | --- | --- |
| 框架 | Next.js 16 App Router + React 19 + TypeScript 5 | |
| 样式 | Tailwind CSS 4（CSS-first）+ shadcn/ui + Radix | `src/app/globals.css` |
| 状态 | @tanstack/react-query v5 + Zustand v5 | `src/lib/query-client.ts` |
| 表单 | React Hook Form + Zod | |
| 数据 | Prisma 6 + Supabase Postgres（含 pgvector） | Story 3.1 接入真实模型 |
| 认证 | NextAuth.js v4 + Resend Magic Link | Story 2.1 接入 |
| 观测 | Sentry（可选 DSN）| `sentry.{client,server,edge}.config.ts` |
| 测试 | Playwright E2E（mobile + desktop） | `e2e/` |

### 与 lease-guard 的复用关系

本工程的基础设施层直接沿用 `D:\work\MyStartupProject\lease-guard`，关键对照见 `技术架构详细设计.md §3.1`。目前已直接复用：

- `next.config.ts`（安全头、图像、Sentry 包装、Turbopack/Webpack 双栈）
- `instrumentation.ts` + `sentry.{client,server,edge}.config.ts`
- `playwright.config.ts`（裁剪为 mobile + desktop）
- `src/lib/prisma.ts`、`src/lib/query-client.ts`、`src/lib/utils.ts`
- `src/components/providers/{query,session,index}.tsx`
- `src/components/ui/{button,sonner}.tsx` + `globals.css` 的 token 系统
- `scripts/verify-env.ts`（本地 deterministic env gate + explicit production-readiness mode）

## 建议阅读顺序

如果你是新开一个 chat，建议按下面顺序恢复上下文：

1. `项目主档案.md`
2. `stories/sprint-status.yaml`（看当前在做哪条 story）
3. `产品Brief.md`
4. `路线图与MVP.md`
5. `技术架构详细设计.md`
6. `UX设计规格说明.md`
7. `epics.md`
8. `stories/<当前 story>.md`

## 文档导航

### 项目事实

- `项目主档案.md`
- `stories/sprint-status.yaml`

### 产品与规划

- `产品Brief.md`
- `路线图与MVP.md`

### 设计与技术

- `技术架构详细设计.md`
- `UX设计规格说明.md`

### 需求拆解

- `epics.md`
- `stories/*.md`

## 当前主线约束

- 首版只做 `英文单站`
- 首版只做 `手指 / 掌骨`
- 付费模式固定为 `一次性 $14.99`
- 首版不做：`订阅 / 原生 App / 多语言 / 医生端 / 诊断型 AI`
- 技术基线沿用 `D:\work\MyStartupProject\lease-guard` 的基础设施层

## 下一步

- 当前进度以 `stories/sprint-status.yaml` 为准。
- Story 7.4 / Epic 7 已完成；下一步进入 production configuration gate 与 release decision，至少运行 `pnpm run deploy:verify:production` 并确认真实托管 secrets 后再公开发布。

如果后续文档发生阶段切换、主线变更、关键决策变化，优先更新：

- `项目主档案.md`
- `stories/sprint-status.yaml`
