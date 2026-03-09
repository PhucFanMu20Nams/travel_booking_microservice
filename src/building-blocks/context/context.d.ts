import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { IncomingHttpHeaders } from 'http';
export type RequestContextValue = {
    authorization?: string;
    requestId: string;
    currentUserId?: number;
    headers: IncomingHttpHeaders;
};
export declare class RequestContext {
    static run(context: RequestContextValue, callback: () => void): void;
    static get(): RequestContextValue | undefined;
    static patch(partial: Partial<RequestContextValue>): void;
    static getAuthorization(): string | undefined;
    static getRequestId(): string | undefined;
    static getCurrentUserId(): number | undefined;
    static getHeaders(): IncomingHttpHeaders;
}
export declare class RequestContextMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction): void;
}
