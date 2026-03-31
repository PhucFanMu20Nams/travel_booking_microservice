"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalOnlyGuard = void 0;
const common_1 = require("@nestjs/common");
const internal_auth_service_1 = require("./internal-auth.service");
let InternalOnlyGuard = class InternalOnlyGuard {
    internalAuthService = (0, internal_auth_service_1.getInternalAuthService)();
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const validation = this.internalAuthService.validateRequest(request);
        request.internalAuth = validation;
        if (!validation.valid) {
            throw new common_1.ForbiddenException({
                message: 'Internal access only',
                code: 'INTERNAL_ACCESS_ONLY',
                reason: validation.reason || 'INVALID_INTERNAL_SIGNATURE'
            });
        }
        return true;
    }
};
exports.InternalOnlyGuard = InternalOnlyGuard;
exports.InternalOnlyGuard = InternalOnlyGuard = __decorate([
    (0, common_1.Injectable)()
], InternalOnlyGuard);
//# sourceMappingURL=internal-only.guard.js.map