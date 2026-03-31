"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalOnly = void 0;
const common_1 = require("@nestjs/common");
const internal_only_guard_1 = require("./internal-only.guard");
const InternalOnly = () => (0, common_1.applyDecorators)((0, common_1.UseGuards)(internal_only_guard_1.InternalOnlyGuard));
exports.InternalOnly = InternalOnly;
//# sourceMappingURL=internal-only.decorator.js.map