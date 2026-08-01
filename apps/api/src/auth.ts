import { createRemoteJWKSet, jwtVerify } from 'jose';
import { z } from 'zod';

const authEnv = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  AUTH_DISABLED: z.coerce.boolean().default(false),
  ENTRA_ISSUER: z.string().url().optional(),
  ENTRA_AUDIENCE: z.string().optional()
}).parse(process.env);

export type AuthContext = {
  subject: string;
  email?: string;
  organizationId: string;
  roles: string[];
};

const jwks = authEnv.ENTRA_ISSUER
  ? createRemoteJWKSet(new URL(`${authEnv.ENTRA_ISSUER.replace(/\/$/, '')}/discovery/v2.0/keys`))
  : null;

export async function authenticate(headers: Record<string, unknown>): Promise<AuthContext> {
  if (authEnv.NODE_ENV !== 'production' && authEnv.AUTH_DISABLED) {
    const organizationId = String(headers['x-organization-id'] ?? '');
    if (!organizationId) throw new Error('x-organization-id header is required in development auth mode');
    return { subject: 'dev-user', email: 'developer@dentalos.local', organizationId, roles: ['OWNER'] };
  }

  if (!jwks || !authEnv.ENTRA_ISSUER || !authEnv.ENTRA_AUDIENCE) {
    throw new Error('Entra authentication is not configured');
  }

  const authorization = headers.authorization;
  if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) {
    throw new Error('Bearer token is required');
  }

  const { payload } = await jwtVerify(authorization.slice(7), jwks, {
    issuer: authEnv.ENTRA_ISSUER,
    audience: authEnv.ENTRA_AUDIENCE
  });

  const organizationId = typeof payload.extension_OrganizationId === 'string'
    ? payload.extension_OrganizationId
    : typeof payload.organizationId === 'string'
      ? payload.organizationId
      : '';

  if (!organizationId) throw new Error('Token is missing organization membership');

  const roles = Array.isArray(payload.roles) ? payload.roles.filter((role): role is string => typeof role === 'string') : [];
  return {
    subject: payload.sub ?? '',
    email: typeof payload.email === 'string' ? payload.email : undefined,
    organizationId,
    roles
  };
}
