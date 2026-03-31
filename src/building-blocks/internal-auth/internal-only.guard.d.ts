import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class InternalOnlyGuard implements CanActivate {
    private readonly internalAuthService;
    canActivate(context: ExecutionContext): boolean;
}
