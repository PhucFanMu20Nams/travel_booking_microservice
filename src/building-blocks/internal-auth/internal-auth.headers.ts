import { createHmac } from 'crypto';

export const INTERNAL_SERVICE_NAME_HEADER = 'x-service-name';
export const INTERNAL_TIMESTAMP_HEADER = 'x-internal-timestamp';
export const INTERNAL_SIGNATURE_HEADER = 'x-internal-signature';

// Backward-compatible aliases
export const INTERNAL_HEADER_SERVICE_NAME = INTERNAL_SERVICE_NAME_HEADER;
export const INTERNAL_HEADER_TIMESTAMP = INTERNAL_TIMESTAMP_HEADER;
export const INTERNAL_HEADER_SIGNATURE = INTERNAL_SIGNATURE_HEADER;

const normalizePath = (rawPath: string): string => {
  if (!rawPath) {
    return '/';
  }

  const noQuery = rawPath.split('?')[0].trim();
  if (!noQuery) {
    return '/';
  }

  const withLeadingSlash = noQuery.startsWith('/') ? noQuery : `/${noQuery}`;
  const collapsed = withLeadingSlash.replace(/\/+/g, '/');

  if (collapsed.length > 1 && collapsed.endsWith('/')) {
    return collapsed.slice(0, -1);
  }

  return collapsed;
};

export const normalizeInternalServiceName = (serviceName: string): string => {
  const normalized = serviceName.trim().toLowerCase();

  if (!normalized) {
    return '';
  }

  return normalized
    .replace(/\s+/g, '-')
    .replace(/-?service$/, '')
    .trim();
};

export const resolveInternalServiceName = (rawServiceName: string | undefined): string => {
  const normalized = normalizeInternalServiceName(rawServiceName || '');
  return normalized || 'unknown';
};

export const createInternalSignature = (
  secret: string,
  serviceName: string,
  timestampSeconds: number,
  method: string,
  path: string
): string => {
  const normalizedServiceName = normalizeInternalServiceName(serviceName);
  const canonical = `${normalizedServiceName}.${timestampSeconds}.${method.toUpperCase()}.${normalizePath(path)}`;

  return createHmac('sha256', secret).update(canonical).digest('hex');
};

export const createInternalAuthHeaders = (params: {
  secret: string;
  serviceName: string;
  method: string;
  path: string;
  timestampSeconds?: number;
}): Record<string, string> => {
  const timestampSeconds = params.timestampSeconds ?? Math.floor(Date.now() / 1000);
  const normalizedServiceName = resolveInternalServiceName(params.serviceName);

  const signature = createInternalSignature(
    params.secret,
    normalizedServiceName,
    timestampSeconds,
    params.method,
    params.path
  );

  return {
    [INTERNAL_SERVICE_NAME_HEADER]: normalizedServiceName,
    [INTERNAL_TIMESTAMP_HEADER]: String(timestampSeconds),
    [INTERNAL_SIGNATURE_HEADER]: signature
  };
};

export const getCanonicalPathForInternalAuth = (path: string): string => normalizePath(path);
