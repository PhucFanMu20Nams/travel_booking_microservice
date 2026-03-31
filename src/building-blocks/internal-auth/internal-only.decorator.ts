import { applyDecorators, UseGuards } from '@nestjs/common';
import { InternalOnlyGuard } from './internal-only.guard';

export const InternalOnly = () => applyDecorators(UseGuards(InternalOnlyGuard));
