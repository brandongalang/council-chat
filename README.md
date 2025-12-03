# Council Chat

A mixture of models chat that actually works. Multiple AI models respond to your query in parallel, then a synthesizer extracts what matters into a final response none of them would have produced alone.

![Council Chat UI](./public/council-ui-preview.png)

## Why This Exists

Every model has blindspots. Claude gets nuance but sometimes misses the practical angle. GPT-thinking goes deep but outputs are dense. Sonnet is balanced but occasionally generic.

Instead of picking one and living with the tradeoff, use all of them at once and let an intelligent synthesizer do the work.

## How It Works

1. **Configure your council** - Pick any models available on OpenRouter (up to 5 council members)
2. **Council responds in parallel** - All models answer your query simultaneously
3. **Synthesizer analyzes** - A judge model does comparative analysis: structure vs clarity, depth vs practicality, reasoning vs conciseness
4. **Final response** - Composed from the best elements of each council member

For writing and brainstorming, this produces noticeably better outputs than a single frontier model. More balanced, less exaggerated in any single direction, more grounded.

## Quick Start

```bash
git clone https://github.com/brandongalang/council-chat.git
cd council-chat
npm install
npm run db:push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), go to **Settings**, enter your OpenRouter API key, and start chatting.

## Requirements

- Node.js 18+
- [OpenRouter API Key](https://openrouter.ai/keys)

## Features

- **Configurable council** - Choose any models from OpenRouter's catalog
- **Custom personas** - Assign roles to council members (skeptic, advocate, technical expert, etc.)
- **Parallel streaming** - See what each model thinks as responses stream in
- **Configurable synthesis** - Pick your judge model and customize the synthesis prompt
- **Session management** - Only final responses stay in chat history
- **Analytics** - Track token usage and costs across models
- **Fully local** - SQLite database, no external services, your data stays on your machine

## Architecture Decisions

**Parallel, not serial.** All models respond simultaneously. You wait for the slowest model once, not each model sequentially.

**No ranking layer.** Direct synthesis is cleaner than having models vote on each other. The noise from weaker models ranking doesn't justify the token cost.

**OpenRouter only.** Single API, single key, access to hundreds of models. Tradeoff: locked to OpenRouter's availability and pricing.

**Streaming everything.** Council responses stream as they arrive. Once all complete, synthesizer streams the final output.

## When to Use This

**Good for:** Writing, brainstorming, complex product thinking, exploratory work where you want multiple valid angles.

**Overkill for:** Simple factual queries, time-critical work. Latency and cost don't justify it.

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS, Shadcn UI
- Vercel AI SDK with OpenRouter provider
- SQLite via Drizzle ORM

## License

MIT
