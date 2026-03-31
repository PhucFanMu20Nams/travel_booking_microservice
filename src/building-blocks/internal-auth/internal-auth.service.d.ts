import { Request } from 'express';
export type InternalAuthValidationResult = {
    valid: boolean;
    serviceName?: string;
    reason?: string;
};
export declare class InternalAuthService {
    private readonly maxClockSkewSeconds;
    private readonly allowedInternalServices;
    validateRequest(request: Request): InternalAuthValidationResult;
}
export declare const getInternalAuthService: () => InternalAuthService;
