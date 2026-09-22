import { setDefaultResultOrder } from 'node:dns';
setDefaultResultOrder('ipv4first');

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import authRoute from './routes/auth';
import apiKeyRoute from './routes/api-keys';
import settingsRoute from './routes/settings';
import ChatRoute from './routes/chat';
import sessionsRoute from './routes/sessions';
import usageRoute from './routes/usage';

const app = new Hono();

app.use('*', logger());
app.use('*', cors());

app.get('/', (c) => {
  return c.text('Hik API is running 🚀');
});

app.route('/api/v1/auth', authRoute);
app.route('/api/v1/api-keys', apiKeyRoute);
app.route('/api/v1/settings', settingsRoute);
app.route('/api/v1/chat', ChatRoute);
app.route('/api/v1/sessions', sessionsRoute);
app.route('/api/v1/usage', usageRoute);

export default app;