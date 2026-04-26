---
stepsCompleted:
  - requirements-extracted
  - epics-designed
  - stories-created
inputDocuments:
  - D:\work\MyStartupProject1\产品Brief.md
  - D:\work\MyStartupProject1\路线图与MVP.md
  - D:\work\MyStartupProject1\技术架构详细设计.md
  - D:\work\MyStartupProject1\UX设计规格说明.md
  - D:\work\MyStartupProject1\项目主档案.md
---

# Fracture Recovery AI Companion - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Fracture Recovery AI Companion, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: 系统必须提供面向海外英语用户的营销落地页，清晰传达“拆石膏后 14 天康复陪伴”的价值主张，并引导用户开始问卷。  
FR2: 系统必须提供 Eligibility & Safety Gate，在问卷开始阶段筛掉未就医、未拆固定、复杂骨折或明显不适用的用户。  
FR3: 系统必须采集 Recovery Profile，包括部位、子类型、拆石膏日期、硬件情况、是否转诊 PT、疼痛程度、惯用手影响和工作类型。  
FR4: 系统必须支持 `$14.99` 一次性支付结账流程，并在支付成功后解锁产品内容。  
FR5: 系统必须基于问卷结果和模板规则生成个性化 14 天恢复计划，并创建 `Program` 与 `ProgramDay` 实例。  
FR6: 系统必须提供 Day 页面，展示当天重点、动作卡片、视频、次数/时长、注意事项和 FAQ 快捷入口。  
FR7: 系统必须支持每日打卡、完成进度更新、Day 状态切换，以及 Progress/回看能力。  
FR8: 系统必须提供 AI Chat，基于用户档案、当前 day 内容和知识库进行 RAG 问答。  
FR9: 系统必须在 AI Chat 和关键页面中执行危险信号识别、强制免责声明和“联系医生”升级策略。  
FR10: 系统必须在 Day 14 完成后生成总结结果，包括完成报告、下载能力和分享入口。  
FR11: 系统必须提供公开可索引的权威内容资产，包括 SEO 博客、FAQ、法律文档和安全说明，以增强信任和自然获客。  
FR12: 系统必须支持 Magic Link 为主的身份恢复和登录机制，确保用户在支付前后和跨设备场景中可恢复访问。  
FR13: 系统必须记录关键产品埋点与监控事件，包括落地页转化、问卷、支付、Day 完成、Chat 使用和分享行为。  
FR14: 系统必须支持支付失败、退款、配额耗尽、内容缺失、未解锁 day、provider fallback 等核心异常路径。  

### NonFunctional Requirements

NFR1: 首版必须采用英文单站，避免多语言和 `[locale]` 复杂度。  
NFR2: 页面体验需 mobile-first，确保手机端为主场景下的布局、交互和 sticky CTA 可用。  
NFR3: 落地页 PageSpeed 目标需达到 `>= 85`。  
NFR4: 支付流程从落地页到完成结账的总时长目标需 `<= 3 分钟`。  
NFR5: 产品必须显式保持 `education & companion, not medical device` 的合规边界。  
NFR6: 所有关键流程必须具备明确错误处理、warning 状态和可恢复路径。  
NFR7: AI 成本必须可控，需通过限流、provider fallback 和模板优先策略控制消耗。  
NFR8: 数据层必须优先与生产一致，RAG / webhook / schema 验证默认使用 Postgres + pgvector。  
NFR9: 核心页面、表单、FAQ、聊天区、危险提示需要具备基本可访问性和键盘可达性。  
NFR10: 系统必须具备基本观测能力，包括 Sentry 错误监控、关键埋点和 E2E 冒烟回归。  
NFR11: 首版必须限制范围，不做订阅、不做医生端、不做诊断、不做原生 App。  
NFR12: 所有文档与实现应遵循已有 `lease-guard` 基础设施模式，以减少初期交付风险。  

### Additional Requirements

- Epic 1 Story 1 需要显式体现 `lease-guard` 基础骨架复用，包括 `Next.js 16`、`Prisma`、`providers`、`Sentry`、`Playwright`、`verify-env`。  
- 数据模型必须至少覆盖 `User / Account / Session / VerificationToken / RecoveryProfile / Purchase / Program / ProgramDay / ChatMessage / KnowledgeChunk`。  
- `Program` 生成必须在支付成功后执行，不能在未付费状态下预生成。  
- 支付需采用 Stripe Checkout 一次性支付，并至少监听 `checkout.session.completed`、`payment_intent.payment_failed`、`charge.refunded`。  
- AI 主链路为 `Gemini Flash`，失败时降级到 `Groq`。  
- AI Chat 限流需使用 `Upstash Redis`，默认每日每用户 20 次。  
- 知识源首版只允许来自 `AAOS / NHS / guzhe / 精校 FAQ`。  
- 内容必须进入 `content/` 结构化目录，不依赖 CMS。  
- 部署拓扑固定为 `Vercel + Supabase + Resend + Stripe + Upstash + Sentry`。  
- 质量保障必须包含单元测试、集成测试和 4 条主干 E2E。  
- 退款、provider fallback、未解锁内容和内容缺失都必须有明确 UX 回退。  

### UX Design Requirements

UX-DR1: Landing 必须固定为 7 个区块：Hero、Pain Points、How It Works、What You Get、Safety、FAQ、Footer CTA。  
UX-DR2: Landing 每屏只允许 1 个 Primary CTA，主 CTA 文案固定为 `Start my 2-minute quiz`。  
UX-DR3: Onboarding 必须固定为 3 步：Eligibility Gate、Recovery Profile、Personalized Summary + Checkout CTA。  
UX-DR4: Onboarding 必须提供步骤进度、字段即时校验、上一步/下一步以及不适用中止状态。  
UX-DR5: Day 页面必须固定为 6 个区块：Recovery Header、Today’s Focus、Exercise Cards、What’s Normal vs Get Help、Quick Questions、Sticky Bottom Action。  
UX-DR6: Day 页面需要支持 `Locked / In Progress / Completed / Review / Missing Content` 五类状态。  
UX-DR7: Chat 页面必须固定为 4 个区块：Context Header、Suggested Prompts、Chat Stream、Input Area。  
UX-DR8: Chat 需要支持 `Fresh / Answering / Answered / Fallback / Danger Escalation / Quota Exceeded / Network Error` 七类状态。  
UX-DR9: 所有关键页面都必须持续可见合规边界和风险提示，尤其是 Landing、Summary、Day、Chat。  
UX-DR10: 跨页面 CTA、反馈颜色、表单模式、danger escalation 模式必须保持一致。  
UX-DR11: 设计必须 mobile-first，桌面端只扩展布局，不改变任务主路径。  
UX-DR12: 每个关键页面都必须具备明确埋点，能够支持转化、使用和异常分析。  

### FR Coverage Map

FR1: Epic 1 - 用户能发现并理解产品价值。  
FR2: Epic 2 - 用户能被正确筛选为适用或不适用对象。  
FR3: Epic 2 - 用户能完成恢复档案采集。  
FR4: Epic 2 - 用户能完成一次性支付解锁。  
FR5: Epic 3 - 已付费用户能获得个性化 14 天计划。  
FR6: Epic 4 - 用户能查看并执行当天动作。  
FR7: Epic 4 - 用户能完成 day 并看到进度变化。  
FR8: Epic 5 - 用户能针对当前恢复问题提问并获得 AI 答复。  
FR9: Epic 5 - 用户能在风险场景下得到受控而安全的升级提示。  
FR10: Epic 6 - 用户能在完成 14 天后得到结果、下载和分享能力。  
FR11: Epic 1 - 用户能看到可信、可索引、可解释的公开内容。  
FR12: Epic 2 - 用户能通过 Magic Link 恢复身份并访问已购内容。  
FR13: Epic 7 - 运营者能看到关键漏斗、错误和使用行为。  
FR14: Epic 7 - 用户与运营者都能在核心异常路径中获得明确反馈与恢复。  

## Epic List

### Epic 1: Discover and Trust the Recovery Coach
让目标用户能够通过落地页、公开内容和法律/安全说明快速判断产品是否适合自己并愿意开始问卷。  
**FRs covered:** FR1, FR11

### Epic 2: Become an Eligible Paid User
让适用用户能够完成资格筛选、恢复档案采集、身份建立和一次性支付，并在支付后顺利进入产品。  
**FRs covered:** FR2, FR3, FR4, FR12

### Epic 3: Receive a Personalized 14-Day Program
让已付费用户在支付成功后立刻获得基于恢复档案生成的 14 天计划和可用内容实例。  
**FRs covered:** FR5

### Epic 4: Complete Daily Recovery Actions with Confidence
让用户每天都能清楚看到今天该做什么、如何完成以及当前恢复进度。  
**FRs covered:** FR6, FR7

### Epic 5: Ask Safe Recovery Questions with AI
让用户能够围绕当天恢复问题获得 AI 支持，同时在危险场景下被安全地限制和升级。  
**FRs covered:** FR8, FR9

### Epic 6: Finish the Program and Share Outcomes
让用户在完成 14 天后获得成就反馈、下载报告并分享结果。  
**FRs covered:** FR10

### Epic 7: Operate, Measure, and Launch Reliably
让产品负责人能够用埋点、监控、支付异常处理和质量保障机制稳定运营和迭代产品。  
**FRs covered:** FR13, FR14

## Epic 1: Discover and Trust the Recovery Coach

让目标用户能够通过落地页、公开内容和法律/安全说明快速判断产品是否适合自己并愿意开始问卷。

### Story 1.1: Fast, Trustworthy Marketing Shell

As a prospective fracture recovery user,  
I want the website to load as a fast, credible English product site,  
So that I trust it enough to keep reading instead of bouncing.

**Acceptance Criteria:**

**Given** the project is initialized from the approved stack  
**When** a user opens the public site  
**Then** the root marketing shell renders successfully on mobile and desktop  
**And** the page uses the shared provider, layout, SEO and monitoring foundation from the approved architecture.

**Given** a user lands on the site  
**When** the first screen is shown  
**Then** the visual structure feels like a product landing page instead of a blog article  
**And** the global layout includes header, footer, legal links and stable responsive spacing.

### Story 1.2: Landing Hero and Core Value Narrative

As a target user in the cast-removal window,  
I want to immediately understand what this product is and why it is relevant now,  
So that I can decide within seconds whether to start the quiz.

**Acceptance Criteria:**

**Given** a user opens the landing page  
**When** the hero section loads  
**Then** it shows the core value proposition for the critical two weeks after cast removal  
**And** the primary CTA is `Start my 2-minute quiz`.

**Given** the user scrolls the page  
**When** they view the core marketing sections  
**Then** they can see Pain Points, How It Works and What You Get in the approved order  
**And** each section reinforces user anxiety relief and action clarity rather than generic wellness messaging.

### Story 1.3: Safety, FAQ, and Conversion Confidence

As a cautious prospective user,  
I want to understand safety boundaries, eligibility and pricing concerns before I click pay,  
So that I can trust the product without feeling tricked.

**Acceptance Criteria:**

**Given** a user reviews the landing page  
**When** they reach the lower sections  
**Then** they see Safety/Disclaimer, FAQ and Footer CTA in the approved order  
**And** disclaimer language clearly states the product is not a medical device and not for diagnosis.

**Given** a user expands FAQ items  
**When** they review price, who-it-is-for, who-it-is-not-for and refund answers  
**Then** the content reduces trust objections  
**And** the FAQ interaction works accessibly via keyboard and pointer.

### Story 1.4: Public Trust Content and SEO Entry Pages

As a search-driven user,  
I want to find credible supporting content before I commit,  
So that I feel this product is grounded in real recovery knowledge.

**Acceptance Criteria:**

**Given** a user lands on a public content page  
**When** they open a blog article or public FAQ page  
**Then** the content template supports SEO-friendly metadata, readable long-form layout and a clear CTA into onboarding  
**And** public content fits the approved English single-site structure.

**Given** the initial content set is prepared  
**When** the first launch-ready pages are published  
**Then** the site includes legal pages plus at least one recovery story / keyword-targeted content template  
**And** all public pages share consistent trust and disclaimer patterns.

## Epic 2: Become an Eligible Paid User

让适用用户能够完成资格筛选、恢复档案采集、身份建立和一次性支付，并在支付后顺利进入产品。

### Story 2.1: Magic Link Identity and Session Recovery

As a prospective paying user,  
I want my identity to be created and recoverable without a complex account flow,  
So that I can buy and return to my plan with minimal friction.

**Acceptance Criteria:**

**Given** a user starts onboarding or returns after payment  
**When** identity is required  
**Then** the system supports Magic Link as the primary auth path  
**And** session fields remain minimal and aligned with the architecture document.

**Given** a returning user opens a previously purchased experience  
**When** their session is restored  
**Then** they can re-enter the product without creating a traditional password account  
**And** unauthorized users are redirected safely.

### Story 2.2: Eligibility and Safety Gate

As a prospective user,  
I want to be screened for obvious ineligibility or safety mismatches before I pay,  
So that I do not buy a plan that should not be used for my situation.

**Acceptance Criteria:**

**Given** a user enters onboarding  
**When** they answer eligibility and safety questions  
**Then** the system classifies them as eligible, not eligible or needs clinician attention  
**And** excluded users are stopped before recovery profile capture continues.

**Given** a user is not eligible  
**When** the gate determines they fall outside MVP scope  
**Then** the page shows a clear non-eligible message and disclaimer  
**And** provides a route back to the landing page or legal guidance.

### Story 2.3: Recovery Profile Multi-Step Form

As an eligible user,  
I want to complete a short multi-step recovery profile,  
So that the product can tailor the 14-day plan to my situation.

**Acceptance Criteria:**

**Given** a user is eligible  
**When** they progress through the form  
**Then** the form collects body part, subtype, cast removed date, hardware status, PT referral, pain level, dominant hand impact and work type  
**And** each step validates before moving forward.

**Given** the form is in progress  
**When** the user navigates between steps  
**Then** the experience shows step progress, previous/next controls and saved answers  
**And** the form remains mobile-friendly and does not overload a single screen with unrelated questions.

### Story 2.4: Personalized Summary and One-Time Checkout

As a qualified user,  
I want to see a summary of my recovery context before paying,  
So that I feel confident this plan is intended for me.

**Acceptance Criteria:**

**Given** a user completes the recovery profile  
**When** they reach the summary step  
**Then** they see their current recovery window, what the next 14 days includes, the one-time price, refund framing and disclaimer  
**And** the page uses the approved CTA `Unlock my 14-day plan`.

**Given** a user clicks the checkout CTA  
**When** the system creates a Stripe Checkout session  
**Then** the request uses one-time payment mode  
**And** the flow handles payment success, payment failure and redirect/loading states clearly.

## Epic 3: Receive a Personalized 14-Day Program

让已付费用户在支付成功后立刻获得基于恢复档案生成的 14 天计划和可用内容实例。

### Story 3.1: Program Domain Models and Provisioning Inputs

As a paid user,  
I want my purchase and recovery profile to map to a real program instance,  
So that the product can deliver my plan consistently across sessions.

**Acceptance Criteria:**

**Given** the product data layer is prepared  
**When** the implementation introduces business models  
**Then** the schema includes `RecoveryProfile`, `Purchase`, `Program`, `ProgramDay`, `ChatMessage` and `KnowledgeChunk` with the approved fields  
**And** schema choices prioritize Postgres + pgvector parity for real environments.

**Given** the content system is initialized  
**When** program generation is implemented  
**Then** `content/programs`, `content/faq`, `content/blog` and `content/exercises` are recognized as frozen implementation inputs  
**And** the system does not depend on a CMS.

### Story 3.2: Stripe Webhook Unlock and Program Creation

As a newly paying user,  
I want the product to unlock my plan immediately after payment,  
So that I can start Day 1 without manual intervention.

**Acceptance Criteria:**

**Given** Stripe sends a successful checkout event  
**When** the webhook is processed  
**Then** the system stores the purchase record and marks it as paid  
**And** creates the corresponding `Program` and initial `ProgramDay` records.

**Given** a payment succeeds  
**When** provisioning finishes  
**Then** the user is redirected or restored into the post-checkout success flow  
**And** the product can send the user to Day 1 without requiring future stories to complete first.

### Story 3.3: Template-First Program Generation

As a paid user,  
I want my 14-day plan to feel personalized but safe,  
So that I get useful day-by-day guidance without unsafe AI improvisation.

**Acceptance Criteria:**

**Given** a recovery profile exists  
**When** a program is generated  
**Then** the system uses template-first logic with rule-based mapping  
**And** any LLM assistance is limited to micro-adjustments that do not alter safety-critical exercise boundaries.

**Given** the program content is produced  
**When** a developer or reviewer inspects it  
**Then** each day has structured content, stage metadata and estimated task duration  
**And** the output is traceable to the approved program content source.

### Story 3.4: Current Program Retrieval and Progress Entry

As a logged-in paid user,  
I want the app to know which program and day I should see next,  
So that I never need to manually reconstruct my place.

**Acceptance Criteria:**

**Given** a user has an active program  
**When** they open the product after login  
**Then** the system can resolve their active program and current day  
**And** route them to the correct experience entry point.

**Given** a user does not yet have a program despite a valid purchase  
**When** they open a protected route  
**Then** the system enters the approved auto-recovery path  
**And** shows a safe fallback rather than a broken page.

## Epic 4: Complete Daily Recovery Actions with Confidence

让用户每天都能清楚看到今天该做什么、如何完成以及当前恢复进度。

### Story 4.1: Day Header and Today’s Focus

As a recovering user,  
I want each day page to immediately tell me where I am and what matters today,  
So that I can start without confusion.

**Acceptance Criteria:**

**Given** a user opens `/day/[day]`  
**When** the page renders  
**Then** it shows Day number, stage, total progress and today’s focus above the fold  
**And** the content order matches the approved UX specification.

**Given** the user is on mobile  
**When** the header and focus render  
**Then** the page preserves task clarity and sticky CTA visibility  
**And** avoids burying core instructions under secondary content.

### Story 4.2: Exercise Cards and Completion State

As a user following today’s plan,  
I want to complete exercises one by one,  
So that I can feel progress and stay on track.

**Acceptance Criteria:**

**Given** a day contains exercise content  
**When** the user views the exercise list  
**Then** each card shows video or thumbnail, exercise name, duration/reps, notes and a completion action  
**And** cards remain readable on mobile.

**Given** the user marks exercise items complete  
**When** the local or server state updates  
**Then** the page recalculates day completion progress  
**And** the completion state persists on refresh.

### Story 4.3: Day Completion and Progress Update

As a user finishing today’s work,  
I want to mark the whole day complete,  
So that I receive closure and my overall progress advances.

**Acceptance Criteria:**

**Given** a user has partially or fully completed exercises  
**When** they tap `Mark day complete`  
**Then** the app updates `ProgramDay.completedAt`, day completion status and the current progress summary  
**And** shows clear success feedback.

**Given** the user tries to complete the day before all items are done  
**When** the action is triggered  
**Then** the app shows a confirmation step  
**And** allows completion with an explicit warning rather than silent failure.

### Story 4.4: Locked, Review, and Missing Content States

As a user navigating the program,  
I want non-happy-path day states to remain understandable,  
So that I am never blocked by ambiguity.

**Acceptance Criteria:**

**Given** a user opens a locked day  
**When** access is denied  
**Then** the UI shows a locked state with a next valid action  
**And** does not expose unusable controls.

**Given** a user reviews a completed or past day  
**When** the page renders  
**Then** the interface switches into review-oriented behavior  
**And** preserves content readability without pretending it is still the current task.

**Given** day content is missing or corrupted  
**When** the page cannot render a valid experience  
**Then** the UI shows a fallback state with support guidance  
**And** the failure is observable to operators.

## Epic 5: Ask Safe Recovery Questions with AI

让用户能够围绕当天恢复问题获得 AI 支持，同时在危险场景下被安全地限制和升级。

### Story 5.1: Chat Entry, Context Header, and Suggested Prompts

As a user with immediate recovery concerns,  
I want to enter chat with relevant context already visible,  
So that I can ask focused questions without re-explaining everything.

**Acceptance Criteria:**

**Given** a user opens the chat page or enters chat from a day page  
**When** the screen loads  
**Then** the header shows body part, current day, remaining quota and a brief disclaimer  
**And** the layout matches the approved 4-section chat structure.

**Given** the user has no prior messages  
**When** the fresh state is shown  
**Then** the page offers 3-5 suggested prompts  
**And** clicking one fills the input rather than sending automatically.

### Story 5.2: Streaming AI Answers with RAG Citations

As a user asking a recovery question,  
I want a grounded answer based on my context and trusted sources,  
So that I can act with more confidence.

**Acceptance Criteria:**

**Given** a user submits a valid question  
**When** the chat backend runs  
**Then** it composes context from `RecoveryProfile`, current `ProgramDay`, retrieved `KnowledgeChunk` items and system guardrails  
**And** returns a streamed answer.

**Given** an answer is generated  
**When** it is shown in the chat stream  
**Then** citations or source references are available in the UI  
**And** the answer language remains non-diagnostic and recovery-coach oriented.

### Story 5.3: Danger Escalation and Safety Guardrails

As a user describing potentially dangerous symptoms,  
I want the system to stop giving ordinary guidance and tell me to seek medical help,  
So that I am not misled by an unsafe AI response.

**Acceptance Criteria:**

**Given** a message contains danger keywords or matches escalation patterns  
**When** the safety layer evaluates it  
**Then** the response inserts a prominent warning block  
**And** the system avoids continuing with normal exercise suggestions.

**Given** a danger escalation occurs  
**When** the message is stored  
**Then** the chat record marks the interaction as escalated  
**And** the UI state is visually distinct and screen-reader accessible.

### Story 5.4: Quota Control, Provider Fallback, and Error Recovery

As a user depending on AI answers,  
I want the product to handle limits and provider issues gracefully,  
So that I understand what happened and what to do next.

**Acceptance Criteria:**

**Given** the user is within daily quota  
**When** the main provider is unavailable  
**Then** the system falls back to the approved secondary provider  
**And** the answer remains visible as a fallback outcome rather than a silent failure.

**Given** the user exceeds daily chat quota  
**When** they attempt another message  
**Then** the input is disabled with a clear quota-exceeded state  
**And** the UI provides an alternate path such as FAQ or static help.

**Given** the request fails for a network or application reason  
**When** chat cannot complete normally  
**Then** the page shows a retryable error state  
**And** the failure is logged for operators.

## Epic 6: Finish the Program and Share Outcomes

让用户在完成 14 天后获得成就反馈、下载报告并分享结果。

### Story 6.1: Completion Experience for Day 14

As a user who reaches the end of the program,  
I want a clear completion experience,  
So that I feel progress and closure rather than the program simply ending.

**Acceptance Criteria:**

**Given** the user completes Day 14  
**When** the completion trigger fires  
**Then** the product routes them into a dedicated completion experience  
**And** the page summarizes their achievement in a motivating but non-medical tone.

**Given** the user views the completion page  
**When** they review their outcome  
**Then** they can see progress context, finished status and next lightweight suggestions  
**And** the page remains aligned with the approved CTA and feedback patterns.

### Story 6.2: Downloadable Summary Report

As a user who finished the plan,  
I want a downloadable report of my 14-day progress,  
So that I can keep a record or reference it later.

**Acceptance Criteria:**

**Given** the program is complete  
**When** the user requests a report  
**Then** the system generates a PDF or equivalent downloadable summary  
**And** the report includes non-diagnostic wording, completion summary and safe framing.

**Given** report generation fails  
**When** the user attempts download  
**Then** the UI shows a recoverable error state  
**And** the failure is observable in monitoring.

### Story 6.3: Simple Sharing Flow

As a satisfied user,  
I want to share the outcome or product link with other people,  
So that I can recommend it without a complex referral program.

**Acceptance Criteria:**

**Given** the user is on the completion page or an allowed share surface  
**When** they open sharing options  
**Then** they can copy a link or use simple share actions for supported channels  
**And** the product tracks share intent with analytics.

**Given** the share action is unavailable on a device or channel  
**When** the user tries to share  
**Then** a copy-link fallback is available  
**And** the interface still communicates success clearly.

## Epic 7: Operate, Measure, and Launch Reliably

让产品负责人能够用埋点、监控、支付异常处理和质量保障机制稳定运营和迭代产品。

### Story 7.1: Product Analytics and Funnel Events

As the product operator,  
I want meaningful funnel and usage events captured across the core journey,  
So that I can identify conversion and engagement bottlenecks.

**Acceptance Criteria:**

**Given** users move through landing, onboarding, checkout, day completion, chat and share flows  
**When** key actions occur  
**Then** the approved events are emitted consistently  
**And** event naming follows the documented analytics vocabulary.

**Given** analytics data is reviewed  
**When** the operator examines it  
**Then** they can trace drop-off across landing, quiz, checkout and paid activation  
**And** use the data to support PMF and launch decisions.

### Story 7.2: Monitoring and Error Observability

As the product operator,  
I want production failures to be visible quickly,  
So that broken core flows can be fixed before they damage trust.

**Acceptance Criteria:**

**Given** a frontend, API, payment or AI failure occurs  
**When** the application logs the issue  
**Then** the failure is captured by Sentry or the approved monitoring stack  
**And** the event includes enough context to identify the affected flow.

**Given** monitoring is configured  
**When** the app boots in a real environment  
**Then** public, protected and background-critical flows are covered by instrumentation  
**And** monitoring setup follows the approved architecture baseline.

### Story 7.3: Payment Failure, Refund, and Support Recovery Paths

As the product operator,  
I want failed payments, refunds and support-sensitive states handled explicitly,  
So that users are not left in ambiguous account states.

**Acceptance Criteria:**

**Given** a payment fails or a refund is issued  
**When** Stripe sends the relevant event or the user returns from checkout  
**Then** purchase state is updated consistently  
**And** the UI can explain whether access is blocked, pending or revoked.

**Given** a user encounters a billing-related problem  
**When** they hit the relevant product state  
**Then** the app shows a clear recovery path or support instruction  
**And** avoids silently trapping the user in a partially unlocked state.

### Story 7.4: Launch Readiness QA and Regression Safety Net

As the product operator,  
I want a minimal but real quality gate before launch,  
So that the first public release does not break the core value flow.

**Acceptance Criteria:**

**Given** the MVP is nearing launch  
**When** the regression suite is executed  
**Then** the main E2E paths cover landing -> onboarding -> checkout, paid day usage, paid chat and completion/report flow  
**And** critical failures block release readiness.

**Given** core environment variables are configured  
**When** deployment verification runs  
**Then** missing or malformed production-critical variables are surfaced before release  
**And** the README / runbook clearly points operators to the relevant setup steps.

