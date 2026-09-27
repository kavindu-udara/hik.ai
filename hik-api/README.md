# Hik API 🚀

The central backend for the Hik ecosystem. Built with **Hono**, **Bun**, and **Supabase**.

## Features

- **Multi-tenant Auth**: Supports both JWT (for Web) and API Keys (for Obsidian/CLI).
- **Streaming Support**: Real-time SSE streaming for LLM responses.
- **Usage Tracking**: Persists token usage and costs to Supabase.
- **BYOK Routing**: Automatically routes requests based on user-provided keys.

## Setup

1. **Install Dependencies**:

   ```bash
   bun install
   ```

2. **Environment Variables**:
   Create a `.env` file:

   ```env
   DATABASE_URL=your_supabase_url
   JWT_SECRET=your_secret
   OPENAI_BASE_URL=http://localhost:1234/v1 # For LM Studio
   ```

3. **Run Locally**:
   ```bash
   bun run dev
   ```

## API Endpoints

- `POST /api/v1/chat`: Stream a chat response.
- `GET /api/v1/sessions`: List user sessions (API Key auth).
- `POST /api/v1/auth/register`: Register a new user.
