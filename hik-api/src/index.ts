import { setDefaultResultOrder } from 'node:dns';
setDefaultResultOrder('ipv4first');

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

const app = new Hono();

app.use('*', logger());
app.use('*', cors());

app.get('/', (c) => {
  return c.text('Hik API is running 🚀');
});

export default app;