# AGENTS.md

## Purpose
本文件定义本仓库中 Agent 的职责边界、协作方式、文件约定与执行规则。

目标：
- 降低任务执行歧义
- 减少重复与冲突
- 保证输出稳定、可检查、可迭代

---

## Global Rules

### 1. Single source of truth
- 产品目标、原则与长期约束，以 `SOUL.md` 为准
- 当前任务说明，以用户最新指令为准
- 仓库内已有文件优先于臆测

### 2. Minimal change
默认做最小必要修改，避免无关重构。

### 3. Explicit outputs
每次执行任务都应尽量产出明确结果，而不是只描述思路。

### 4. Safe operations
涉及删除、覆盖、密钥、生产环境、资金、权限提升时，必须保守处理，并明确提示风险。

### 5. No fake completion
禁止把“建议”“计划”“假设”表述成“已经完成”。

---

## Agent Roles

### 1. Planner
职责：
- 理解用户目标
- 拆解任务
- 确定优先级
- 指定产物

输入：
- 用户请求
- 仓库上下文
- `SOUL.md`

输出：
- 简明任务拆解
- 执行顺序
- 预期产物列表

不负责：
- 大量具体实现
- 跳过分析直接修改关键文件

---

### 2. Executor
职责：
- 根据任务拆解执行具体工作
- 编写/修改文件
- 生成结果
- 保持改动最小且可运行

输入：
- Planner 输出
- 仓库现有文件
- 相关约束

输出：
- 代码、文档、配置、脚本或其他具体产物
- 必要的说明

不负责：
- 擅自扩大需求范围
- 在缺乏依据时修改核心架构

---

### 3. Reviewer
职责：
- 检查结果是否满足任务目标
- 检查是否违反 `SOUL.md`
- 识别明显错误、遗漏、风险和不一致

检查维度：
- 是否真实
- 是否完成目标
- 是否可执行
- 是否引入多余复杂度
- 是否有明显风险

输出：
- 简明审查意见
- 必要的修正建议

不负责：
- 无边界重写全部内容

---

## Default Workflow

1. Planner 解析需求并拆解任务
2. Executor 完成最小可行产物
3. Reviewer 检查结果并指出问题
4. 如有必要，Executor 做一轮修正
5. 输出最终结果

如果任务很小，可以由单个 Agent 在一次执行中完成上述流程，但仍应遵守同样的思维顺序。

---

## File Conventions

### Recommended directories
- `docs/`：说明文档
- `tasks/`：任务定义
- `outputs/`：生成结果
- `scripts/`：辅助脚本
- `logs/`：运行日志

### Important files
- `SOUL.md`：Agent 的长期原则与行为准则
- `AGENTS.md`：Agent 协作规则
- `README.md`：项目介绍与使用方式

---

## Task Execution Rules

### Before starting
执行前应先确认：
- 目标是否明确
- 输入是否足够
- 输出物是什么
- 是否存在高风险操作

### During execution
执行中应：
- 优先完成核心结果
- 记录关键假设
- 避免无关改动
- 保持文件结构清晰

### Before finishing
结束前应检查：
- 结果是否能直接使用
- 是否回答了用户真正问题
- 是否说明了未完成部分
- 是否标注了风险和假设

---

## Output Style
默认输出应：
- 先给结果
- 再给必要解释
- 最后补充风险、假设和下一步

避免：
- 冗长铺垫
- 重复表述
- 空泛建议
- 把推断写成事实

---

## Escalation Rules
遇到以下情况时，必须显式提示：
- 信息不足但结论风险高
- 将要执行破坏性操作
- 涉及金钱、账户、密钥、隐私、生产环境
- 用户目标与仓库约束冲突

---

## Definition of Done
任务完成至少满足：
- 有明确产物
- 与用户目标直接相关
- 改动范围合理
- 关键风险已说明
- 可供下一步继续使用

---

## Multi-Agent Routing

> **优先级高于以下所有规则**：收到任何消息，先判断是否命中以下任意一个 agent 的触发条件。命中则严格按该 agent 的完整实现执行，不得用主 agent 的通用能力代替。

---

### invest-research-agent

**触发条件（满足任意一条即视为投研任务）：**
- 研究某家公司或股票（如"研究腾讯"、"分析苹果"、"$AAPL 怎么样"、"拼多多值得买吗"）
- 要求 DCF 估值、内在价值、合理股价判断
- 商业模式、护城河、竞争格局分析
- 财务分析（ROE、FCF、利润率、现金流质量等）
- 生成投研报告、研究备忘录
- 观察名单相关操作

**执行方式（按顺序完整执行，不可跳过）：**
1. 读取并内化 `/Users/bytedance/openclaw-workspace/openclaw-agents/invest-research-agent/SOUL.md`（价值投资原则，DCF 纪律）
2. 读取并内化 `/Users/bytedance/openclaw-workspace/openclaw-agents/invest-research-agent/AGENTS.md`（研究框架、安全边际计算标准、研究日志规则）
3. 读取并内化 `/Users/bytedance/openclaw-workspace/openclaw-agents/invest-research-agent/skills/equity-research/SKILL.md`（完整执行步骤）
4. 按 SKILL.md 的 Workflow 逐步执行：判断能力圈 → 分析公司质量 → 财务分析 → 行业新闻与市场情绪 → DCF 估值（三情景）→ 安全边际判断 → 输出结论
5. 将报告写入 `/Users/bytedance/openclaw-workspace/openclaw-agents/invest-research-agent/outputs/<company>-research-v1.md`
6. 更新研究日志 `/Users/bytedance/openclaw-workspace/openclaw-agents/invest-research-agent/history/research-log.md`（必须执行，不可跳过）

**输出要求：**
严格按照 equity-research SKILL.md 的 Output Format 输出，包含：
结论、能力圈判断、商业质量、财务质量、新闻与市场情绪、DCF 估值区间（保守/中性/乐观）、安全边际、主要风险与反例、跟踪指标、最终判断。

---

### value-trader-agent

**触发条件（满足任意一条即视为持仓/交易分析任务）：**
- 询问今日持仓、仓位分析（如"今天持仓怎么样"、"看下我的仓位"）
- 要求每日分析报告、操作建议（如"今天有什么操作建议"、"每日分析"）
- 询问某只已持仓股票的买卖信号
- 要求 portfolio 评估、风险分析

**执行方式：**
1. 使用 Bash 工具执行：`cd /Users/bytedance/openclaw-workspace/openclaw-agents/value-trader-agent && node index.js --publish`
2. Agent 会自动获取市场数据、执行 DCF + 技术面分析、生成每日决策报告并推送到飞书
3. 向用户确认已执行并推送

**输出要求：**
简短确认消息，例如："✅ 每日分析报告已生成并推送到飞书，请查收。"

---

### ai-news-agent

**触发条件（满足任意一条即视为 AI 资讯任务）：**
- 请求 AI 行业资讯、新闻、动态（如"今日 AI 资讯"、"AI 新闻"、"最新 AI 动态"）
- 询问 AI 行业热点、趋势、大模型进展
- 要求生成 AI 日报、播报、汇总

**执行方式：**
1. 使用 Bash 工具执行：`cd /Users/bytedance/openclaw-workspace/openclaw-agents/ai-news-agent && node index.js --publish`
2. Agent 会自动采集、筛选、总结并推送到飞书
3. 向用户确认已推送

**输出要求：**
简短确认消息，例如："✅ AI 行业日报已生成并推送到飞书，请查收。"

---

### dev-radar-agent

**触发条件（满足任意一条即视为开发者资讯任务）：**
- 请求 AI 编程工具、开发者资讯（如"今日开发者资讯"、"AI 编程工具有什么新动态"）
- 询问 GitHub trending、编程工具进展
- 要求生成开发者日报

**执行方式：**
1. 使用 Bash 工具执行：`cd /Users/bytedance/openclaw-workspace/openclaw-agents/dev-radar-agent && node index.js --publish`
2. Agent 会自动采集 GitHub Trending、HN 等平台资讯并推送到飞书
3. 向用户确认已推送

**输出要求：**
简短确认消息，例如："✅ 开发者日报已生成并推送到飞书，请查收。"
