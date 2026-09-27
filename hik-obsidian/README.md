# Hik Obsidian Plugin 📝

Bring unified AI context directly into your notes.

## Features

- **Context Chips**: Attach notes without cluttering the prompt.
- **Slash Commands**: `/summarize`, `/explain`, `/fix`.
- **Native Markdown**: Beautiful rendering with syntax highlighting.
- **Session Sync**: Chats appear in your Web Dashboard instantly.

## Installation

1. **Clone the Repo**:

    ```bash
    git clone https://github.com/your-username/hik.ai.git
    ```

2. **Build the Plugin**:

    ```bash
    cd hik-obsidian
    bun install
    bun run build
    ```

3. **Load in Obsidian**:
    - Go to **Settings → Community Plugins**.
    - Turn off **Safe Mode**.
    - Click the folder icon and select the `hik-obsidian` folder.
    - Enable **Hik AI**.

4. **Configure**:
    - Enter your `hik_` API key and Backend URL in the plugin settings.
