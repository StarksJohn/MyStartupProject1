# 路线图与 MVP 计划：Fracture Recovery AI Companion

> 版本 v1.1 · 2026-04-19 · 基于 `产品Brief.md v1.2`（基础栈沿用 `D:\work\MyStartupProject\lease-guard`）
> 来源：`bmad-agent-pm` 阶段输出
> 时间盒：3 月（13 周，W1-W13）· 20 小时 / 周 · 总预算 ≈ 260 小时
> 主文档同步：`D:\work\MyStartupProject1\项目主档案.md`

---

## 1. 战略摘要

**3 月目标**：上线可售卖的 MVP，取得 **60-100 付费用户 / $900-1500 累计营收 / 14 天完成率 ≥ 40%** 的 PMF 信号。

**核心节奏**：
- **W1-W2 Foundation**：技术骨架 + 法律文档 + 内容大纲
- **W3-W4 Content MVP**：14 天课程内容 + 视频素材 + 知识库 ingest
- **W5-W6 Product MVP**：端到端漏斗可用（落地 → 问卷 → 付费 → 每日页 → AI 答疑）
- **W7-W8 Polish + Launch Prep**：测试、合规、SEO 种子文、Reddit 预热
- **W9-W10 Soft Launch**：Reddit 首发 + 前 10-20 付费用户
- **W11-W13 Scale + PMF 验收**：ProductHunt + 内容放量 + PMF 结论与 go/no-go

**关键原则**：
- **不追求完美，追求可卖**。W6 末 MVP 即使丑陋也要能收到真实付费
- **内容是护城河，不是锦上添花**。内容质量 > 技术炫技
- **决策闸门优先于时间盒**。Gate 未过不硬推进到下阶段，优先缓解而非蛮推
- **并行 spike 不阻塞主路径**。SEO / 商标 / KOL 用碎片时间推
- **基础栈沿用 `lease-guard`**。同一套 Next.js 16 + Prisma + NextAuth + Stripe + Sentry + shadcn/ui + React Query + Zustand + RHF/Zod + Playwright 组合，直接复制 18 项配置资产，**首周技术初始化从预计 20h 压到 10-12h**，累计节省约 **30 小时**（12% 总预算）

### lease-guard 复用强度分级

| 强度 | 内容 | 节省 | 说明 |
|---|---|---|---|
| 🟢 **直接复制** | next.config / tsconfig / ESLint / postcss / shadcn ui / providers / Prisma client / query-client / Zustand stores / Jest+Playwright 配置 / Sentry / deploy.ps1 / verify-env | ~15h | 无业务耦合，改项目名即用 |
| 🟡 **改造复用** | NextAuth 配置（去 Google OAuth，只留 Magic Link）/ Stripe 封装（subscription → payment）/ AI Provider 降级框架（5 档 → 2 档）/ prisma schema（去 Contract 表，加 Purchase + DayProgress + ChatMessage）| ~10h | 业务层替换，框架保持 |
| 🔴 **从零开发** | 14 天日程规则引擎 / 问卷 → 变体映射 / 每日页 UI / 完成报告 PDF / 康复答疑 Prompt 工程 / RAG 知识库构建 | - | 本项目独有业务 |
| ⚫ **明确不复用** | 合同 PDF 解析（pdf-parse） / 中国 AI provider 链（DeepSeek / Zhipu / Qwen）/ 订阅 Tier 管理 / next-intl（首版纯英文） | - | 不属于本项目范围 |

---

## 2. 里程碑总览

| 里程碑 | 目标周 | 交付物 | Gate 判定 |
|---|---|---|---|
| M1 Tech Foundation | W2 末 | Next.js 项目骨架 + 域名 + 部署流水线 + 法律文档草稿 | Vercel 上线可访问 404 页面 |
| M2 Content MVP | W4 末 | 14 天课程 (1 个问卷变体) + 10 个示范视频 + 30 条 FAQ + RAG 知识库首批入库 | guzhe 审核通过 ≥ 80% |
| M3 Product MVP | W6 末 | 端到端漏斗跑通 + Stripe 能收真钱 + AI 答疑可用 | 内部 3 人完成付费→14 天课程→分享全流程 |
| M4 Launch Ready | W8 末 | SEO 种子 5 篇 + Reddit 账号养号完成 + 落地页转化 > 1%（小流量测） | 落地页 → 付费转化 ≥ 1%（≥ 100 访客样本） |
| M5 Soft Launch | W10 末 | Reddit 首发 + 前 10-20 付费用户 + 首批退款数据 | 付费用户 ≥ 10，退款率 ≤ 15% |
| M6 PMF Assessment | W13 末 | 60-100 付费 / $900-1500 / 14 天完成率 ≥ 40% | PMF Gate 决策：扩展足踝 / 延期 / 回退 |

---

## 3. 周级路线图

### Phase 0 — Foundation（W1-W2，40 小时）

#### Week 1（20h）

**主路径**：
- [ ] 域名 / 商标候选清查（`CastOff` / `MendCast` / `Knit` / `HandMend` USPTO + Namecheap + 各社交 handle）→ 4h
- [ ] 选定域名 + 购买（约 $10-15，本项目唯一现金支出）→ 1h
- [ ] **基于 lease-guard 初始化项目**（关键加速点，节省 3-4h）→ 3h
  - `pnpm create next-app` 新建 Next.js 16 项目
  - 从 `D:\work\MyStartupProject\lease-guard` 复制以下文件（见 Brief v1.2 复用清单）：
    - `next.config.ts` / `tsconfig.json` / `eslint.config.mjs` / `postcss.config.mjs` / `components.json`
    - `src/components/ui/`（shadcn 原语全量）+ `src/components/providers/`
    - `src/lib/prisma.ts` / `src/lib/query-client.ts` / `src/lib/utils.ts`
    - `src/stores/auth.store.ts` + `src/stores/ui.store.ts`
    - `jest.config.js` + `jest.setup.js` + `playwright.config.ts`
    - `sentry.client.config.ts` + `instrumentation.ts` + `instrumentation-client.ts`
    - `scripts/deploy.ps1` + `scripts/verify-env.ts`
  - 批量替换项目名 / 去除合同业务相关 imports
  - Vercel 部署流水线打通（首次 push）
- [ ] Prisma schema 骨架 + Supabase Postgres 连接（本地 SQLite + 生产 Postgres 双轨）→ 2h
  - 表：`User / Account / Session / VerificationToken`（NextAuth 必需）+ `Purchase / DayProgress / ChatMessage`（业务）
- [ ] NextAuth.js v4 接入（Magic Link via Resend + Dev Credentials）→ 直接改 lease-guard 的 `src/lib/auth.ts` → 2h
- [ ] 信息架构设计：URL 结构（`/`, `/fracture-recovery-guide`, `/blog/[slug]`, `/app/onboarding`, `/app/day/[n]`, `/app/chat`）→ 2h
- [ ] 落地页框架 v0（无文案）+ footer 免责声明框架 → 4h

**并行 spike**：
- 🔍 **SEO 关键词实测启动**：Ahrefs Free + Google Keyword Planner 查 15 个长尾词月搜索量 + 竞争度 → 出 Top 10 目标关键词清单

**Gate G0（W1 末）**：域名买定 + Vercel 可访问 → 过则推进 W2

---

#### Week 2（20h）

**主路径**：
- [ ] 法律文档草稿（英文）：`Privacy Policy` / `Terms of Service` / `Refund Policy` / `Medical Disclaimer` → 用 `termly.io` 或 `iubenda` 免费模板生成 + 人工校对 → 4h
- [ ] Stripe 账号注册（个人主体）+ Products/Prices 配置（$14.99 one-time）+ Webhook 预留 → **直接复用 lease-guard 的 `src/lib/stripe/` 封装，从 `mode: 'subscription'` 改为 `mode: 'payment'`** → 2h（节省 1h）
- [ ] Upstash Redis 账号 + 限流中间件（复用 lease-guard 的 `@upstash/redis` 封装模式）→ 1h
- [ ] 基础布局组件：Header / Footer / Layout / Mobile-first Responsive → 2h（shadcn 原语已从 lease-guard 复制，省 1h）
- [ ] 14 天课程内容大纲（按拆石膏第 N 天划分阶段：D1-D3 消肿期 / D4-D7 被动活动期 / D8-D14 主动+力量期）→ 4h
- [ ] 问卷 schema v1：7-10 题决定日程变体（部位 / 固定方式 / 拆石膏日 / 医生转诊 PT 与否 / 工作类型 / 疼痛等级）+ Zod schema 定义 → 2h
- [ ] RAG 向量表 schema（Prisma `Unsupported("vector(1536)")` 注入 pgvector 列）+ Supabase pgvector 扩展启用 → 2h
- [ ] Sentry 项目创建 + DSN 配置（复用 lease-guard 的 `sentry.client.config.ts`）→ 1h

**并行 spike**：
- 🔍 **商标清查结论锁定**：USPTO 搜索 + 谷歌搜索确认无冲突 → 确定最终产品名
- 📝 **guzhe 案例英文化开工**：读 `D:/work/guzhe/left_middle_finger_treatment_plan.md` 做第一版英文改写（预计 1500-2000 字，放 `/blog/guzhe-recovery-story`）

**Gate G1（W2 末 / M1）**：Next.js 骨架部署成功 + 法律文档就位 + 课程大纲 guzhe 认可 → 过则推进 Phase 1

---

### Phase 1 — Content MVP（W3-W4，40 小时）

#### Week 3（20h）

**主路径**：
- [ ] 14 天课程详细脚本（每天 4-6 动作 × 14 天 = 56-84 个动作卡片的文本）→ 先做 `(D)手指/掌骨` 单部位单变体 → 10h
- [ ] 示范视频拍摄准备：脚本 + 拍摄清单 + 手机三脚架 + 背景布 → 2h
- [ ] 10 个核心示范视频拍摄 + 剪辑（≤ 30 秒 / 个，用 CapCut 或 DaVinci 免费版）→ 6h
- [ ] 视频托管接入（Cloudflare Stream Free 或 YouTube Unlisted）+ 上传 + 获取 embed URL → 2h

**并行 spike**：
- 🔍 **SEO 种子内容规划**：基于 W1 关键词实测结果，定 5 篇 SEO 种子文标题 + Outline
- 🤝 **康复师 KOL 接触第 1 批**：LinkedIn 搜 `hand therapist certified`  + Reddit r/physicaltherapy 发 3 条访谈邀请

---

#### Week 4（20h）

**主路径**：
- [ ] 剩余 46-74 个动作视频拍摄 + 剪辑（或短期用静态图 + GIF 替代，视频后补）→ 10h
- [ ] 30 条 FAQ 编写（"还肿正常吗" / "多久能打字" / "疼到什么程度该去医院" 等）→ 4h
- [ ] RAG 知识库首批 ingest：AAOS 手部康复协议 + NHS hand therapy guide + guzhe 英文版 + 30 FAQ → 约 200-500 chunks → 4h
- [ ] 知识库存储选型落定（Cloudflare Vectorize Free / Supabase pgvector / LangChain + local FAISS）→ 2h

**并行 spike**：
- 📝 **guzhe 英文博客终稿** → 发布到 `/blog/guzhe-recovery-story`（网站尚无流量，但索引先跑）
- 🤝 **康复师 KOL 第 2 批接触**：补发 5-10 个新邀请

**Gate G2（W4 末 / M2）**：14 天课程内容完成 ≥ 80% + 知识库入库成功 + guzhe 审核通过 ≥ 80% → 过则推进 Phase 2
**G2 备选闸门**：若视频进度不足，允许用静态图+GIF 先上线，视频后补（P1 级非阻塞）

---

### Phase 2 — Product MVP（W5-W6，40 小时）

#### Week 5（20h）

**主路径**：
- [ ] 落地页终稿（文案 + hero 图 + CTA + 免责声明 + FAQ 区 + 价格锚点文案）→ 文案是重点不是技术 → 6h
- [ ] Onboarding 问卷 UI + 状态机（7-10 题分 3 步）+ 答案存 DB → **React Hook Form + Zod 多步表单** → 4h
- [ ] Stripe Checkout 集成 + Webhook 处理（付费成功解锁内容）+ 退款流程预留 → 复用 lease-guard 封装，改 `mode: 'payment'` → 3h（节省 2h）
- [ ] 问卷 → 日程变体映射逻辑（规则引擎 v1：根据问卷输出标定到 1 个变体模板 + 少量 LLM 微调）→ 3h
- [ ] 每日页 UI v1（动作卡片 + 视频 + 计时器 + 打卡按钮）→ shadcn Progress + Tabs 已复用 → 2h
- [ ] **余出的 4h 前置到下周 AI 答疑开发**

---

#### Week 6（20h）

**主路径**：
- [ ] AI 答疑聊天框 UI + 后端（Vercel AI SDK + Gemini Flash → Groq 降级 + pgvector RAG 检索 + Prompt 护栏 + 关键词 escalate）→ 复用 lease-guard `src/lib/ai/` 多 provider 降级框架（简化为 2 档） → 8h
- [ ] 危险信号关键词库 + 强制 disclaimer 自动插入 → 2h
- [ ] 每日打卡 + 进度条 + 14 天概览页 → 3h
- [ ] 第 14 天完成 PDF 报告生成（react-pdf 或 puppeteer）→ 3h
- [ ] 分享按钮（Twitter / Reddit / Copy Link / Email）→ 1h
- [ ] 内部 3 人 QA 测试（自己 + 2 个朋友走完付费 → 14 天课程 → 答疑 → 分享全流程）→ 3h
- [ ] Playwright E2E 冒烟测试：`landing → quiz → checkout → day 1 → chat → share` 主干路径（复用 lease-guard `playwright.config.ts`）→ 2h

**Gate G3（W6 末 / M3）**：端到端漏斗可用 + 内部 3 人走完全流程无 P0 bug + Stripe 能真实收到 $14.99 → 过则推进 Phase 3

---

### Phase 3 — Polish + Launch Prep（W7-W8，40 小时）

#### Week 7（20h）

**主路径**：
- [ ] SEO 种子文撰写 × 3 篇（长尾词驱动：`hand fracture cast removal exercises` / `metacarpal fracture recovery timeline` / `finger fracture physical therapy at home`）→ 每篇 1500-2500 字 → 9h
- [ ] 落地页 SEO 优化（meta / schema / sitemap / robots / Open Graph） → 2h
- [ ] Plausible / Umami 埋点（关键事件：landing_view / quiz_start / quiz_complete / checkout_start / paid / day_N_complete / share_click）→ 3h
- [ ] 产品 bug 修复 + UI 细节打磨（根据 W6 QA 反馈）→ 4h
- [ ] Sentry 接入 + 错误监控 → 2h

**并行 spike**：
- 🔍 **Reddit 账号养号**：提前 2 周在 r/fractures / r/breakmyankle / r/Orthopedics 正常发帖评论建 karma（避免首发被 spam 删）

---

#### Week 8（20h）

**主路径**：
- [ ] SEO 种子文剩余 2 篇 → 5h
- [ ] 落地页 A/B 文案准备（情绪型 vs 功效型两版）→ 2h
- [ ] 闭环测试：用 10-20 个朋友 / 小流量（Twitter 个人账号小范围发）做落地页转化测 → 3h
- [ ] ProductHunt Launch 页面准备（标题 / tagline / 描述 / 5 张截图 / gallery / first comment 预备）→ 4h
- [ ] Email nurture 序列（D1 欢迎 + D7 中期检查 + D15 完成庆贺 + referral 引导）→ 4h
- [ ] 退款流程实测 + 退款邮件模板 → 2h

**Gate G4（W8 末 / M4）**：落地页 → 付费转化 ≥ 1%（≥ 100 访客样本）+ 5 篇 SEO 种子文索引中 + ProductHunt 页面就绪 + Reddit 账号养号完成 → 过则 Soft Launch

**G4 不过的缓解**：
- 转化 < 1%：优先调落地页文案与 CTA，不急着外部流量
- SEO 未索引：检查 sitemap + Google Search Console 手动提交
- Reddit 账号被 shadow-ban：换 subreddit 或找朋友账号协助

---

### Phase 4 — Soft Launch（W9-W10，40 小时）

#### Week 9（20h）

**主路径**：
- [ ] Reddit 首发：r/fractures 发"I built a 14-day recovery coach for hand fractures"帖 + 真诚故事（guzhe 案例）+ 引用 AAOS / NHS 权威 → 2h 发帖 + 全周监控回复
- [ ] Reddit 回复与互动（每天 1-2 小时在帖子下答疑 / 建立信任） → 6h
- [ ] 付费用户实时监控 + 客服响应（每付费 1 人立即人工回欢迎邮件）→ 3h
- [ ] 首批用户 bug 反馈修复（W9 预期会有 3-5 个边缘 bug）→ 5h
- [ ] 在 r/breakmyankle（虽然不是手部）交叉引流：发"finger fracture AMA"帖 → 2h
- [ ] 自己在 Twitter / LinkedIn 发 build-in-public 产品发布贴 → 2h

---

#### Week 10（20h）

**主路径**：
- [ ] 前 10-20 用户 1v1 访谈（免费送延长内容换 15 分钟访谈）→ 5h
- [ ] 根据访谈反馈调整：落地页文案 / 问卷问题 / 第 1 天内容 / AI 答疑 prompt → 6h
- [ ] 继续 Reddit 内容互动 + 答疑 → 4h
- [ ] SEO 第 6 篇长文（基于访谈发现的新长尾词）→ 3h
- [ ] 退款数据复盘 + 退款用户访谈（最有价值的信号）→ 2h

**Gate G5（W10 末 / M5）**：付费用户 ≥ 10 + 退款率 ≤ 15% + 至少 2 位用户明确表达推荐意愿 → 过则 Scale；不过则延期进入 W11-W13 继续积累

---

### Phase 5 — Scale + PMF Assessment（W11-W13，60 小时）

#### Week 11（20h）

**主路径**：
- [ ] ProductHunt Launch 正式发布（周二 00:01 PST）→ 当天全天监控回复 → 10h（high-intensity day）
- [ ] ProductHunt 后续互动 + hunter 反馈收集 → 3h
- [ ] Twitter / LinkedIn ProductHunt 宣发 → 2h
- [ ] 新一批 SEO 内容 2 篇 → 5h

---

#### Week 12（20h）

**主路径**：
- [ ] 转化漏斗数据分析（landing / quiz / checkout / paid 各环节转化率）+ 瓶颈定位 → 4h
- [ ] 根据瓶颈做 2-3 个 A/B 实验（文案 / 价格文案 / CTA 位置 / 付费页设计）→ 6h
- [ ] 用户 5-10 人的 1v1 访谈（第二批，重点访谈已完成 14 天的用户）→ 4h
- [ ] 足踝部位 feasibility 调研（如果付费数 ≥ 50，已经可以准备 v1.1）→ 3h
- [ ] 继续 Reddit + SEO 内容更新 → 3h

---

#### Week 13（20h，缓冲 + PMF 验收）

**主路径**：
- [ ] 3 月 PMF 数据盘点：付费用户数 / 累计营收 / 14 天完成率 / referral 数 / 退款率 → 3h
- [ ] 退款用户与差评用户专项访谈 → 3h
- [ ] 生成 3 月 PMF 复盘文档（放 `D:\work\MyStartupProject1\3月PMF复盘.md`）→ 4h
- [ ] **Gate G6 判定会议（自己与自己）**：基于数据做 PMF 决策 → 2h
- [ ] 根据判定结果做下一阶段规划 → 6h
- [ ] 缓冲 2h 应对上面延期

---

## 4. 决策闸门（Gate Matrix）

| Gate | 时点 | 通过条件 | 不通过的自动回退路径 |
|---|---|---|---|
| G0 | W1 末 | 域名购买 + Vercel 404 可访问 | 延期 1 周，排查部署 |
| G1 / M1 | W2 末 | 项目骨架 + 法律文档 + 课程大纲 | 延期 1 周；若 guzhe 不认可大纲，回退 `问题定义与价值主张` |
| G2 / M2 | W4 末 | 14 天内容 ≥ 80% + 知识库入库 + guzhe 审核 | 视频不足用图替代；内容质量差则回退 `技术方案`（内容生产流程调整）|
| G3 / M3 | W6 末 | 端到端漏斗可用 + 真实付费可收 | 延期 1-2 周；若核心漏斗设计错，回退 `Product Brief` |
| G4 / M4 | W8 末 | 落地页转化 ≥ 1%（小流量）+ 内容就绪 | 优先调文案；落地页设计根本错则回退 `UX 设计` |
| G5 / M5 | W10 末 | ≥ 10 付费 + 退款率 ≤ 15% | 延期到 W11 继续；若 Reddit 首发反响极差，回退 `市场与竞品` 重新审视渠道 |
| **G6 / M6（PMF 核心）** | **W13 末** | **60+ 付费 / $900+ 营收 / 14 天完成率 ≥ 40%** | **见下方 PMF 分级决策矩阵** |

### G6 PMF 分级决策矩阵

| 付费数 | 14 天完成率 | 决策 | 下一步 |
|---|---|---|---|
| ≥ 60 | ≥ 40% | ✅ **Go 足踝扩展** | 立即启动 v1.1 足踝部位（M4-M6 路线图） |
| 30-60 | ≥ 30% | 🟡 **延期 4-8 周** | 继续优化单部位，跑完 5 月再判断，暂不扩展 |
| 30-60 | < 30% | 🟠 **回退 `路线图与 MVP`** | 14 天完成率是核心价值信号；重新设计产品或内容 |
| < 30 | 任何 | 🔴 **回退 `问题 / 需求验证`** | PMF 未达成；可能用户痛点 / 获客渠道 / 定价三者中至少一个判断错误 |

---

## 5. 并行 Spike 时间表（不阻塞主路径）

| Spike | 启动周 | 结束周 | 预算 | 交付 |
|---|---|---|---|---|
| 🔍 SEO 关键词实测 | W1 | W2 | 4h | Top 10 目标长尾词清单 + 月搜索量估计 |
| 🏷️ 商标 / 域名清查 | W1 | W2 | 5h | 终定产品名 + 注册域名 |
| 📝 guzhe 案例英文化 | W2 | W4 | 8h | `/blog/guzhe-recovery-story` 2000 字终稿发布 |
| 🤝 康复师 KOL 接触 | W3 | W6 | 6h | 争取 1-2 位 KOL 做 30 分钟访谈换素材 |

---

## 6. 资源与成本清单

### 现金成本（3 月总预算 $30 以内）

| 项 | 估计 | 必须 |
|---|---|---|
| 域名（.com） | $10-15 / 年 | ✅ 必须 |
| 其他 | $0 | 免费 Tier 足够 |

免费 Tier 使用：Vercel + Supabase / Vercel Postgres + Gemini 2.5 Flash + Cloudflare Stream + Resend (100/day) + Sentry + Plausible / Umami + GitHub

### 时间成本（260h / 13 周）

| 阶段 | 时间 | 占比 |
|---|---|---|
| Foundation (W1-2) | 40h | 15% |
| Content MVP (W3-4) | 40h | 15% |
| Product MVP (W5-6) | 40h | 15% |
| Polish + Prep (W7-8) | 40h | 15% |
| Soft Launch (W9-10) | 40h | 15% |
| Scale + PMF (W11-13) | 60h | 25% |

### 非时间非现金的稀缺资源

- **guzhe 协作时间**：每周 1-2 小时审核内容 / 对齐康复判断 / 素材提供 → 非阻塞但关键
- **美国康复师 KOL 1-2 位**：spike 目标，拿到 1 位做访谈即视为成功

---

## 7. 风险与缓解

沿用 `产品Brief.md` v1.1 的 7 项风险清单，额外补充路线图特有风险：

| 新增风险 | 等级 | 缓解 |
|---|---|---|
| 周预算 20h 被现实挤压（主业 / 家庭 / 身体）| 高 | 保留 W13 整周缓冲；每阶段预留 20% buffer |
| 视频拍摄质量不达标 | 中 | 先用图 + GIF 上线，视频后补；请 guzhe 协助拍手部动作 |
| Reddit 首发反响冷淡 | 中 | 提前 2 周养号；多 subreddit 交叉；故事先行而非产品先行 |
| Gemini Flash API 免费额度耗尽 | 低 | 每用户每日 20 条限额；超限降级到纯知识库检索；最差情况升级付费约 $5-10 / 月 |
| 美国法律 / 医疗合规投诉 | 低 | 4 处免责 + 关键词 escalate + 不做诊断承诺 |

---

## 8. 与 BMAD 下游阶段的衔接

本路线图完成后应触发：

1. **`bmad-agent-architect`**：基于 M3 Product MVP 的技术细节出 Architecture Doc（Next.js 结构 / DB schema / RAG 检索设计 / Prompt 工程 / 部署拓扑）
2. **`bmad-agent-ux-designer`**：基于 M3 的 UI 需求出 Onboarding / 每日页 / AI 答疑的 UX 设计
3. **`bmad-check-implementation-readiness`**：Brief + 路线图 + 架构 + UX 完成后检查就绪度
4. **`bmad-create-epics-and-stories`**：将 M1-M6 拆成 6 个 epic，每个 epic 下细化 stories

---

## 9. 版本控制

- v1.0（2026-04-19）：基于 `产品Brief.md v1.1` + 5 项决策锁定；13 周周级节奏 + 6 Gate + PMF 分级决策矩阵
- v1.1（2026-04-19）：基于 `产品Brief.md v1.2`；基础栈沿用 `lease-guard`；Phase 0 任务细化（复用 18 项配置资产）；预计累计节省 ~30h 开发时间（12% 总预算）；加入 Playwright E2E 冒烟测试任务

任何一个 Gate 的 "不通过自动回退路径" 被触发时，更新本文档同时更新主文档 `项目主档案.md`。
