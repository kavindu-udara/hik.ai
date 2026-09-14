import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const rawUrl = process.env.DATABASE_URL;

if (!rawUrl) {
  throw new Error("CRITICAL: DATABASE_URL is missing from .env file!");
}

const client = postgres(rawUrl, {
  max: 1,
  ssl: 'require',
});

console.log(`Database client initialized for pooler: ${new URL(rawUrl).hostname}`);

export const db = drizzle(client, { schema });