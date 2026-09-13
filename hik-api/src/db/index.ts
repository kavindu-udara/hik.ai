import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import ChatRoute from "../routes/chat";

const app = new Hono();

// middleware
app.use('*', logger());
app.use('*', cors());

// Health check
app.get('/', (c) => {
    return c.text('Hik API is running!');
});

// Mount routes
app.route('/api/v1/chat', ChatRoute);

export default app;
