"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestContextMiddleware = exports.RequestContext = void 0;
const async_hooks_1 = require("async_hooks");
const crypto_1 = require("crypto");
const requestContextStorage = new async_hooks_1.AsyncLocalStorage();
class RequestContext {
    static run(context, callback) {
        requestContextStorage.run(context, callback);
    }
    static get() {
        return requestContextStorage.getStore();
    }
    static patch(partial) {
        const currentContext = requestContextStorage.getStore();
        if (!currentContext) {
            return;
        }
        Object.assign(currentContext, partial);
    }
    static getAuthorization() {
        return requestContextStorage.getStore()?.authorization;
    }
    static getRequestId() {
        return requestContextStorage.getStore()?.requestId;
    }
    static getCurrentUserId() {
        return requestContextStorage.getStore()?.currentUserId;
    }
    static getHeaders() {
        return requestContextStorage.getStore()?.headers ?? {};
    }
}
exports.RequestContext = RequestContext;
class RequestContextMiddleware {
    use(req, res, next) {
        const requestIdHeader = req.headers['x-request-id'];
        const requestId = typeof requestIdHeader === 'string' && requestIdHeader.trim() !== ''
            ? requestIdHeader
            : (0, crypto_1.randomUUID)();
        res.setHeader('x-request-id', requestId);
        RequestContext.run({
            authorization: typeof req.headers.authorization === 'string' ? req.headers.authorization : undefined,
            requestId,
            headers: { ...req.headers }
        }, next);
    }
}
exports.RequestContextMiddleware = RequestContextMiddleware;
//# sourceMappingURL=context.js.map