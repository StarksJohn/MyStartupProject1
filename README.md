# MyStartupProject1

`MyStartupProject1` 当前聚焦的主线产品是：

`Fracture Recovery AI Companion`

这是一个面向海外英语用户的骨折康复 AI 陪伴网站，首版只做 `手指 / 掌骨` 在拆石膏前后 14 天这一极窄场景，核心闭环是：

`Landing -> Onboarding -> One-time Payment -> 14-Day Program -> Daily Completion -> AI Chat -> Completion Report`

## 当前状态

已进入 `功能开发` 阶段，Story 1.1（Marketing Shell）代码骨架已落地，待首次 `pnpm install` 与本地冒烟验证。

已经完成的核心产物：

- `项目主档案.md`：当前阶段、关键结论、下一步入口
- `产品Brief.md`：产品定义、目标用户、MVP 边界、关键决策
- `路线图与MVP.md`：13 周计划、Gate、资源与风险
- `技术架构详细设计.md`：技术方案与 solution design（含 lease-guard 复用映射）
- `UX设计规格说明.md`：Landing / Onboarding / Day / Chat 的可拆 story UX 规格
- `epics.md`：基于以上文档拆出的 epics/stories
- `stories/`：单 story 规格（当前：`1-1-marketing-shell.md`）+ `sprint-status.yaml`

## Getting Started

本仓库现在是一个可运行的 Next.js 16 App Router 工程骨架。第一次启动只需要下面三步：

```bash
pnpm install
cp .env.example .env.local   # 按需填写 NEXTAUTH_SECRET 等值
pnpm dev
```

然后在浏览器打开 <http://localhost:3000>，你应该看到：

- `/` - Landing 页骨架（hero 占位 + 三步说明 + 安全声明）
- `/legal/privacy | /legal/terms | /legal/refund | /legal/disclaimer` - 四个法律占位页

本地 smoke E2E：

```bash
pnpm dlx playwright install --with-deps   # 首次需要下载浏览器
pnpm test:e2e
```

环境变量自检（部署前）：

```bash
pnpm run deploy:verify
```

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
- `scripts/verify-env.ts`（裁剪到 Story 1.1 的 env 集）

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

- Story 1.1 落盘完成后：`pnpm install` + `pnpm dev` 手动冒烟 -> `pnpm test:e2e` -> 视情况跑一次轻量 `bmad-code-review`
- 然后回到 `bmad-create-story` 生成 `1-2-landing-hero-core-value` 规格

如果后续文档发生阶段切换、主线变更、关键决策变化，优先更新：

- `项目主档案.md`
- `stories/sprint-status.yaml`
