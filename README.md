# DentalOS

Azure-first dental CRM and practice growth platform.

DentalOS is an integration-first SaaS platform for patient relationship management, lead conversion, treatment follow-up, recall, scheduling recovery, communications, analytics, and accountable staff workflows. Existing dental practice-management software remains the clinical system of record during the initial product stages.

## Local development

```bash
cp .env.example .env
docker compose up -d
pnpm install
pnpm --filter @dentalos/database generate
pnpm --filter @dentalos/database migrate:dev
pnpm --filter @dentalos/database seed
pnpm dev
```

The seed command prints the demo organization ID. Copy that value into `DEMO_ORGANIZATION_ID` in `.env` and keep `AUTH_DISABLED=true` only for local development.

- Web application: `http://localhost:3000`
- API: `http://localhost:3001`
- Health check: `http://localhost:3001/health`

## Production authentication

Production disables header-only development authentication. Configure `ENTRA_ISSUER` and `ENTRA_AUDIENCE`; the API verifies bearer tokens against Microsoft Entra signing keys and derives organization membership from token claims.

## Current product slice

- Multi-tenant dental CRM data model
- New-patient lead intake
- Patient search
- Revenue opportunity queues
- Staff task accountability
- Command-center dashboard
- Dental PMS provider boundary
- Azure infrastructure foundation
