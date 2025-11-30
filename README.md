# Council Chat

A multi-model AI chat application where a "Council" of diverse AI models answers your query, and a "Judge" model synthesizes the best answer.

## Overview

Council Chat implements an "Agent Council" architecture. Users can select multiple AI models (e.g., GPT-4o, Claude 3.5 Sonnet, Llama 3) to process a query in parallel. A designated Judge model then reviews all responses and provides a final, synthesized answer.

This project uses a **Bring Your Own Key (BYOK)** approach, storing API keys securely in the user's browser (LocalStorage).

## Features

- **Multi-Model Council**: Query multiple LLMs simultaneously.
- **AI Judge**: Automatic synthesis of council responses.
- **Bring Your Own Key (BYOK)**: Secure, client-side key management for various providers (OpenAI, Anthropic, Google, etc.).
- **Real-time Streaming**: Responses are streamed in real-time using the Vercel AI SDK.
- **Modern UI**: Built with Shadcn/UI and Tailwind CSS.

## Tech Stack

- **Framework**: [Next.js 14+](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Auth**: Supabase Auth
- **AI Integration**: [Vercel AI SDK](https://sdk.vercel.ai/docs)

## Prerequisites

- Node.js 18+ installed
- A Supabase project created

## Setup & Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/council-chat.git
    cd council-chat
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    pnpm install
    # or
    bun install
    ```

3.  **Environment Variables:**
    Create a `.env.local` file in the root directory and add the following:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    DATABASE_URL=your_postgres_connection_string
    ENCRYPTION_KEY=your_32_byte_secret_key
    ```
    *Note: `ENCRYPTION_KEY` is used for server-side encryption of sensitive data if needed, though most keys are stored client-side.*

4.  **Database Setup:**
    Push the schema to your Supabase database using Drizzle Kit:
    ```bash
    npx drizzle-kit push
    ```

## Usage

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Project Structure

```
src/
├── app/             # Next.js App Router pages and API routes
├── components/      # React components
│   ├── ui/          # Reusable UI components (shadcn/ui)
│   └── ...          # Feature-specific components
├── db/              # Database schema and connection configuration
├── hooks/           # Custom React hooks
├── lib/             # Utility functions and core logic
│   ├── supabase/    # Supabase client configuration
│   └── ...
└── types/           # TypeScript type definitions
```

## Contributing

1.  Create a task in `bd` (Beads) to track your work.
2.  Make changes and ensure documentation is updated.
3.  Submit a Pull Request.
