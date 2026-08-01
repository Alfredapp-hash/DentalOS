import Fastify from 'fastify';
import { z } from 'zod';
import { prisma } from '@dentalos/database';
import { authenticate, type AuthContext } from './auth.js';

const env = z.object({
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1)
}).parse(process.env);

const app = Fastify({ logger: true });
const authContexts = new WeakMap<object, AuthContext>();

app.addHook('onRequest', async (request, reply) => {
  if (request.url === '/health' || request.url === '/api/v1') return;
  try {
    const context = await authenticate(request.headers);
    const requestedOrganization = request.headers['x-organization-id'];
    if (typeof requestedOrganization === 'string' && requestedOrganization !== context.organizationId) {
      return reply.code(403).send({ error: 'Organization does not match authenticated membership' });
    }
    authContexts.set(request, context);
  } catch (error) {
    request.log.warn(error);
    return reply.code(401).send({ error: error instanceof Error ? error.message : 'Unauthorized' });
  }
});

const auth = (request: object) => {
  const context = authContexts.get(request);
  if (!context) throw new Error('Authentication context is unavailable');
  return context;
};

app.get('/health', async (_request, reply) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', service: 'dentalos-api', database: 'connected', environment: env.NODE_ENV, timestamp: new Date().toISOString() };
  } catch (error) {
    app.log.error(error);
    return reply.code(503).send({ status: 'degraded', service: 'dentalos-api', database: 'unavailable', timestamp: new Date().toISOString() });
  }
});

app.get('/api/v1', async () => ({ name: 'DentalOS API', version: '0.3.0', strategy: 'integration-first' }));

app.get('/api/v1/me', async (request) => auth(request));

app.get('/api/v1/dashboard', async (request) => {
  const { organizationId } = auth(request);
  const [openTasks, openOpportunities, leadCount, opportunityValue, urgentTasks] = await Promise.all([
    prisma.task.count({ where: { organizationId, status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    prisma.opportunity.count({ where: { organizationId, stage: { notIn: ['COMPLETED', 'DECLINED', 'LOST'] } } }),
    prisma.lead.count({ where: { organizationId, status: { in: ['NEW', 'CONTACTED'] } } }),
    prisma.opportunity.aggregate({ where: { organizationId, stage: { notIn: ['COMPLETED', 'DECLINED', 'LOST'] } }, _sum: { value: true } }),
    prisma.task.findMany({
      where: { organizationId, status: { in: ['OPEN', 'IN_PROGRESS'] } },
      include: { patient: true, opportunity: true },
      orderBy: [{ priority: 'asc' }, { dueAt: 'asc' }],
      take: 8
    })
  ]);
  return { openTasks, openOpportunities, activeLeads: leadCount, opportunityValue: opportunityValue._sum.value ?? 0, urgentTasks };
});

app.get('/api/v1/patients', async (request) => {
  const query = z.object({ search: z.string().optional(), limit: z.coerce.number().min(1).max(100).default(25) }).parse(request.query);
  const { organizationId } = auth(request);
  return prisma.patient.findMany({
    where: {
      organizationId,
      ...(query.search ? { OR: [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } }
      ] } : {})
    },
    orderBy: { updatedAt: 'desc' },
    take: query.limit
  });
});

app.post('/api/v1/leads', async (request, reply) => {
  const { organizationId } = auth(request);
  const body = z.object({
    locationId: z.string().optional(), firstName: z.string().optional(), lastName: z.string().optional(),
    email: z.string().email().optional(), phone: z.string().optional(), source: z.string().optional(), campaign: z.string().optional()
  }).refine((value) => value.email || value.phone, 'Email or phone is required').parse(request.body);
  const lead = await prisma.lead.create({ data: { organizationId, ...body } });
  return reply.code(201).send(lead);
});

app.get('/api/v1/opportunities', async (request) => {
  const { organizationId } = auth(request);
  const query = z.object({ type: z.enum(['NEW_PATIENT','UNSCHEDULED_TREATMENT','RECALL','REACTIVATION','SCHEDULE_GAP','BALANCE','INSURANCE','REFERRAL']).optional() }).parse(request.query);
  return prisma.opportunity.findMany({ where: { organizationId, ...(query.type ? { type: query.type } : {}) }, include: { patient: true, tasks: true }, orderBy: [{ dueAt: 'asc' }, { value: 'desc' }], take: 100 });
});

app.post('/api/v1/tasks', async (request, reply) => {
  const { organizationId } = auth(request);
  const body = z.object({ title: z.string().min(1), description: z.string().optional(), patientId: z.string().optional(), opportunityId: z.string().optional(), assigneeId: z.string().optional(), priority: z.number().int().min(1).max(5).default(3), dueAt: z.coerce.date().optional() }).parse(request.body);
  const task = await prisma.task.create({ data: { organizationId, ...body } });
  return reply.code(201).send(task);
});

app.addHook('onClose', async () => prisma.$disconnect());

try {
  await app.listen({ port: env.PORT, host: env.HOST });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
