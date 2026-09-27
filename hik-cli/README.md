# Hik CLI 

> Your unified AI workspace, right in your terminal.

**Hik CLI** brings the power of your unified AI backend to your command line. Chat with local or cloud models, generate conventional commit messages, explain complex code, and debug errors—all without leaving your shell.

## ✨ Features
- **💬 Interactive Chat**: Have persistent, multi-turn conversations with context retention.
- **⚡ Git Integration**: Generate semantic commit messages from your staged changes (`hik commit`).
- **🔍 Code Analysis**: Explain any file or snippet instantly (`hik explain`).
- **🛠️ Debugging**: Paste error logs or code to get instant fixes (`hik fix`).
- **🔄 Unified Context**: Sessions sync across Obsidian, Web, and CLI via your Hik backend.
- **🏠 Local-First**: Works seamlessly with LM Studio or any OpenAI-compatible endpoint.

## 🚀 Installation

Install globally using npm or Bun:

```bash
npm install -g @udara-kavindu/hik-cli
# or
bun add -g @udara-kavindu/hik-cli
```

## ⚙️ Configuration

Before using Hik, you need to link it to your Hik backend.

### 1. Login
Generate an API key from your Hik Dashboard and save it locally:
```bash
hik login hik_xxxxxxxxxxxxxxxx
```

### 2. Set Backend URL (Optional)
By default, Hik points to `http://localhost:3000`. To change it:
```bash
hik config --url https://api.your-hik-instance.com
```

## 📖 Usage

### Interactive Mode
Start a persistent chat session where Hik remembers your conversation history:
```bash
hik interactive
# or use the alias
hik i
```
*Type `/exit` to quit.*

### One-off Chat
Send a single message and get a response:
```bash
hik chat "Write a Python script to sort a list"
```

### Git Commit Generator
Analyze your staged changes and generate a Conventional Commit message:
```bash
git add .
hik commit
# Use -y to automatically commit
hik commit -y
```

### Code Explainer
Get a breakdown of what a specific file does:
```bash
hik explain src/main.ts
```

### Bug Fixer
Find solutions for error logs or buggy code:
```bash
hik fix error.log
# Or pipe input directly
cat crash.log | hik fix
```

## 🛠️ Commands Reference

| Command | Description |
| :--- | :--- |
| `hik login <key>` | Save your Hik API key locally. |
| `hik chat <msg>` | Send a one-time message to the AI. |
| `hik interactive` | Start a multi-turn chat session. |
| `hik commit` | Generate a commit message from staged git changes. |
| `hik explain <file>` | Explain the contents of a code file. |
| `hik fix <file>` | Analyze an error log or code snippet for fixes. |
| `hik config` | Manage backend URL and other settings. |

## 🏗️ Development

If you want to contribute or run Hik CLI locally:

```bash
git clone https://github.com/your-username/hik.ai.git
cd hik.ai/hik-cli
bun install
bun run dev
```

## 📄 License

MIT © Kavindu Udara
