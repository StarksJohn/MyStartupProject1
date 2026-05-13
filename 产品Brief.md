# 产品 Brief：Fracture Recovery AI Companion（首版聚焦手指 / 掌骨）

> 版本 v1.2 · 2026-04-19 · 基于 `立项决策 Conditional Go` + 5 项关键决策 + 定价微调至 $14.99 + 技术栈升级 Next.js 16 并沿用 lease-guard 基础栈
> 主文档同步：`<项目根目录>/项目主档案.md`（项目根目录：**Windows** `D:\work\MyStartupProject1`；**macOS** `/Users/stark/Desktop/work/MyStartupProject1`）

---

## 1. Executive Summary

**产品名**（工作代号）：`Fracture Recovery AI Companion`（英文 landing 暂用 `CastOff`，需商标清查后定稿）

**一句话**：*Your 24/7 fracture recovery coach — personalized daily exercises for the critical 2 weeks after cast removal.*

**首版定位**：面向 `25-45 岁、拆石膏前后 2 周的手部骨折（手指 / 掌骨）` 海外英语用户的结构化康复陪伴网站。$14.99 一次性买断 14 天个性化计划 + 每日动作指导 + 24h AI 答疑，明确以 `education & companion, not medical device` 定位规避 FDA SaMD 风险。

**差异化**：市面康复 App（Curovate / Sera）只做 ACL / 膝 / 髋；好大夫 / 丁香是 5 分钟图文问诊；Hinge Health / Sword / Kaia 走 B2B2C 雇主保险。**骨折细分 + C 端独立付费 + 拆石膏窗口个性化 = 空白区**。

**3 月 PMF 目标（调整后，适配 $14.99 一次性买断）**：`60-100 付费用户 / $900-1500 累计营收 / 访问到付费转化 ≥ 2% / 14 天完成率 ≥ 40% / ≥ 5 个自然 referral 或公开推荐`。

---

## 2. Problem Statement

### 目标用户的现状痛点（A 型主画像）

拆石膏前后 2 周是手部骨折康复中**窗口不可逆**的关键期。患者典型处境：

- **医生 3 分钟复查后回家**：医生通常说"回家自己多动"，但不给具体动作、次数、频率、禁忌。
- **搜索引擎碎片化**：Google 出来的是 Healthline / WebMD 综合科普，没有**按天**、按**拆石膏第几天**、按**具体动作**的操作指南。
- **Reddit / Facebook 病友群答非所问**：别人的骨折部位 / 严重程度 / 医生建议都不同，建议无法直接套用。
- **情绪叠加**：`怕 + 急 + 孤独 + 无力`——怕动错导致二次伤害、急着恢复工作、孤独（家人无法理解康复焦虑）、无力（不知道今天到底该做什么）。
- **付费意愿的硬触发**：拆石膏当天医生说完"回家多动"的 30 分钟内是最强付费窗口；关节僵硬恐慌期（拆石膏后 3-5 天）是第二窗口。

### 为什么现有方案不够

| 替代方案 | 为什么不够 |
|---|---|
| Curovate / Sera | 只做膝 / 髋 / ACL，完全不做手部骨折 |
| Healthline / NHS 科普 | 不按天 / 不按个体阶段 / 不答疑 |
| Reddit r/fractures | 非专业 + 非结构化 + 延迟回复 |
| 好大夫图文问诊 | 5 分钟一答 + 不成系统 + 中文市场 |
| 线下康复师 | 美国 $80-150 / 次，手部骨折一般不转诊 PT |
| Hinge / Sword / Kaia | 走企业雇主保险，C 端个人无渠道接入 |

### 规模信号

- 美国每年手部骨折（含手指 / 掌骨）约 100 万例
- 其中拆石膏窗口 2 周患者约 20-40 万，SEO 长尾触达 5% ≈ 月 800-1600 unique visitors
- 2% 付费转化 × 月 1200 访客 × $14.99 ≈ 月 $360 / 3 月 ≈ $900-1500（与 PMF 目标一致）

---

## 3. Proposed Solution

### 核心价值主张

**"从拆石膏那一刻起，接下来 14 天每天 5 分钟，我告诉你今天动什么、怎么动、动到什么程度、出现什么症状该担心。"**

### 用户旅程（14 天核心路径）

1. **落地**（SEO 长尾 / Reddit 分享 / ProductHunt）→ 落地页说明"14 天拆石膏后计划 + 24h AI 答疑 + $14.99 一次买断"
2. **Onboarding 2 分钟问卷**：骨折部位（手指/掌骨子类）+ 拆石膏日期 + 医生是否转诊 PT + 是否有钢板 / 螺钉
3. **付费 $14.99**（Stripe Checkout / LemonSqueezy，无账号门槛，邮箱即用户名）
4. **14 天每日计划**：每天 4-6 个动作，每个动作含 ≤ 30 秒示范视频 + 次数 + 计时器 + 常见问题（"做完还肿怎么办？"）
5. **24h AI 答疑**：基于用户档案 + AAOS / NHS 公开康复协议 + RAG 知识库，回答"我今天还很僵正常吗？"类问题；危险信号关键词（剧痛 / 发紫 / 无法握拳）自动触发**建议立即联系医生**
6. **每日打卡**：完成动作点对勾，生成进度条（心理安慰价值高）
7. **第 14 天总结报告**：发放 PDF 可下载 + 邀请分享给其他病友 + 引导转入"维持期 30 天"免费内容（为 LTV 延长和 referral 铺垫）

### 非要件（明确排除）

- 不诊断、不判断骨折类型、不替代医生、不建议停药或改变医嘱
- 不做医院对接、不做医生端工具、不做保险报销
- 不做一对一人工咨询（首版）
- 不做多语言（首版纯英文）
- 不做硬件、不做穿戴、不做可视化 3D

---

## 4. Target Users

### 主画像 A（首版唯一聚焦）

- **地理**：美国（英语母语 + 高支付能力 + Stripe 覆盖最好）
- **年龄 / 收入**：25-45 岁，年薪 $50k+，大学以上
- **骨折场景**：手指（近节 / 中节 / 末节指骨）、掌骨（第 2-5 掌骨最常见）；闭合性、非粉碎性、已完成石膏 / 夹板固定 4-6 周
- **触发时点**：拆石膏前 2 天 → 拆石膏当天 → 拆石膏后 2 周
- **情绪**：`怕 + 急 + 孤独 + 无力`，对"具体执行方案"愿意立即付钱（$20 以内冲动决策）
- **使用终端**：Mobile Web 为主（60-70%），Desktop Web 次之（拆石膏后手还不方便打字的人更偏手机语音输入）

### 非目标（明确不打）

- 老年髋骨骨折 / 复杂粉碎骨折 / 开放性骨折 / 儿童骨折 / 怀疑骨折未就医 / 术后感染
- 足踝 / 锁骨用户（延后到 v2）
- 运动员职业恢复（延后到 B 型次画像）

---

## 5. Goals & Success Metrics

### 3 个月目标（PMF 信号，一次性买断口径）

| 指标 | 目标值 | 诚实口径说明 |
|---|---|---|
| 付费用户数 | 60-100 人 | 原目标 30-100，聚焦单部位后下限上提 |
| 累计营收 | $900-1500 | 替代原"MRR $300-1000"，$14.99 一次性买断口径 |
| 访问 → 付费转化率 | ≥ 2% | Reddit / SEO 混合来源加权 |
| 14 天完成率 | ≥ 40% | 替代原"30 日留存"，买断后"完成"即价值兑现 |
| 自然 referral / 公开提及 | ≥ 5 次 | Reddit / Twitter / 博客公开推荐计数 |
| 差评或退款率 | ≤ 10% | Stripe 退款窗口 7 天内 |

### 6 个月 / 12 个月目标（扩展窗口）

- 6 月：扩展足踝 → `累计 300-500 付费 / $4500-7500 营收 / 2 个部位同时在售`
- 12 月：扩展锁骨 + 启动中国站（营业执照就绪后）→ `累计 1000-2000 付费 / $15000-30000 营收`

### North Star Metric

**"拆石膏后 14 天完整完成率"**（用户买了、用了、完了、值回 $19.99 的闭环信号）——高于 40% 代表产品真解决了问题；低于 30% 则需要回退到 `问题 / 需求验证`。

---

## 6. MVP Scope

### 6.1 必做（Must Have）

- [ ] 落地页（SEO-first，英文，手部骨折场景话术）
- [ ] 2 分钟 Onboarding 问卷（7-10 题）
- [ ] Stripe Checkout 一次性买断 $14.99
- [ ] 14 天个性化日程（基于问卷输出 3-5 个变体模板，LLM 做微调整）
- [ ] 每日动作卡片：≤ 30 秒示范视频（自己录 + guzhe 参考）+ 次数 + 计时器 + 注意事项
- [ ] 24h AI 答疑聊天框（Gemini Flash 免费 Tier + RAG 知识库）
- [ ] 危险信号关键词检测 + 强制建议就医 Disclaimer
- [ ] 每日打卡 + 进度条
- [ ] 第 14 天 PDF 总结报告
- [ ] Share 按钮（Twitter / Reddit / Email / Copy Link）
- [ ] Footer 合规：`Not a medical device. For education and companion purposes only. Always consult your doctor.`

### 6.2 不做（Out of Scope，v1 明确不做）

- 足踝 / 锁骨 / 其他部位
- 多语言 / 多币种
- 订阅 / 月费
- 账号系统（邮箱 + magic link 足够）
- 移动端原生 App（PWA 即可）
- 社群 / 论坛
- 1v1 人工咨询
- 保险对接 / PT 推荐
- 硬件 / 穿戴

### 6.3 MVP 成功标准（能上线的最低门槛）

- 落地页 Google PageSpeed ≥ 85
- 支付流程从落地页到付费完成 ≤ 3 分钟
- 14 天内容已完整制作（至少 5 个问卷变体对应的日程）
- AI 答疑对 30 个常见问题的回答通过 guzhe 人工审核
- 免责声明 + 隐私政策 + 退款政策 3 份法律文档就绪

---

## 7. Post-MVP Vision

- **v1.1（M4-6）**：足踝骨折 + 购买后 30 天维持期免费内容（延长 LTV）
- **v1.2（M6-9）**：锁骨 + 邮件 nurture 序列 + 向付过费用户追加销售"运动员恢复包"$29
- **v2.0（M9-12）**：PWA 推送 + 计时器离线化 + 启动中国站（需营业执照）
- **v3.0（Y2）**：B 型次画像（18-35 岁运动伤骨折，1v1 专家视频 $49-59）

---

## 8. Technical Considerations

### 技术栈（决策 A：Next.js 16 App Router + Vercel，基础栈沿用 `D:\work\MyStartupProject\lease-guard`）

> **复用策略**：lease-guard 是本人上一个已上线的 Next.js 16 项目，业务不同（合同分析 vs 康复陪伴）但基础栈高度重合。本项目直接沿用同一套基础栈，**节省选型时间 + 避免踩坑 + 可直接复制配置文件 / 部署脚本 / ESLint 规则 / Sentry 集成**。只在业务层做替换（上传 PDF → 问卷 + 日程 / 订阅 → 一次性买断 / 合同分析 → 康复答疑）。

#### 核心框架与运行时

| 层 | 选型 | 理由 / lease-guard 对齐 |
|---|---|---|
| 框架 | **Next.js 16 App Router + React 19 + TypeScript 5** | 与 lease-guard 完全对齐；SSR + SSG + API Routes 三位一体，SEO 友好 |
| 包管理 | **pnpm 8+** | 与 lease-guard 对齐；磁盘占用低、workspace 支持 |
| 部署 | **Vercel Free Tier** | 0 成本、Edge Functions 免费、域名自带 HTTPS；可直接复用 lease-guard 的 `scripts/deploy.ps1` 与 `deploy:verify` 脚本 |

#### UI / 样式 / 交互

| 层 | 选型 | 理由 |
|---|---|---|
| 样式 | **Tailwind CSS 4 + @tailwindcss/postcss** | 与 lease-guard 对齐 |
| 组件库 | **shadcn/ui + Radix UI primitives**（accordion / dialog / dropdown-menu / progress / select / tabs / collapsible 等）| 与 lease-guard 对齐；每日页进度条、问卷 Tabs、AI 答疑 Dialog 都能直接用 |
| 图标 | **lucide-react** | 与 lease-guard 对齐 |
| Toast | **sonner** | 与 lease-guard 对齐；付费成功 / 打卡成功用 |
| 样式工具 | **class-variance-authority + clsx + tailwind-merge + tw-animate-css** | 与 lease-guard 对齐 |
| 暗色模式 | **next-themes** | 与 lease-guard 对齐；非刚需但零成本 |

#### 状态管理 / 数据层

| 层 | 选型 | 理由 |
|---|---|---|
| 服务端状态 | **@tanstack/react-query v5 + devtools** | 与 lease-guard 对齐；缓存 14 天日程 / AI 答疑历史 |
| 客户端状态 | **Zustand v5** | 与 lease-guard 对齐；每日打卡状态、UI 状态 |
| 表单 | **React Hook Form + Zod + @hookform/resolvers** | 与 lease-guard 对齐；Onboarding 问卷就是表单 |
| 日期工具 | **date-fns v4** | 与 lease-guard 对齐；"拆石膏第 N 天"计算 |

#### 后端 / API / 数据

| 层 | 选型 | 理由 |
|---|---|---|
| API | **Next.js API Routes（App Router）** | 与 lease-guard 对齐；无需独立后端 |
| ORM | **Prisma 6** | 与 lease-guard 对齐 |
| 数据库 | **SQLite（dev，`dev.db`）+ PostgreSQL（prod，Supabase）** | 与 lease-guard 对齐；本地开发零网络延迟、生产 Supabase Free Tier 500MB 够跑 |
| Auth | **NextAuth.js v4 + @auth/prisma-adapter**（Magic Link Email 为主，开发环境 Credentials Provider）| 与 lease-guard 对齐；**省去自写 Magic Link 一周工作量** |
| 邮件 | **Resend**（100 封/天免费）+ **nodemailer** 备选 | 与 lease-guard 对齐；Magic Link + 14 天 nurture + 完成报告 |
| 支付 | **Stripe（@stripe/stripe-js + stripe）** | lease-guard 用的是 Subscription，本项目改为 **Stripe Checkout 一次性付款（`mode: 'payment'`）** |
| 限流 / 缓存 | **@upstash/redis** Free Tier（10k req/day）| 与 lease-guard 对齐；AI 答疑每用户每日 20 条限额 |

#### AI / RAG

| 层 | 选型 | 理由 |
|---|---|---|
| AI SDK | **Vercel AI SDK（`ai` v6）** | 与 lease-guard 对齐；统一 streaming + provider 抽象 |
| LLM 主 | **Gemini 2.5 Flash Free Tier**（1500 req/day）| 免费额度够首版 |
| LLM 降级 | **Groq Llama 3.3 70B Free Tier**（6000+ req/day）| 沿用 lease-guard 的降级策略思想，**简化为 2 档**（不需要中国 provider） |
| RAG 向量 | **pgvector**（Supabase 原生支持，Prisma + unsupported 类型注入）| 比 Cloudflare Vectorize 更贴近 Prisma 生态；200-500 chunks 完全够 |
| Prompt 工程 | 系统 prompt 固化 `not a doctor / not diagnosis / suggest consulting doctor`；关键词触发 escalate | 复用 lease-guard 的"risk keyword + fallback"思路 |

#### 内容媒介

| 层 | 选型 | 理由 |
|---|---|---|
| 视频托管 | **Cloudflare Stream Free Tier** 或 **YouTube Unlisted** | 0 成本；≤ 30 秒视频几十个足够 |
| PDF 生成 | **@react-pdf/renderer** 或 **puppeteer**（Vercel 支持）| 第 14 天完成报告 |
| 分析 | **Plausible Self-Hosted** 或 **Umami Cloud Free** | 无 Cookie、合规友好 |

#### 质量保障 / 监控

| 层 | 选型 | 理由 |
|---|---|---|
| 单元测试 | **Jest + @testing-library/react + ts-jest** | 与 lease-guard 对齐 |
| E2E 测试 | **Playwright（含 visual regression + API 测试子套件）** | 与 lease-guard 对齐；可直接复用 lease-guard 的 `playwright.config.ts` |
| 错误监控 | **Sentry（@sentry/nextjs）** | 与 lease-guard 对齐；直接复用 `instrumentation.ts` + `sentry.client.config.ts` |
| Lint | **ESLint 9 + eslint-config-next** | 与 lease-guard 对齐 |
| CI | 暂不做 GitHub Actions；Vercel Preview 即 PR 验证；Playwright 本地跑 | 独开阶段降复杂度 |

#### 可从 lease-guard 直接复制的资产清单

以下文件可直接复制到新项目，改项目名 / 去掉合同业务逻辑即可，**节约 20-40 小时**：

- `next.config.ts` + `tsconfig.json` + `eslint.config.mjs` + `postcss.config.mjs`
- `prisma/schema.prisma` 模板（保留 User / Session / VerificationToken 三表，删除 Contract 相关）
- `src/lib/auth.ts`（NextAuth 配置）
- `src/lib/prisma.ts`（Prisma 客户端单例）
- `src/lib/query-client.ts`（React Query 配置）
- `src/lib/stripe/`（Stripe 封装，改为 one-time payment mode）
- `src/components/ui/`（shadcn 全部原语）
- `src/components/providers/`（Theme / Query / Auth 三层 Provider）
- `src/stores/auth.store.ts` + `src/stores/ui.store.ts`
- `scripts/deploy.ps1` + `scripts/verify-env.ts`
- `jest.config.js` + `jest.setup.js` + `playwright.config.ts`
- `sentry.client.config.ts` + `instrumentation.ts` + `instrumentation-client.ts`
- `.env.example`（改变量名）+ `components.json`（shadcn 配置）

### 关键工程决策

- **基础栈与 lease-guard 对齐**：节省选型 + 可直接复制配置与脚本，首周技术初始化从预计 6 小时压到 2-3 小时
- **一次性付款 vs 订阅**：Stripe Checkout 用 `mode: 'payment'` 而非 `mode: 'subscription'`；webhook 监听 `checkout.session.completed` 事件解锁 14 天内容
- **数据库双轨**：本地 SQLite（Prisma `datasource` 切换），生产 Supabase Postgres + pgvector；**一套 Prisma schema 两环境**
- **AI 降级链简化**：只做 2 档（Gemini 2.5 Flash → Groq Llama 3.3 70B）；不做 lease-guard 的中国 provider 链（本项目首版只海外）
- **内容 headless**：动作视频元数据 + 文案走 JSON / MDX，不做 CMS，guzhe 直接编辑 Git
- **RAG 知识库冷启动**：首版索引范围 = AAOS 官方手部康复协议 + NHS hand therapy guide + guzhe 日记英文化 + 30 个手动精校 FAQ，约 200-500 chunks；使用 Supabase pgvector + Prisma `Unsupported("vector(1536)")` 注入
- **Prompt 护栏**：所有 LLM 输出前置 system prompt 明确 `not a doctor, not diagnosis, suggest consulting doctor when keywords hit`；关键词命中表包括 `severe pain, purple, numb, can't move, fever, pus` 等
- **限流策略**：Upstash Redis 按 `userId + date` key 计数，每用户每日 AI 答疑 20 次上限；超限降级到纯 RAG 检索返回 FAQ

### 隐私与合规

- 不存储 PHI（受保护健康信息）：问卷只存部位 + 拆石膏日期，不存姓名、医院、病历号
- 不做 HIPAA（因不与医疗机构交互）
- Cookie 仅必要；GDPR / CCPA 标准横幅
- 免责声明在落地页、付费页、每日页、AI 答疑框 4 处都可见

---

## 9. Constraints & Assumptions

### 硬约束（独立开发者 + 0 投资）

- 开发时间：每周 20 小时兼职，3 月 ≈ 240 小时总预算
- 现金支出：$0（域名 $10-15 除外）
- 无团队、无医师背书、无法律顾问
- 无法做广告投放（$0 预算）

### 关键假设（需要在 Draft 后验证）

| 假设 | 风险 | 验证动作 |
|---|---|---|
| 拆石膏窗口用户会搜 `hand fracture cast removal exercises` | 中 | Ahrefs 免费查询 + Google Trends 验证搜索量 |
| $14.99 一次性买断愿意支付 | 中 | Reddit 预售帖 / Landing Page 预订单转化（$14.99 属工具档位下沿，低于此档位将损失专业感知） |
| Gemini Flash 免费额度撑得住 | 低 | 每用户每日答疑限额 20 条，超限降级到纯知识库检索 |
| guzhe 真实案例可公开化 | 低 | 已经在 `D:/work/guzhe/left_middle_finger_treatment_plan.md` 沉淀，改写英文化即可 |
| Next.js + Vercel 免费 Tier 撑住 1000 用户 | 低 | Vercel 免费 100 GB 带宽 / 月，足够 |

---

## 10. Risks & Open Questions

### 高风险（需持续监控）

1. **SEO 冷启动慢**：3-6 月才见效，3 月内达标挑战大 → **缓解**：Reddit 并行 + 第 1 月发 ProductHunt
2. **FDA SaMD 合规边界**：若用户理解为"诊断"可能被举报 → **缓解**：文案 4 处可见免责，AI 答疑关键词强制 escalate
3. **LTV 3-6 月短周期**：用户康复完就走 → **缓解**：v1.1 足踝扩展 + 30 天免费维持期引流 + referral
4. **英语非母语写作质量**：影响转化 → **缓解**：Claude / GPT 辅助润色 + 美国康复师访谈素材
5. **单部位 TAM 紧**：手指 / 掌骨月触达 800-1600 人、2% 转化约 月 16-32 付费，3 月累计 48-96 → 刚好卡在目标下限 → **缓解**：若月付费 < 15 则立即启动足踝扩展，不等 6 月
6. **退款率风险**：Stripe 7 天退款窗口内若用户觉得"我自己也能 Google 到"会退 → **缓解**：前 7 天内容密度前置 + 实时答疑作为核心感知价值
7. **$14.99 定价档位风险**：$14.99 处于"工具档"与"便宜 App 档"的边界线，若 Reddit 预售或落地页 A/B 显示被误判为"便宜 App"，考虑回调 $19.99 + 7 天退款承诺 → **缓解**：落地页文案显著强调"14 天专业计划 + 24h AI 答疑"，避免单纯以价格卖点

### 开放问题（交给下游阶段 / 并行 spike 解决）

- [ ] 产品名与商标清查（`CastOff` / `Knit` / `MendCast` 等候选）→ `bmad-agent-pm` 立项文档阶段
- [ ] SEO 关键词实测与月搜索量确认 → 并行 spike（Ahrefs 免费版 / Ubersuggest）
- [ ] 美国康复师 / 骨科医师 KOL 接触名单 → 并行 spike（LinkedIn + Reddit r/physicaltherapy）
- [ ] 视频制作工作流（自拍 + 字幕 + 配音 AI）→ `bmad-agent-architect` 技术方案阶段细化
- [ ] 免责声明 + 隐私政策 + 退款政策具体英文文本 → `bmad-agent-architect` + 法律模板
- [ ] 落地页文案 A/B 版本（情绪型 vs 功效型）→ `bmad-agent-ux-designer` 阶段

---

## 11. Appendices

### A. 关键研究引用（已在主文档沉淀）

- 竞品分析：Curovate / Sera / Hinge / Sword / Kaia / 好大夫 / 骨事通 / 骨典 / 复骨医疗
- 真实案例素材：`D:/work/guzhe/left_middle_finger_treatment_plan.md`
- 合规参考：FDA SaMD 指南、AAOS 手部康复协议、NHS hand therapy guide

### B. 5 项关键决策记录（v1.0）

| 决策点 | 选择 | 备选（已放弃） |
|---|---|---|
| 付费模式 | 一次性 $14.99 买断单档位（v1.1 修订） | 原 v1.0 $19.99 → 感知降价微调 / $9.99 过低损失专业感知 / 月订阅 $9.99 / 年 $59 / 双轨并行 |
| 首版部位范围 | 仅手指 / 掌骨 1 个部位 | 手 + 足踝 2 个 / 手 + 足踝 + 锁骨 3 个 |
| 前端技术栈 | **Next.js 16 App Router + React 19 + Vercel，基础栈沿用 lease-guard**（v1.2 修订） | 原 v1.0 Next.js 14 → 已升级 / Astro + Cloudflare / 纯 React SPA |
| 动获渠道 | SEO 长尾 + Reddit 垂直板块 | ProductHunt / Twitter / Facebook Groups |
| 推荐裂变 | 纯口碑，只加分享按钮 | 双方 $5 返现 / 推荐解锁内容 / 订阅延长 |

---

## 12. Next Steps

### 阶段切换

- 当前阶段完成：`Product Brief`
- 下一阶段入口：`bmad-agent-pm`（路线图与 MVP 版本规划）
- 允许继续推进：`是`
- 是否需要回退：`否`

### Brief 定稿后的并行动作（不阻塞下一阶段）

1. **SEO 关键词实测**：用 Ahrefs 免费版 / Google Keyword Planner 查 `hand fracture cast removal exercises`、`metacarpal fracture recovery timeline`、`finger fracture rehabilitation exercises` 等 10-15 个长尾词的月搜索量
2. **guzhe 案例英文化改写**：把 `D:/work/guzhe/left_middle_finger_treatment_plan.md` 改写成 1 篇 2000 字权威博客（作为内容站首篇种子）
3. **商标 / 域名清查**：`CastOff` / `MendCast` / `Knit` 等候选在 USPTO + Namecheap 查可用性
4. **美国康复师 KOL 接触**：LinkedIn 搜 `hand therapist certified` + Reddit r/physicaltherapy 发帖求 30 分钟访谈

### Brief 定稿后的下游阶段入口

- `bmad-agent-pm` → 路线图 / 版本规划 / 里程碑切分（3 月 / 6 月 / 12 月）
- `bmad-agent-architect` → 技术架构 detailed design（Next.js 结构、数据模型、RAG 检索、Prompt 工程）
- `bmad-agent-ux-designer` → 落地页 / Onboarding / 每日页 UX 原型
- `bmad-check-implementation-readiness` → Brief + 路线图 + 架构 就绪度检查，通过后进入 `需求拆解`

---

**Brief 版本控制**：本文档当前 v1.1；任何关键决策变更（付费模式 / 部位范围 / 技术栈 / 渠道 / 裂变机制）需回到 `立项决策` 重新评估，并同步更新主文档。

### 版本历史

- v1.0（2026-04-19）：5 项关键决策一次性拍板（$19.99 一次性买断）
- v1.1（2026-04-19）：定价从 $19.99 微调至 $14.99；不触发阶段回退；同步更新 KPI 营收数字与 6 / 12 月目标
- v1.2（2026-04-19）：技术栈从 Next.js 14 升级到 Next.js 16 + React 19；基础栈全面沿用 `D:\work\MyStartupProject\lease-guard`；补全 pnpm / Prisma 6 / NextAuth.js v4 / shadcn+Radix / React Query + Zustand / RHF+Zod / Upstash Redis / Vercel AI SDK / Jest + Playwright 等；列出 18 项可直接复制的配置资产
