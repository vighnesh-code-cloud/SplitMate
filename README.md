# SplitMate — Expense Splitting & AI Assistant

SplitMate is a modern full-stack expense-splitting web application with an integrated AI Assistant powered by **Gemma 3 4B through Ollama**. It enables friends, flatmates, and travel groups to track expenses, compute exact mathematical splits down to the paise, calculate simplified debts ("who owes whom"), and query their finances in natural language.

---

## Architecture Overview

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4 + Lucide Icons.
- **Backend**: Node.js + Express (`server.ts`) running Vite as an integrated development middleware.
- **Single-Server Design**: Both the frontend SPA and the backend API (`/api/*`) are served on a single unified port (default: `3000`). There are no port conflicts, separate processes, or cross-origin issues during local development.
- **AI Engine**: Local Gemma 3 4B model running via Ollama (`http://127.0.0.1:11434`). No Gemini API key required.

---

## Quick Start in VS Code

Follow these steps after cloning the repository to run SplitMate locally:

### 1. Clone & Open in VS Code

```bash
git clone https://github.com/<your-username>/splitmate.git
cd splitmate
code .
```

### 2. Configure Environment Variables

Copy `.env.example` to create your local `.env`:

```bash
cp .env.example .env
```

*(Note: `.env` is pre-configured with local defaults `PORT=3000` and `OLLAMA_BASE_URL=http://127.0.0.1:11434`. Supabase values are optional for local demo mode).*

### 3. Install Dependencies

In the VS Code terminal (`Ctrl+\`` or `Cmd+\``):

```bash
npm install
```

### 4. Start the Development Server

Run the single unified development command:

```bash
npm run dev
```

---

## Local URLs Displayed in VS Code

Once the development server starts, it prints a clickable banner in your VS Code terminal with the exact local URLs:

| Service | Local URL | Description |
| :--- | :--- | :--- |
| **Frontend (Web App)** | **`http://localhost:3000`** | Main SplitMate web interface (Ctrl/Cmd + click in terminal) |
| **Backend API Base** | **`http://localhost:3000/api`** | Express API endpoints |
| **Server Health Check** | **`http://localhost:3000/api/health`** | Server heartbeat and status verification |
| **AI Assistant Status** | **`http://localhost:3000/api/assistant/status`** | Live status of Ollama & Gemma 3 4B |

### Automatic Port Fallback

If port `3000` is already occupied by another application on your system:
- The server will detect the `EADDRINUSE` conflict.
- It will automatically bind to the next available port (e.g. `3001`, `3002`).
- It will display the actual assigned URL (e.g. `http://localhost:3001`) in the terminal.

You can also force a specific port using:
```bash
PORT=8080 npm run dev
```

---

## Running the Gemma 3 4B AI Assistant (Optional)

SplitMate features an integrated conversational assistant that allows you to query your spending, ask "Who owes whom?", and get complete group breakdowns.

### Prerequisites for AI Assistant:
1. Install Ollama from [ollama.com](https://ollama.com).
2. Start Ollama and download the Gemma 3 4B model:

```bash
ollama run gemma3:4b
```

### How SplitMate Handles AI Gracefully:
- **Local & Private**: Ollama operates locally at `http://127.0.0.1:11434` and is never exposed to the public internet.
- **No Gemini API Key**: Does not call Gemini or require external AI API keys.
- **Graceful Offline Handling**: If Ollama is not running, SplitMate's core functionality (adding expenses, groups, friends, settlements, ledger arithmetic) remains 100% operational. The AI chat interface clearly displays the offline status with actionable instructions, never faking responses.

---

## Available NPM Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts the unified Vite + Express development server on `http://localhost:3000` |
| `npm run build` | Compiles the production build into the `dist/` folder |
| `npm start` | Runs the production Express server |
| `npm run lint` | Runs TypeScript type checking (`tsc --noEmit`) |
| `npm run clean` | Removes build artifacts (`dist/`) |

---

## Troubleshooting

- **Port in use**: If another process uses port 3000, SplitMate automatically selects the next available port (e.g. 3001) and displays it in the terminal.
- **Ollama Connection**: If the assistant shows "Ollama Offline", run `ollama run gemma3:4b` in a separate terminal and click "Re-check Connection" in the UI.
- **Authentication**: For Google Sign-In with Supabase, add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env`. Local demo mode functions without Supabase configured.
