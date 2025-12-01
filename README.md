# Council Chat

A multi-AI collaborative chat interface where different AI models work together as a "Council" to deliberate on your queries, synthesized by a "Judge" model.

![Council Chat Interface](/public/screenshot.png)

## 🧠 Why Council Chat?

### The Philosophy: Diversity > Raw Power
In the current AI landscape, we often default to the "smartest" (and most expensive) model for every task. However, even state-of-the-art models have unique biases, training data gaps, and "blind spots."

**Council Chat takes a different approach:**
Instead of relying on a single oracle—even a powerful one like GPT-5 or Claude Opus 4—we convene a **Council of diverse models**. Each model brings unique strengths shaped by its training methodology:

- **DeepSeek-V3**: Excels at mathematical reasoning (97% MATH-500) and coding (91% HumanEval)
- **Qwen3-235B**: Strong multilingual capabilities and best open vision model (92% DocVQA)
- **Kimi K2**: Agentic thinking and creative problem-solving (44.9% HLE, beats GPT-5)

By synthesizing responses from multiple models with different architectures and training data, we achieve a **"Wisdom of the Crowds"** effect that often surpasses any single model's performance.

### Cost-Effectiveness Example
Let's compare API costs for a typical query (1K input, 2K output per model):

**Council Approach** (3 models + Judge synthesis):
- DeepSeek-V3 ($0.45/M): $0.00135
- Qwen3-235B ($0.25/M): $0.00075
- Kimi K2 ($0.60/$2.50/M): $0.00560
- Judge synthesis (Qwen3): $0.00200
- **Total: ~$0.0097 per query**

**Single SOTA Model** (GPT-5 at $1.25/$10/M):
- **Total: ~$0.0213 per query**

**Result**: The Council approach is **2.2x cheaper** while providing diverse perspectives from 3 specialized models instead of one generalist. You get DeepSeek's reasoning, Qwen's multilingual understanding, and Kimi's agentic thinking—all synthesized—for less than half the cost of a single frontier model.


### How It Works
1.  **The Council Deliberates**: Your prompt is sent simultaneously to multiple AI models (the "Council Members").
2.  **Diverse Perspectives**: Each model answers based on its unique training and strengths.
3.  **The Judge Synthesizes**: A separate "Judge" model reads all the responses. It doesn't just pick the best one; it **synthesizes** them. It identifies agreements, highlights unique insights, resolves contradictions, and produces a final answer that is often more comprehensive and nuanced than any single model could provide.

---

## ✨ Functionality

### 🏛️ Council Mode
- **Multi-Model Orchestration**: Query 3+ models in parallel (e.g., DeepSeek-V3, Qwen3-235B, Kimi K2).
- **Complementary Strengths**: Instead of paying for a single expensive SOTA model, leverage multiple specialized models. DeepSeek-V3's reasoning + Qwen's vision/multilingual prowess + Kimi's agentic thinking = a richer, more comprehensive answer at lower cost.
- **Judge Personas**: Configure the Judge's synthesis style (e.g., "General Purpose", "Creative Brainstorm", "Technical Deep Dive").
- **Transparent Deliberation**: View the raw responses from every council member alongside the final synthesis.

### 👤 Solo Mode
- **Standard Chat**: Switch instantly to a traditional 1-on-1 chat with any single model.
- **Model Switching**: Change models mid-conversation to test different responses.

### ⚙️ Advanced Configuration
- **Model Selector**: Choose from a vast library of models via OpenRouter (OpenAI, Anthropic, Google, Meta, Mistral, etc.).
- **Presets**: Save your favorite Council configurations (e.g., "Coding Team", "Creative Writing Group") for one-click access.
- **Custom System Prompts**: Give specific personas or instructions to individual council members.

### 📊 Analytics & History
- **Cost Tracking**: Real-time tracking of token usage and estimated cost per message.
- **Chat History**: All conversations are saved locally to your SQLite database.
- **Resume Anytime**: Pick up past debates exactly where you left off.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: TypeScript / React 19
- **Database**: SQLite with [Drizzle ORM](https://orm.drizzle.team/)
- **AI Integration**: [Vercel AI SDK](https://sdk.vercel.ai/docs) & [OpenRouter](https://openrouter.ai/)
- **Styling**: Tailwind CSS & Radix UI

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+**: Required to run the Next.js application.
- **OpenRouter API Key**: This app uses [OpenRouter](https://openrouter.ai/) to access a wide variety of LLMs through a unified API.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/council-chat.git
   cd council-chat
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Copy the example file and add your API key:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local`:
   ```env
   OPENROUTER_API_KEY=sk-or-v1-...
   ```

4. **Initialize the database:**
   The app uses a local SQLite file (`sqlite.db`). It comes pre-configured, but you can ensure the schema is up to date:
   ```bash
   npm run db:push
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **Open the app:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Structure

- `/src/app`: Next.js App Router pages and API endpoints.
- `/src/components`: React components, organized by feature (Chat, Council, UI).
- `/src/db`: Drizzle ORM schema and database connection setup.
- `/src/hooks`: Custom React hooks for managing chat sessions and council state.
- `/src/lib`: Utility functions, constants, and shared logic.

## 📄 License

MIT
