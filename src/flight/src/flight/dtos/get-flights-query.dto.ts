import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { MAX_PAGE_SIZE } from 'building-blocks/validation/validation.constants';
import { OptionalSanitizedText, ToInteger } from 'building-blocks/validation/validation.decorators';
import { FlightStatus } from '@/flight/enums/flight-status.enum';

export class GetFlightsQueryDto {
  @IsOptional()
  @ToInteger()
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @ToInteger()
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  pageSize = 10;

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order: 'ASC' | 'DESC' = 'ASC';

  @IsOptional()
  @OptionalSanitizedText()
  searchTerm?: string;

  @IsOptional()
  @ToInteger()
  @IsInt()
  @Min(1)
  departureAirportId?: number;

  @IsOptional()
  @ToInteger()
  @IsInt()
  @Min(1)
  arriveAirportId?: number;

  @IsOptional()
  @ToInteger()
  @IsInt()
  @IsIn(Object.values(FlightStatus).filter((value) => typeof value === 'number'))
  flightStatus?: number;

  @IsOptional()
  @IsIn(['id', 'flightNumber', 'price', 'flightDate'])
  orderBy = 'id';
}
