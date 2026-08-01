import Fastify from 'fastify';
import { z } from 'zod';
import { prisma } from '@dentalos/database';

const env = z.object({
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1)
}).parse(process.env);

const app = Fastify({ logger: true });

app.addHook('onRequest', async (request, reply) => {
  if (request.url === '/health' || request.url === '/api/v1') return;
  const organizationId = request.headers['x-organization-id'];
  if (typeof organizationId !== 'string' || !organizationId) {
    return reply.code(400).send({ error: 'x-organization-id header is required' });
  }
});

const tenantId = (headers: Record<string, unknown>) => String(headers['x-organization-id']);

app.get('/health', async (_request, reply) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', service: 'dentalos-api', database: 'connected', environment: env.NODE_ENV, timestamp: new Date().toISOString() };
  } catch (error) {
    app.log.error(error);
    return reply.code(503).send({ status: 'degraded', service: 'dentalos-api', database: 'unavailable', timestamp: new Date().toISOString() });
  }
});

app.get('/api/v1', async () => ({ name: 'DentalOS API', version: '0.2.0', strategy: 'integration-first' }));

app.get('/api/v1/dashboard', async (request) => {
  const organizationId = tenantId(request.headers);
  const [openTasks, openOpportunities, leadCount, opportunityValue] = await Promise.all([
    prisma.task.count({ where: { organizationId, status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    prisma.opportunity.count({ where: { organizationId, stage: { notIn: ['COMPLETED', 'DECLINED', 'LOST'] } } }),
    prisma.lead.count({ where: { organizationId, status: { in: ['NEW', 'CONTACTED'] } } }),
    prisma.opportunity.aggregate({ where: { organizationId, stage: { notIn: ['COMPLETED', 'DECLINED', 'LOST'] } }, _sum: { value: true } })
  ]);
  return { openTasks, openOpportunities, activeLeads: leadCount, opportunityValue: opportunityValue._sum.value ?? 0 };
});

app.get('/api/v1/patients', async (request) => {
  const query = z.object({ search: z.string().optional(), limit: z.coerce.number().min(1).max(100).default(25) }).parse(request.query);
  const organizationId = tenantId(request.headers);
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
  const organizationId = tenantId(request.headers);
  const body = z.object({
    locationId: z.string().optional(), firstName: z.string().optional(), lastName: z.string().optional(),
    email: z.string().email().optional(), phone: z.string().optional(), source: z.string().optional(), campaign: z.string().optional()
  }).refine((value) => value.email || value.phone, 'Email or phone is required').parse(request.body);
  const lead = await prisma.lead.create({ data: { organizationId, ...body } });
  return reply.code(201).send(lead);
});

app.get('/api/v1/opportunities', async (request) => {
  const organizationId = tenantId(request.headers);
  const query = z.object({ type: z.enum(['NEW_PATIENT','UNSCHEDULED_TREATMENT','RECALL','REACTIVATION','SCHEDULE_GAP','BALANCE','INSURANCE','REFERRAL']).optional() }).parse(request.query);
  return prisma.opportunity.findMany({ where: { organizationId, ...(query.type ? { type: query.type } : {}) }, include: { patient: true, tasks: true }, orderBy: [{ dueAt: 'asc' }, { value: 'desc' }], take: 100 });
});

app.post('/api/v1/tasks', async (request, reply) => {
  const organizationId = tenantId(request.headers);
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
