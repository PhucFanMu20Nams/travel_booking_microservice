import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';
import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { IncomingHttpHeaders } from 'http';

export type RequestContextValue = {
  authorization?: string;
  requestId: string;
  currentUserId?: number;
  headers: IncomingHttpHeaders;
};

const requestContextStorage = new AsyncLocalStorage<RequestContextValue>();

export class RequestContext {
  static run(context: RequestContextValue, callback: () => void): void {
    requestContextStorage.run(context, callback);
  }

  static get(): RequestContextValue | undefined {
    return requestContextStorage.getStore();
  }

  static patch(partial: Partial<RequestContextValue>): void {
    const currentContext = requestContextStorage.getStore();

    if (!currentContext) {
      return;
    }

    Object.assign(currentContext, partial);
  }

  static getAuthorization(): string | undefined {
    return requestContextStorage.getStore()?.authorization;
  }

  static getRequestId(): string | undefined {
    return requestContextStorage.getStore()?.requestId;
  }

  static getCurrentUserId(): number | undefined {
    return requestContextStorage.getStore()?.currentUserId;
  }

  static getHeaders(): IncomingHttpHeaders {
    return requestContextStorage.getStore()?.headers ?? {};
  }
}

export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestIdHeader = req.headers['x-request-id'];
    const requestId = typeof requestIdHeader === 'string' && requestIdHeader.trim() !== ''
      ? requestIdHeader
      : randomUUID();

    res.setHeader('x-request-id', requestId);

    RequestContext.run(
      {
        authorization: typeof req.headers.authorization === 'string' ? req.headers.authorization : undefined,
        requestId,
        headers: { ...req.headers }
      },
      next
    );
  }
}
