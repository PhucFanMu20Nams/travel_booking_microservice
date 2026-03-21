import { ArrayMaxSize, IsArray, IsInt, Min } from 'class-validator';
import { MAX_PAGE_SIZE } from 'building-blocks/validation/validation.constants';

export class PaymentIdsRequestDto {
  @IsArray()
  @ArrayMaxSize(MAX_PAGE_SIZE)
  @IsInt({ each: true })
  @Min(1, { each: true })
  ids: number[] = [];
}
