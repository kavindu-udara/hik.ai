### Option 1: **Obsidian Plugin** (Recommended 🏆)
This is your biggest differentiator. We'll build a plugin that:
- Authenticates with your `hik_` API key
- Adds a sidebar chat panel
- Can read your active note and send it as context
- Syncs chat history back to your vault or the cloud
- Demonstrates the "unified context" vision immediately

**Tech Stack:** TypeScript, Obsidian API, React (optional for UI)

### Option 2: **Web Dashboard** (Next.js)
A modern web interface where users can:
- View all their chat sessions (synced from DB)
- Manage their BYOK API keys in a settings page
- See beautiful usage metrics charts (tokens spent, cost estimation)
- Chat directly from the browser

**Tech Stack:** Next.js, React, Tailwind CSS, shadcn/ui

### Option 3: **CLI Tool** (`hik-cli`)
A developer-focused terminal chat interface:
- Authenticate via `hik_` key
- Commands like `hik chat "explain this code"`
- `hik commit` (reads git diff, generates commit message)
- Beautiful streaming output in the terminal

**Tech Stack:** TypeScript, Commander.js or Clack, Ink (optional for React-based TUI)

### Option 4: **Desktop App** (Tauri)
A native desktop app with:
- System tray integration
- Global hotkey to summon the AI
- Local file access for context
- Offline-first architecture

**Tech Stack:** Tauri (Rust backend + TypeScript/React frontend)
