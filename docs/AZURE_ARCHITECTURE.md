# DentalOS Azure Architecture

## Deployment model

DentalOS starts as a modular monolith with independently deployable web and API containers. This preserves development speed while keeping high-risk boundaries—integrations, messaging, audit events, and AI processing—separable.

## Azure services

- Azure Container Apps: web, API, integration workers, and scheduled jobs.
- Azure Database for PostgreSQL: transactional system of record for CRM and workflow data.
- Azure Cache for Redis: caching, rate limiting, short-lived coordination, and queues where appropriate.
- Azure Blob Storage: documents, exports, call recordings, and attachments.
- Azure Service Bus: reliable integration events and asynchronous workflows.
- Azure Functions: narrow event handlers and scheduled tasks when Container Apps Jobs are not a better fit.
- Microsoft Entra External ID: staff and customer identity.
- Azure Key Vault: secrets and certificates.
- Application Insights and Log Analytics: traces, metrics, logs, and alerting.
- Azure Front Door and WAF: global ingress, TLS, rate controls, and web application protection.
- Azure OpenAI: approved administrative assistance only; no autonomous diagnosis or treatment recommendations.

## Security posture

- Managed identities instead of embedded cloud credentials.
- Tenant-aware authorization on every business query.
- Encryption in transit and at rest.
- Immutable audit events for sensitive actions.
- Private networking and private endpoints for production data services.
- Minimum-necessary access for PHI.
- Human approval for sensitive communications and financial operations.

## Initial application boundaries

- `apps/web`: staff-facing Next.js application.
- `apps/api`: Fastify API and orchestration boundary.
- `packages/providers`: cloud-neutral interfaces for storage, messaging, events, secrets, observability, and AI.
- `infra`: Azure Bicep infrastructure.

## Planned domain modules

- identity and tenancy
- patients and households
- leads and attribution
- opportunities and treatment follow-up
- conversations and communication consent
- appointments, recall, and schedule recovery
- tasks and workflow automation
- reporting and operational metrics
- PMS integrations, beginning with Open Dental

## Data boundary

During the initial product stages, the connected dental practice-management platform remains the clinical system of record. DentalOS stores normalized operational and CRM data, source provenance, synchronization state, and auditable workflow outcomes.
