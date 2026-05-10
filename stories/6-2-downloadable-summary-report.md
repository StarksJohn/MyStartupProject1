# Story 6.2: Downloadable Summary Report

Status: done

<!-- Note: Created by bmad-create-story after Story 6.1 was implemented, lightly reviewed, patched, validated, and marked done. -->

## Story

As a user who finished the plan,  
I want a downloadable report of my 14-day progress,  
so that I can keep a record or reference it later.

## Acceptance Criteria

1. **AC1 - Completed users can download a summary report**  
   **Given** a paid authenticated user has a completed 14-day program  
   **When** they request the report from the completion experience  
   **Then** the app provides a downloadable summary report  
   **And** the report is generated from persisted program/profile/day-completion state  
   **And** the report does not mutate `Program`, `ProgramDay`, `Purchase`, or profile state.

2. **AC2 - Report access is protected and program-aware**  
   **Given** a user requests the report download route  
   **When** they are unauthenticated  
   **Then** the route returns an unauthenticated response or redirects through existing auth patterns without leaking report content.  
   **Given** an authenticated user has no paid completed program  
   **When** they request the report  
   **Then** the route fails safely with a clear status and no downloadable report body.

3. **AC3 - Download format is explicit and dependency-conscious**  
   **Given** the report route succeeds  
   **When** the response is returned  
   **Then** it uses a real downloadable response with `Content-Disposition: attachment` and a stable filename  
   **And** it may be a PDF or an equivalent downloadable summary format such as HTML/text for this MVP  
   **And** if a new PDF rendering dependency is needed, the dev agent must stop for explicit approval before adding it.

4. **AC4 - Report content is non-diagnostic and safe**  
   **Given** the user opens the downloaded report  
   **When** they review the content  
   **Then** it includes non-diagnostic wording, product education framing, and a clear "not medical clearance" boundary  
   **And** it repeats danger-signal guidance to contact a clinician for severe or worsening symptoms  
   **And** it avoids diagnosis, treatment claims, clinical clearance, prognosis, or promises of recovery.

5. **AC5 - Report includes useful persisted summary context**  
   **Given** the program is complete  
   **When** the report is generated  
   **Then** it includes safe summary fields such as body part/subtype, template version, completed status, `14 of 14 days`, completion date when available, and Day 14 review context when safely available  
   **And** it must not expose raw `contentJson`, internal IDs, provider metadata, chat transcripts, quota keys, payment IDs, or other internal operational data.

6. **AC6 - Completion page exposes a report download CTA**  
   **Given** a completed user is on `/completion`  
   **When** the page renders  
   **Then** it shows a clear report download action using existing `Button`/`Link` hierarchy  
   **And** the CTA is not a share action, referral action, or analytics event trigger  
   **And** existing Review Day 14 and Chat next-step actions remain available.

7. **AC7 - Recoverable failure state is visible**  
   **Given** report generation fails or returns a non-success response  
   **When** the user attempts download from the UI  
   **Then** the UI shows a recoverable error state or retry guidance  
   **And** the server logs only safe metadata such as `userId`, `programId`, status, and error category.

8. **AC8 - Missing or malformed content fails safely**  
   **Given** a completed program has missing or malformed Day 14 content or incomplete summary context  
   **When** report generation is requested  
   **Then** the report route does not generate partial recovery instructions as if they were valid  
   **And** it either returns a clear recoverable error or generates a minimal safe report that omits unsafe/incomplete sections.

9. **AC9 - Scope excludes sharing, referral, analytics, and persistence changes**  
   **Given** Story 6.3 and Epic 7 own sharing and analytics  
   **When** Story 6.2 is implemented  
   **Then** it must not add share links, copy-link actions, social share APIs, referral mechanics, analytics events such as `completion_report_view`, or new report/share database models/fields  
   **And** it must not persist generated report files unless explicitly approved in a later story.

10. **AC10 - Focused regression coverage**  
    **Given** this story adds a protected report download surface  
    **When** implementation is complete  
    **Then** tests cover successful completed-user download, unauthenticated access, non-completed access, failure/retry UI behavior, safe content boundaries, and absence of share/analytics behavior  
    **And** `pnpm typecheck`, `pnpm lint`, and focused Playwright/API coverage pass or document external DB instability separately from application failures.

## Tasks / Subtasks

- [x] **T1 - Add a report summary builder with safe data contract** (AC: 1, 4, 5, 8, 9)
  - [x] 1.1 Add a narrow report builder helper, for example `src/lib/program/completion-report-service.ts`.
  - [x] 1.2 Reuse `resolveCurrentProgramForUser()` and/or `loadProgramDayForProgram()`; do not create a parallel program resolver.
  - [x] 1.3 Gate report generation on `Program.status === COMPLETED`.
  - [x] 1.4 Read only safe fields from persisted program/profile/day state.
  - [x] 1.5 Format a non-diagnostic summary with educational boundary copy and danger-signal guidance.
  - [x] 1.6 Do not include raw JSON, internal IDs, payment identifiers, chat transcripts, provider metadata, quota keys, or operational fields.
  - [x] 1.7 If required Day 14 content is missing/malformed, return a typed recoverable error or a minimal safe summary without partial instructions.

- [x] **T2 - Add protected report download route** (AC: 1, 2, 3, 4, 5, 7, 8, 9)
  - [x] 2.1 Add a protected route handler, recommended path `src/app/api/program/report/route.ts`.
  - [x] 2.2 Use `getAuthSession()` and existing API auth response style.
  - [x] 2.3 Return non-success JSON for unauthenticated, non-completed, missing content, or generation failure states.
  - [x] 2.4 Return a downloadable response with `Content-Disposition: attachment` and stable filename such as `recovery-summary-report.html`.
  - [x] 2.5 Prefer dependency-free output for this story, such as sanitized static HTML or plain text, unless explicit user approval is obtained for a PDF library.
  - [x] 2.6 Set an accurate `Content-Type` for the chosen format and avoid cache behavior that could expose another user's report.
  - [x] 2.7 Log failures with safe metadata only; do not log raw report content or medical profile details.

- [x] **T3 - Add completion page download UI with recoverable failure feedback** (AC: 3, 6, 7, 9)
  - [x] 3.1 Add a client-side action component if needed, for example `src/components/completion/report-download-action.tsx`.
  - [x] 3.2 Render the CTA from `src/app/(app)/completion/page.tsx` only for completed users.
  - [x] 3.3 Use existing `Button` styling and mobile-first layout conventions.
  - [x] 3.4 Trigger the download without adding share/copy/referral mechanics.
  - [x] 3.5 Show a recoverable error state if the download request fails.
  - [x] 3.6 Preserve existing `Review Day 14` and `Ask a non-urgent question` actions.

- [x] **T4 - Preserve Story 6.1 completion behavior and scope boundaries** (AC: 1, 6, 8, 9)
  - [x] 4.1 Do not reactivate completed programs or mutate Day completion state.
  - [x] 4.2 Preserve `/completion` auth/fallback behavior from Story 6.1.
  - [x] 4.3 Preserve completed-program effective Day 14 behavior even if stored `currentDay` is inconsistent.
  - [x] 4.4 Do not add Prisma schema fields/models for reports, shares, referrals, or analytics.
  - [x] 4.5 Do not add analytics instrumentation or `completion_report_view`.

- [x] **T5 - Add focused tests and validation** (AC: 1-10)
  - [x] 5.1 Extend `e2e/program-entry.spec.ts` unless a small focused report spec becomes cleaner.
  - [x] 5.2 Test completed paid user can request the report and receives a downloadable response with expected headers.
  - [x] 5.3 Test unauthenticated report access is rejected and does not expose report content.
  - [x] 5.4 Test active/non-completed user cannot download a false completion report.
  - [x] 5.5 Test report content includes safe completion summary and safety boundary copy.
  - [x] 5.6 Test report content excludes share/copy/referral/analytics language and internal operational fields.
  - [x] 5.7 Test completion page shows report download CTA and failure/retry feedback when the route fails.
  - [x] 5.8 Test missing/malformed Day 14 content fails safely without partial recovery instructions.
  - [x] 5.9 Run `pnpm typecheck`.
  - [x] 5.10 Run `pnpm lint`.
  - [x] 5.11 Run focused Playwright/API tests, noting Supabase pooler instability separately from application failures if it occurs.

## Dev Notes

### Product Intent

- Story 6.2 adds a downloadable artifact after the completion experience from Story 6.1.
- The report should help users keep a personal record or reference later, not prove recovery or provide clinician-ready medical clearance.
- The report is an educational summary of persisted app progress. It must be framed as non-diagnostic and non-medical.
- This story should not become the sharing story. Story 6.3 owns copy-link/social share/referral behavior.
- This story should not become the analytics story. Epic 7 owns funnel and usage instrumentation.

### Story 6.1 Baseline

- `src/app/(app)/completion/page.tsx` is the protected completion page.
- Unauthenticated `/completion` redirects to `/sign-in?callbackUrl=%2Fcompletion`.
- Non-completed users cannot see a false completion state; active users redirect to `/day/{currentDay}`.
- Completed users can revisit `/completion`; `/progress` routes completed programs back to `/completion`.
- The completion page currently exposes:
  - `Review Day 14` linking to `/day/14`
  - `Ask a non-urgent question` linking to `/chat`
  - safety boundary copy
- Story 6.1 code review removed a self-looping `Progress overview` CTA and hardened `resolveCurrentProgramForUser()` so completed programs load Day 14 as the effective current day even if stored `currentDay` is inconsistent.
- Story 6.2 may add a report download CTA to `/completion`, but it should not reintroduce the removed progress self-loop.

### Relevant Architecture Context

- `技术架构详细设计.md` §9.2 says Day 14 completion later generates a summary page and PDF.
- Current implementation has no report/PDF module and no PDF generation dependency in `package.json`.
- `epics.md` Story 6.2 allows "PDF or equivalent downloadable summary"; use that flexibility to avoid unapproved dependencies.
- Current API patterns:
  - Route handlers live under `src/app/api/**/route.ts`.
  - Protected API routes use `getAuthSession()`.
  - API errors use `NextResponse.json(...)` with explicit statuses.
  - Operational failures currently use `console.error(...)` with safe metadata.
- Current program resolver:
  - `resolveCurrentProgramForUser(userId)` reads paid `ACTIVE` and `COMPLETED` programs.
  - Completed programs use effective Day 14 after Story 6.1 review fixes.
  - Missing day content returns `missing_day_content` rather than rendering partial content.

### Recommended Implementation Shape

- Recommended helper:
  - `src/lib/program/completion-report-service.ts`
  - Exports a function such as `buildCompletionReportForUser(userId)` or similar.
  - Returns a discriminated result for success vs. `not_completed`, `missing_content`, or `unavailable`.
- Recommended route:
  - `src/app/api/program/report/route.ts`
  - `GET` route is sufficient for a download.
  - Success response should include:
    - `Content-Type: text/html; charset=utf-8` or `text/plain; charset=utf-8` if using dependency-free format
    - `Content-Disposition: attachment; filename="recovery-summary-report.html"` or matching extension
    - `Cache-Control: no-store`
- Recommended UI:
  - If direct link download is enough, use a normal link/button to `/api/program/report`.
  - If recoverable UI feedback requires client state, add a small client component under `src/components/completion/`.
  - Use `data-testid="completion-report-download"` for the CTA.
  - Use `data-testid="completion-report-error"` for recoverable error UI if a client component is added.
- Recommended content sections:
  - Title: "14-day recovery companion summary"
  - Completion status: Completed
  - Progress: 14 of 14 days
  - Focus area: body part/subtype if safely available
  - Template version
  - Completion date: Day 14 `completedAt` when available
  - Final day review summary: Day 14 title/focus/summary when content is complete
  - Safety boundary and danger-signal guidance

### Data and Privacy Guardrails

- Do not change `prisma/schema.prisma`.
- Do not add `CompletionReport`, `Report`, `Share`, `Referral`, or analytics models/fields.
- Do not persist generated files in the database, filesystem, S3, or any external storage in this story.
- Do not include:
  - raw `contentJson`
  - internal database IDs
  - Stripe checkout session/payment intent IDs
  - chat transcripts or RAG citations
  - provider/model metadata
  - quota keys/usage internals
  - risk flag raw JSON
- Avoid logging report body or detailed medical profile values. Log only safe operational metadata.

### Scope Boundaries

Do not implement in Story 6.2:

- share links
- copy-link action
- Web Share API
- referral mechanics
- analytics events or analytics provider setup
- report persistence/storage
- email delivery
- clinician contact workflow
- billing/refund behavior
- schema changes
- new dependencies without explicit approval
- broad redesign of `/completion`

### Testing Guidance

- Existing `e2e/program-entry.spec.ts` is serial and already contains program/day/chat/completion coverage.
- Report tests can be API-heavy to reduce UI flakiness:
  - completed user `GET /api/program/report` returns `200`
  - response has attachment `Content-Disposition`
  - response body includes safe summary and safety copy
  - response body excludes internal IDs, raw JSON, share/copy/referral/analytics wording
  - active user gets non-success and no report body
  - unauthenticated request gets `401` or equivalent auth rejection
- UI test should cover the `/completion` CTA and recoverable failure state if a client component is implemented.
- Use `test.setTimeout(...)` for remote DB paths, consistent with Stories 5.4 and 6.1.
- Known environment risk:
  - Supabase pooler at `aws-1-ap-northeast-1.pooler.supabase.com:6543` has intermittently failed during prior E2E seed/session calls. If failure occurs before application assertions, document it separately from application failures.

### Previous Story Intelligence

- Story 6.1 established the completion page and completed-program guardrails.
- Do not reintroduce the Story 6.1 removed `Progress overview` self-loop CTA.
- Keep `Review Day 14` and Chat next-step actions intact.
- `resolveCurrentProgramForUser()` already handles completed programs by effective Day 14; reuse it.
- Story 6.1 validation passed `pnpm typecheck`, `pnpm lint`, and focused completion Playwright tests.
- Epic 6.3 owns sharing; Epic 7 owns analytics.

### Likely Files to Add or Modify

- `src/lib/program/completion-report-service.ts`
- `src/app/api/program/report/route.ts`
- `src/app/(app)/completion/page.tsx`
- `src/components/completion/report-download-action.tsx` (only if client-side retry/error state is needed)
- `e2e/program-entry.spec.ts` or a focused report E2E/API spec
- `stories/6-2-downloadable-summary-report.md`
- `stories/sprint-status.yaml`
- `项目主档案.md`

Files that should not change unless a narrow compile/test requirement forces it:

- `prisma/schema.prisma`
- Stripe checkout/webhook code
- Chat API/provider/quota code
- share routes or share modules
- analytics modules
- report persistence/storage modules
- program template content JSON files

### References

- `epics.md` Epic 6 Story 6.2.
- `技术架构详细设计.md` §5 app structure, §7.5 page structure, §9.2 Day View -> Completion, §14.3 testing strategy.
- `UX设计规格说明.md` safety/disclaimer and completion summary references.
- `stories/6-1-completion-experience-for-day-14.md`.
- `src/app/(app)/completion/page.tsx`.
- `src/app/api/program/current/route.ts`.
- `src/app/api/program/day/[day]/complete/route.ts`.
- `src/lib/program/current-program-service.ts`.
- `e2e/program-entry.spec.ts`.

## Dev Agent Record

### Agent Model Used

GPT-5.5

### Debug Log References

- Story created after Story 6.1 was implemented, lightly reviewed, patched, validated, and marked `done`.
- `_bmad/bmm/config.yaml` and `.cursor/rules/project-context.mdc` do not exist in this repository; paths were resolved from project root, `项目主档案.md`, and `stories/sprint-status.yaml`.
- Source discovery loaded via exact reads and targeted search: `epics.md`, `技术架构详细设计.md`, `UX设计规格说明.md`, Story 6.1, completion page, program current API, day completion API, current-program service, package dependencies, and focused E2E patterns.
- Recent git commit titles are not descriptive (`1`), so current working files and story records were used as the reliable source of implementation intelligence.

### Completion Notes List

- Story 6.2 should add a protected downloadable summary report for completed users.
- The story allows PDF or equivalent downloadable summary, but current repo has no PDF dependency; dependency-free HTML/text download is the recommended MVP path unless explicit approval is obtained.
- The report must be non-diagnostic, educational, and safe, and must not include sharing, analytics, persistence, schema changes, or internal operational data.
- The dev agent should reuse Story 6.1 completion guardrails and preserve `/completion` behavior.
- Implemented a dependency-free HTML report builder gated on completed paid programs via `resolveCurrentProgramForUser()`.
- Added protected `GET /api/program/report` with attachment headers, `Cache-Control: no-store`, safe JSON failure states, and safe metadata logging.
- Added a completion-page download CTA with client-side recoverable error feedback while preserving Review Day 14 and Chat actions.
- Added focused report tests for completed download, unauthenticated/active rejection, malformed final content safe failure, failure UI, safe content boundaries, and absence of share/analytics/internal data leakage.
- Validation passed: `pnpm typecheck`, `pnpm lint`, and focused Playwright report/completion coverage (`6 passed`).

### File List

- `stories/6-2-downloadable-summary-report.md`
- `src/lib/program/completion-report-service.ts`
- `src/app/api/program/report/route.ts`
- `src/components/completion/report-download-action.tsx`
- `src/app/(app)/completion/page.tsx`
- `e2e/program-entry.spec.ts`
- `stories/sprint-status.yaml`
- `项目主档案.md`

### Change Log

- 2026-05-10: Created Story 6.2 with protected downloadable summary report scope, dependency-conscious PDF/equivalent boundary, safety/privacy guardrails, sharing/analytics exclusions, and focused regression guidance; story marked ready-for-dev.
- 2026-05-10: Implemented dependency-free downloadable HTML summary report, protected report route, completion CTA, recoverable error feedback, focused E2E coverage, and validation; story marked code-review.
- 2026-05-10: Light `bmad-code-review`: AC 对齐与边界核查通过；已修复 `GET /api/program/report` 异常路径日志仅记录安全元数据（Error 的 name/message），避免整对象/stack 写入日志；story 标记 done。

## Review Findings (Story 6.2)

### Blind Hunter（误导 / 产品边界）

- [x] **无** 将产物标成 PDF：`Content-Type` 为 `text/html; charset=utf-8`，文件名为 `.html`，与 AC3「PDF 或等价可下载格式」一致；未引入 PDF 依赖。
- [x] **无** completion CTA 伪装成分享：`ReportDownloadAction` 为 `fetch` + Blob 下载，无 Web Share / copy-link / 社交文案。
- [x] **无** 下载响应缓存导致串号：成功与错误响应均带 `Cache-Control: no-store`。

### Edge Case Hunter（异常与泄露）

- [x] **已处理** 异常处理器原先把整颗 `error` 打进 `console.error`，与 AC7「仅安全元数据」有偏差；已改为仅展开 `Error` 的 `name` / `message`（或 `typeof`）。
- [x] **低优先级 / 不修改** 客户端对所有非 2xx 统一展示「请重试」：对真实已完成用户极少出现 403；若未来要在 UI 区分「需重新登录」与「请重试」，可再解析 JSON `message`。
- [x] **低优先级 / 不修改** `link.download` 与 `completionReportFilename` 字面量重复：可日后抽到共享常量，当前风险低。

### Acceptance Auditor（对照 AC）

- AC1–2：仅 `COMPLETED` + paid resolver 生成；未鉴权 401 JSON、active 403 JSON，不返回 HTML 报告体。
- AC3：`attachment`、`text/html; charset=utf-8`、稳定文件名。
- AC4–5：非诊断与安全边界 + danger-signal；表格字段经 `escapeHtml`；不含 `contentJson`、内部 ID、支付/chat 等（E2E 已断言）。
- AC6–7：completion 页 CTA + `role="alert"` 错误区；服务端失败日志收紧。
- AC8：`missing_day_content` / 缺失 title、focus → 409，不输出畸形日程正文。
- AC9：未改 schema、无 analytics 事件名、无 report 持久化（检索与测试一致）。
- AC10：`program-entry.spec.ts` 覆盖下载头、401/403/409、内容边界、UI 失败、无 share/analytics 字符串。

### 结论

**Approved with patch applied**（日志安全化）；无 sharing / analytics / schema creep 问题需跟进入线。
