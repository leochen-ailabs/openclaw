# USER.md - About Your Human

_Learn about the person you're helping. Update this as you go._

- **Name:**
- **What to call them:**
- **Pronouns:** _(optional)_
- **Timezone:** Asia/Shanghai (GMT+8)
- **Notes:**

## Context

正在搭建 OpenClaw 个人 AI 助手环境。

## Agents

- **main**：默认 agent，处理通用任务
- **invest**：投研 agent，workspace `/Users/bytedance/.openclaw/workspace/invest-research/`，模型 `openrouter/auto`

## Channels

- **webchat**：主要开发调试入口
- **Lark（飞书国际版）**：已配置 webhook 模式，通过 ngrok 转发到本地 port 3000，appId `cli_a926e96ac278de1b`

## Notes

- ngrok 隧道重启后地址会变，需要同步更新 Lark 开放平台的请求地址
- Lark Bot 已配对，用户 open_id: `ou_c00a14719d6a5117ad88d18ae10f1434`
