"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInternalAuthService = exports.InternalAuthService = void 0;
const crypto_1 = require("crypto");
const configs_1 = __importDefault(require("../configs/configs"));
const internal_auth_headers_1 = require("./internal-auth.headers");
const toSingleHeaderValue = (value) => {
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
const secureCompare = (expected, actual) => {
    const expectedBuffer = Buffer.from(expected, 'utf8');
    const actualBuffer = Buffer.from(actual, 'utf8');
    if (expectedBuffer.length !== actualBuffer.length) {
        return false;
    }
    return (0, crypto_1.timingSafeEqual)(expectedBuffer, actualBuffer);
};
class InternalAuthService {
    maxClockSkewSeconds = configs_1.default.internalAuth.maxClockSkewSeconds;
    allowedInternalServices = new Set(configs_1.default.internalAuth.allowedServiceNames);
    validateRequest(request) {
        const rawServiceName = toSingleHeaderValue(request.header(internal_auth_headers_1.INTERNAL_SERVICE_NAME_HEADER));
        const timestampHeader = toSingleHeaderValue(request.header(internal_auth_headers_1.INTERNAL_TIMESTAMP_HEADER));
        const signatureHeader = toSingleHeaderValue(request.header(internal_auth_headers_1.INTERNAL_SIGNATURE_HEADER));
        if (!rawServiceName || !timestampHeader || !signatureHeader) {
            return {
                valid: false,
                reason: 'MISSING_INTERNAL_HEADERS'
            };
        }
        const serviceName = (0, internal_auth_headers_1.normalizeInternalServiceName)(rawServiceName);
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
        const secret = configs_1.default.internalAuth.secret;
        if (!secret) {
            return {
                valid: false,
                serviceName,
                reason: 'MISSING_INTERNAL_SECRET'
            };
        }
        const method = request.method || 'GET';
        const rawPath = request.originalUrl || request.url || request.path || '/';
        const path = (0, internal_auth_headers_1.getCanonicalPathForInternalAuth)(rawPath);
        const expectedSignature = (0, internal_auth_headers_1.createInternalSignature)(secret, serviceName, timestampSeconds, method, path);
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
exports.InternalAuthService = InternalAuthService;
let singleton = null;
const getInternalAuthService = () => {
    if (singleton) {
        return singleton;
    }
    singleton = new InternalAuthService();
    return singleton;
};
exports.getInternalAuthService = getInternalAuthService;
//# sourceMappingURL=internal-auth.service.js.map