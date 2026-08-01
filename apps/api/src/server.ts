import Fastify from 'fastify';
import { z } from 'zod';

const env = z.object({
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development')
}).parse(process.env);

const app = Fastify({ logger: true });

app.get('/health', async () => ({
  status: 'ok',
  service: 'dentalos-api',
  environment: env.NODE_ENV,
  timestamp: new Date().toISOString()
}));

app.get('/api/v1', async () => ({
  name: 'DentalOS API',
  version: '0.1.0',
  strategy: 'integration-first'
}));

try {
  await app.listen({ port: env.PORT, host: env.HOST });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
