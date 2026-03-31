import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { getInternalAuthService, InternalAuthValidationResult } from './internal-auth.service';

type InternalRequest = Request & {
  internalAuth?: InternalAuthValidationResult;
};

@Injectable()
export class InternalOnlyGuard implements CanActivate {
  private readonly internalAuthService = getInternalAuthService();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<InternalRequest>();
    const validation = this.internalAuthService.validateRequest(request);

    request.internalAuth = validation;

    if (!validation.valid) {
      throw new ForbiddenException({
        message: 'Internal access only',
        code: 'INTERNAL_ACCESS_ONLY',
        reason: validation.reason || 'INVALID_INTERNAL_SIGNATURE'
      });
    }

    return true;
  }
}
