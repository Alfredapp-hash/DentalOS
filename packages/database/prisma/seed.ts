import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const organization = await prisma.organization.upsert({
    where: { slug: 'demo-dental' },
    update: {},
    create: { name: 'Demo Dental Group', slug: 'demo-dental' }
  });

  const location = await prisma.location.upsert({
    where: { organizationId_name: { organizationId: organization.id, name: 'Temecula Office' } },
    update: {},
    create: { organizationId: organization.id, name: 'Temecula Office' }
  });

  const owner = await prisma.user.upsert({
    where: { externalAuthId: 'dev-owner' },
    update: {},
    create: {
      organizationId: organization.id,
      externalAuthId: 'dev-owner',
      email: 'owner@demo.dentalos.local',
      displayName: 'Demo Owner',
      role: 'OWNER'
    }
  });

  const patient = await prisma.patient.upsert({
    where: { organizationId_externalPatientId: { organizationId: organization.id, externalPatientId: 'OD-1001' } },
    update: {},
    create: {
      organizationId: organization.id,
      locationId: location.id,
      externalPatientId: 'OD-1001',
      firstName: 'Jordan',
      lastName: 'Lee',
      email: 'jordan@example.com',
      phone: '+19515550101',
      source: 'Google Ads',
      lifetimeProduction: 4200,
      lifetimeCollections: 3600
    }
  });

  const lead = await prisma.lead.create({
    data: {
      organizationId: organization.id,
      locationId: location.id,
      firstName: 'Taylor',
      lastName: 'Morgan',
      phone: '+19515550102',
      source: 'Website',
      campaign: 'Emergency Dentist',
      status: 'NEW'
    }
  });

  const opportunity = await prisma.opportunity.create({
    data: {
      organizationId: organization.id,
      locationId: location.id,
      patientId: patient.id,
      type: 'UNSCHEDULED_TREATMENT',
      stage: 'OPEN',
      title: 'Crown and build-up',
      value: 2450,
      probability: 65,
      ownerId: owner.id,
      nextAction: 'Discuss financing options',
      dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      sourceSystem: 'OPEN_DENTAL',
      sourceRecordId: 'TP-4421'
    }
  });

  await prisma.task.createMany({
    data: [
      {
        organizationId: organization.id,
        patientId: patient.id,
        opportunityId: opportunity.id,
        assigneeId: owner.id,
        title: 'Follow up on crown treatment',
        priority: 1,
        financialValue: 2450,
        dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      },
      {
        organizationId: organization.id,
        assigneeId: owner.id,
        title: `Call new website lead ${lead.firstName ?? ''} ${lead.lastName ?? ''}`.trim(),
        priority: 1,
        financialValue: 750,
        dueAt: new Date(Date.now() + 30 * 60 * 1000)
      }
    ]
  });

  console.log(JSON.stringify({ organizationId: organization.id, locationId: location.id }, null, 2));
}

main().finally(async () => prisma.$disconnect());
