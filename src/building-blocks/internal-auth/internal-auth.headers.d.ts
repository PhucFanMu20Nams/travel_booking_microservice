export declare const INTERNAL_SERVICE_NAME_HEADER = "x-service-name";
export declare const INTERNAL_TIMESTAMP_HEADER = "x-internal-timestamp";
export declare const INTERNAL_SIGNATURE_HEADER = "x-internal-signature";
export declare const INTERNAL_HEADER_SERVICE_NAME = "x-service-name";
export declare const INTERNAL_HEADER_TIMESTAMP = "x-internal-timestamp";
export declare const INTERNAL_HEADER_SIGNATURE = "x-internal-signature";
export declare const normalizeInternalServiceName: (serviceName: string) => string;
export declare const resolveInternalServiceName: (rawServiceName: string | undefined) => string;
export declare const createInternalSignature: (secret: string, serviceName: string, timestampSeconds: number, method: string, path: string) => string;
export declare const createInternalAuthHeaders: (params: {
    secret: string;
    serviceName: string;
    method: string;
    path: string;
    timestampSeconds?: number;
}) => Record<string, string>;
export declare const getCanonicalPathForInternalAuth: (path: string) => string;
