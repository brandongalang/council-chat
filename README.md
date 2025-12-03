# Council Chat

**Council Chat** is an AI-powered deliberation platform where a "Council" of diverse AI models debates a topic, and a "Judge" model synthesizes their perspectives into a final, authoritative answer.

![Council Chat UI](./public/council-ui-preview.png)

## Core Concept

Instead of relying on a single AI model, Council Chat leverages the "wisdom of the crowd" (or rather, a council of experts).
1.  **The Council**: You select a group of AI models (e.g., Claude 3.5 Sonnet, GPT-4o, Gemini 1.5 Pro), each with a specific persona or perspective (e.g., "Skeptic", "Optimist", "Technical Expert").
2.  **The Debate**: When you ask a question, all council members generate independent responses in parallel.
3.  **The Synthesis**: A "Judge" model (typically a high-reasoning model like GPT-4o or Claude 3.5 Sonnet) analyzes all council responses, identifies agreements and disagreements, and synthesizes a comprehensive final answer.

## Features

-   **Multi-Model Council**: Configure up to 5 concurrent AI models.
-   **Judge Synthesis**: Automatic synthesis of diverse viewpoints.
-   **Persona Management**: Assign custom system prompts/personas to each council member.
-   **Live Streaming**: Real-time streaming of all council responses and the final synthesis.
-   **Analytics Dashboard**: Track token usage and estimated costs per conversation and globally.
-   **Local-First**: All data (chats, settings) is stored locally in your browser or a local database (PostgreSQL via PGlite/Supabase local).
-   **OpenRouter Integration**: Access hundreds of models via OpenRouter.

## Tech Stack

-   **Framework**: Next.js 15 (App Router)
-   **Language**: TypeScript
-   **UI**: Tailwind CSS, Shadcn UI, Framer Motion
-   **AI Integration**: Vercel AI SDK, OpenRouter
-   **Database**: Drizzle ORM (PostgreSQL)
-   **State Management**: React Hooks, URL State

## Getting Started

### Prerequisites

-   Node.js 18+
-   pnpm (recommended) or npm
-   OpenRouter API Key

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/brandongalang/council-chat.git
    cd council-chat
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Environment Setup:**
    Create a `.env.local` file in the root directory:
    ```env
    OPENROUTER_API_KEY=your_api_key_here
    DATABASE_URL=postgres://postgres:postgres@localhost:5432/council_chat
    ```
    *(Note: If using a local Postgres, ensure it's running. Alternatively, the app supports PGlite for a zero-setup local database experience if configured.)*

4.  **Run Database Migrations:**
    ```bash
    pnpm db:push
    ```

5.  **Start the Development Server:**
    ```bash
    pnpm dev
    ```

6.  **Open the App:**
    Navigate to `http://localhost:3000` in your browser.

## Usage

1.  **Configure Council**: Click the settings icon to select models for your council.
2.  **Set Personas**: Assign roles (e.g., "Devil's Advocate") to each member.
3.  **Ask a Question**: Type your prompt in the chat input.
4.  **View Deliberation**: Watch as council members respond in parallel.
5.  **Read Synthesis**: Review the Judge's final synthesized answer.
6.  **Check Analytics**: Visit the Analytics tab to see token usage and costs.

## Contributing

Contributions are welcome! Please read `CONTRIBUTING.md` (coming soon) for details on our code of conduct and the process for submitting pull requests.

## License

MIT
