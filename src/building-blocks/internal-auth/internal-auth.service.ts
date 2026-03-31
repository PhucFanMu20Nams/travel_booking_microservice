import { timingSafeEqual } from 'crypto';
import { Request } from 'express';
import configs from '../configs/configs';
import {
  createInternalSignature,
  getCanonicalPathForInternalAuth,
  INTERNAL_SERVICE_NAME_HEADER,
  INTERNAL_SIGNATURE_HEADER,
  INTERNAL_TIMESTAMP_HEADER,
  normalizeInternalServiceName
} from './internal-auth.headers';

export type InternalAuthValidationResult = {
  valid: boolean;
  serviceName?: string;
  reason?: string;
};

const toSingleHeaderValue = (value: string | string[] | undefined): string | null => {
  if (Array.isArray(value)) {
    if (!value.length) {
      return null;
    }

    return String(value[0] || '').trim() || null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();

  return trimmedValue || null;
};

const secureCompare = (expected: string, actual: string): boolean => {
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const actualBuffer = Buffer.from(actual, 'utf8');

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
};

export class InternalAuthService {
  private readonly maxClockSkewSeconds = configs.internalAuth.maxClockSkewSeconds;
  private readonly allowedInternalServices = new Set(configs.internalAuth.allowedServiceNames);

  validateRequest(request: Request): InternalAuthValidationResult {
    const rawServiceName = toSingleHeaderValue(request.header(INTERNAL_SERVICE_NAME_HEADER));
    const timestampHeader = toSingleHeaderValue(request.header(INTERNAL_TIMESTAMP_HEADER));
    const signatureHeader = toSingleHeaderValue(request.header(INTERNAL_SIGNATURE_HEADER));

    if (!rawServiceName || !timestampHeader || !signatureHeader) {
      return {
        valid: false,
        reason: 'MISSING_INTERNAL_HEADERS'
      };
    }

    const serviceName = normalizeInternalServiceName(rawServiceName);

    if (!serviceName || !this.allowedInternalServices.has(serviceName)) {
      return {
        valid: false,
        serviceName,
        reason: 'INVALID_SERVICE_NAME'
      };
    }

    const timestampSeconds = Number(timestampHeader);

    if (!Number.isInteger(timestampSeconds) || timestampSeconds <= 0) {
      return {
        valid: false,
        serviceName,
        reason: 'INVALID_TIMESTAMP'
      };
    }

    const nowSeconds = Math.floor(Date.now() / 1000);

    if (Math.abs(nowSeconds - timestampSeconds) > this.maxClockSkewSeconds) {
      return {
        valid: false,
        serviceName,
        reason: 'TIMESTAMP_OUT_OF_RANGE'
      };
    }

    const secret = configs.internalAuth.secret;

    if (!secret) {
      return {
        valid: false,
        serviceName,
        reason: 'MISSING_INTERNAL_SECRET'
      };
    }

    const method = request.method || 'GET';
    const rawPath = request.originalUrl || request.url || request.path || '/';
    const path = getCanonicalPathForInternalAuth(rawPath);

    const expectedSignature = createInternalSignature(secret, serviceName, timestampSeconds, method, path);

    if (!secureCompare(expectedSignature, signatureHeader)) {
      return {
        valid: false,
        serviceName,
        reason: 'INVALID_SIGNATURE'
      };
    }

    return {
      valid: true,
      serviceName
    };
  }
}

let singleton: InternalAuthService | null = null;

export const getInternalAuthService = (): InternalAuthService => {
  if (singleton) {
    return singleton;
  }

  singleton = new InternalAuthService();

  return singleton;
};
