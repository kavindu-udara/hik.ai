# Hik AI 🤖

> **Your Unified AI Workspace.** Sync conversations across Obsidian, Web, CLI, and Desktop with a single, powerful backend.

Hik is an open-source, self-hostable AI platform designed to keep your context in sync no matter where you are working. Whether you're taking notes in Obsidian, coding in VS Code, or managing projects in the terminal, Hik ensures your AI assistant remembers everything.

## ✨ Key Features

- **🔄 Unified Context**: Start a chat in Obsidian and finish it in your Terminal. All sessions are synced via a central database.
- **🏠 Local-First & BYOK**: Use your own API keys (OpenAI, Anthropic) or point the backend to local models like LM Studio.
- **📦 Full Ecosystem**:
  - **Hik API**: A robust Hono backend with usage tracking and JWT/API-key auth.
  - **Hik Obsidian**: A polished plugin with markdown rendering, slash commands, and file context.
  - **Hik Web**: A Next.js dashboard for analytics, session management, and web-based chat.
  - **Hik CLI**: A developer-focused terminal tool for git commits, code explanation, and debugging.
- **🚀 Docker-Ready**: Deploy the entire stack locally or on a VPS with a single `docker compose up`.

## 🏗️ Architecture

```text
hik.ai/
├── hik-api/          # Hono Backend (Supabase + Drizzle ORM)
├── hik-obsidian/     # Obsidian Plugin (TypeScript)
├── hik-web/          # Next.js Dashboard (Tailwind + shadcn/ui)
└── hik-cli/          # Node/Bun CLI Tool (Commander.js)
```

## 🚀 Quick Start (Docker)

The easiest way to run Hik is using Docker. This will start both the API and the Web Dashboard.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/hik.ai.git
   cd hik.ai
   ```

2. **Configure Environment:**
   Create a `hik-api/.env.production` file with your Supabase URL and secrets:
   ```env
   DATABASE_URL=postgres://...
   JWT_SECRET=your_secret_key
   OPENAI_BASE_URL=http://host.docker.internal:1234/v1 # For LM Studio
   ```

3. **Start the services:**
   ```bash
   docker compose up --build
   ```

4. **Access the Dashboard:**
   Open [http://localhost:3001](http://localhost:3001) in your browser.

## 🛠️ Local Development

If you want to contribute or develop clients locally:

### Prerequisites
- [Bun](https://bun.sh/) (v1.0+)
- [Docker](https://www.docker.com/) (for the backend DB)

### 1. Start the Backend
```bash
cd hik-api
bun install
bun run dev
```

### 2. Start the Web Dashboard
```bash
cd hik-web
bun install
bun run dev
```

### 3. Load the Obsidian Plugin
1. Go to **Settings → Community Plugins** in Obsidian.
2. Turn off Safe Mode.
3. Click "Browse" and select the `hik-obsidian` folder.
4. Enable **Hik AI** and enter your API key in the settings.

### 4. Install the CLI
```bash
cd hik-cli
bun link
hik login hik_xxxxxxxx
```

## 📖 Documentation

Each component has its own detailed documentation:
- [API Documentation](./hik-api/README.md)
- [Obsidian Plugin Guide](./hik-obsidian/README.md)
- [CLI Reference](./hik-cli/README.md)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
