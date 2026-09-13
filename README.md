# hik.ai
seamlessly sync sessions, context, and files across all of them

## First 4 Coding Milestones
Here is your step-by-step checklist to get the backend running:
- [ ] Step 1: Scaffold the Monorepo & Database
    - Initialize a Turborepo.
    - Set up the packages/db with Drizzle ORM and Postgres.
    - Define your core tables: users, api_keys, sessions (chats), messages, and usage_logs.

- [ ] Step 2: Build Auth & API Key Generation
    - Create endpoints for user registration/login (you can use a service like Clerk or Lucia Auth to save time, or just simple JWTs).
    - Create an endpoint to generate a client_api_key. This key will be used in the Authorization: Bearer hik_xxx header for the Obsidian/CLI apps.

- [ ] Step 3: Build the LLM Proxy (The most important part)
    - Create a POST /api/v1/chat/completions endpoint (mimicking the OpenAI API format makes it easy for clients to use).
    - Write the logic to route the request:
    - If user is on Free/BYOK: Use the API key they saved in their profile.
    - If user is on Full Plan: Use Hik's master API key.
    - Implement Streaming. Use the native fetch API or an SDK (like @ai-sdk/openai by Vercel, which is amazing for streaming) to pipe the LLM response back to the client in real-time.

- [ ] Step 4: Save to Database & Track Usage
    - While the stream is finishing, save the final full prompt and response to the messages table.
    - Extract the usage: { prompt_tokens, completion_tokens } from the LLM response and insert it into the usage_logs table.
