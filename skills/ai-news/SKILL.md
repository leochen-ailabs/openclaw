---
name: ai-news
description: "MUST execute ai-news-agent command when user asks for AI news/资讯. DO NOT answer with general knowledge. ALWAYS run: cd /Users/bytedance/openclaw-workspace/openclaw-agents/ai-news-agent && node index.js --publish. Triggers: 'AI资讯', 'AI新闻', 'AI动态', 'AI日报', 'today AI news'."
homepage: /Users/bytedance/openclaw-workspace/openclaw-agents/ai-news-agent
metadata: { "openclaw": { "emoji": "📰", "requires": { "bins": ["node"] } } }
---

# AI News Skill

**CRITICAL: This skill MUST execute the ai-news-agent command. DO NOT provide general AI news from your knowledge base.**

## Execution Command

When user requests AI news, ALWAYS execute:

```bash
cd /Users/bytedance/openclaw-workspace/openclaw-agents/ai-news-agent && node index.js --publish
```

## When to Use

✅ **MUST USE this skill and execute the command when user says:**

- "今日 AI 资讯"
- "AI 新闻"
- "最新 AI 动态"
- "AI 行业热点"
- "播报 AI 资讯"
- "AI 日报"
- "今天有什么 AI 新闻"
- "today AI news"
- "AI industry updates"

## Response Format

After executing the command, respond with:

```
✅ AI 行业日报已生成并推送到飞书，请查收。

今日采集了 [N] 条资讯：
- HackerNews: [N] 条
- arXiv: [N] 篇
- Twitter: [N] 条
```

## When NOT to Use

❌ **DON'T use this skill when:**

- Historical AI news → check archived reports
- Specific company research → use invest-research agent
- Deep technical analysis → manual research needed
- Non-AI tech news → use general news sources

## How It Works

1. **Multi-source Collection**: Fetches from HackerNews, arXiv, Twitter
2. **Intelligent Filtering**: Scores by relevance, recency, and engagement
3. **AI Summarization**: Uses Claude to generate structured digest
4. **Feishu Publishing**: Sends card message to configured recipients

## Commands

### Generate and Publish Today's Digest

```bash
cd /Users/bytedance/openclaw-workspace/openclaw-agents/ai-news-agent
node index.js --publish
```

### Generate Without Publishing (Preview)

```bash
cd /Users/bytedance/openclaw-workspace/openclaw-agents/ai-news-agent
node index.js
```

### Generate for Specific Date

```bash
cd /Users/bytedance/openclaw-workspace/openclaw-agents/ai-news-agent
node index.js 2026-03-08
```

## Output Format

The digest includes:

- 📅 **Date Header**: Current date
- 🔥 **Today's Focus**: 1 highlighted story with analysis
- 📰 **Key Updates**: 3-5 important news items with links
- 📊 **Data Overview**: Source statistics

## Configuration

Edit `/Users/bytedance/openclaw-workspace/openclaw-agents/ai-news-agent/config/agent.json`:

```json
{
  "feishu": {
    "accountId": "main",
    "targetChatIds": ["ou_c00a14719d6a5117ad88d18ae10f1434"]
  }
}
```

## Data Sources

- **HackerNews**: Top stories with AI keywords
- **arXiv**: Latest papers in cs.AI, cs.CL, cs.LG
- **Twitter**: Posts from @OpenAI, @AnthropicAI, @GoogleDeepMind

## Notes

- Requires `ANTHROPIC_API_KEY` or `ANTHROPIC_AUTH_TOKEN` environment variable
- Optional: `TWITTER_BEARER_TOKEN` for Twitter collection
- Results cached in `cache/` directory
- Historical digests stored in `history/YYYY-MM/DD.json`
- Automatically publishes to Feishu when `--publish` flag is used
