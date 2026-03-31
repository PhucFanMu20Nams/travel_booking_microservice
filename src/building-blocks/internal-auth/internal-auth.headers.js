"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCanonicalPathForInternalAuth = exports.createInternalAuthHeaders = exports.createInternalSignature = exports.resolveInternalServiceName = exports.normalizeInternalServiceName = exports.INTERNAL_HEADER_SIGNATURE = exports.INTERNAL_HEADER_TIMESTAMP = exports.INTERNAL_HEADER_SERVICE_NAME = exports.INTERNAL_SIGNATURE_HEADER = exports.INTERNAL_TIMESTAMP_HEADER = exports.INTERNAL_SERVICE_NAME_HEADER = void 0;
const crypto_1 = require("crypto");
exports.INTERNAL_SERVICE_NAME_HEADER = 'x-service-name';
exports.INTERNAL_TIMESTAMP_HEADER = 'x-internal-timestamp';
exports.INTERNAL_SIGNATURE_HEADER = 'x-internal-signature';
exports.INTERNAL_HEADER_SERVICE_NAME = exports.INTERNAL_SERVICE_NAME_HEADER;
exports.INTERNAL_HEADER_TIMESTAMP = exports.INTERNAL_TIMESTAMP_HEADER;
exports.INTERNAL_HEADER_SIGNATURE = exports.INTERNAL_SIGNATURE_HEADER;
const normalizePath = (rawPath) => {
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
const normalizeInternalServiceName = (serviceName) => {
    const normalized = serviceName.trim().toLowerCase();
    if (!normalized) {
        return '';
    }
    return normalized
        .replace(/\s+/g, '-')
        .replace(/-?service$/, '')
        .trim();
};
exports.normalizeInternalServiceName = normalizeInternalServiceName;
const resolveInternalServiceName = (rawServiceName) => {
    const normalized = (0, exports.normalizeInternalServiceName)(rawServiceName || '');
    return normalized || 'unknown';
};
exports.resolveInternalServiceName = resolveInternalServiceName;
const createInternalSignature = (secret, serviceName, timestampSeconds, method, path) => {
    const normalizedServiceName = (0, exports.normalizeInternalServiceName)(serviceName);
    const canonical = `${normalizedServiceName}.${timestampSeconds}.${method.toUpperCase()}.${normalizePath(path)}`;
    return (0, crypto_1.createHmac)('sha256', secret).update(canonical).digest('hex');
};
exports.createInternalSignature = createInternalSignature;
const createInternalAuthHeaders = (params) => {
    const timestampSeconds = params.timestampSeconds ?? Math.floor(Date.now() / 1000);
    const normalizedServiceName = (0, exports.resolveInternalServiceName)(params.serviceName);
    const signature = (0, exports.createInternalSignature)(params.secret, normalizedServiceName, timestampSeconds, params.method, params.path);
    return {
        [exports.INTERNAL_SERVICE_NAME_HEADER]: normalizedServiceName,
        [exports.INTERNAL_TIMESTAMP_HEADER]: String(timestampSeconds),
        [exports.INTERNAL_SIGNATURE_HEADER]: signature
    };
};
exports.createInternalAuthHeaders = createInternalAuthHeaders;
const getCanonicalPathForInternalAuth = (path) => normalizePath(path);
exports.getCanonicalPathForInternalAuth = getCanonicalPathForInternalAuth;
//# sourceMappingURL=internal-auth.headers.js.map