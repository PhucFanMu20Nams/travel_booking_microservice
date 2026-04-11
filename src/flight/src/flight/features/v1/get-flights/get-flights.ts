import { IFlightRepository } from '@/data/repositories/flightRepository';
import { FlightDto } from '@/flight/dtos/flight.dto';
import { ApiBearerAuth, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Inject, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { PagedResult } from 'building-blocks/types/pagination/paged-result';
import { Flight } from '@/flight/entities/flight.entity';
import { JwtGuard } from 'building-blocks/passport/jwt.guard';
import mapper from '@/flight/mappings';
import { GetFlightsQueryDto } from '@/flight/dtos/get-flights-query.dto';
import { getEffectiveFlightStatus } from '@/flight/utils/flight-status';
import { getVietnamBusinessDayStart } from '@/flight/utils/flight-date';
import { FlightStatus } from '@/flight/enums/flight-status.enum';
import { Role } from 'building-blocks/contracts/identity.contract';
import { Request } from 'express';
import { RateLimitPolicy } from 'building-blocks/rate-limit/rate-limit.decorator';

type JwtRequest = Request & {
  user?: {
    role?: number | string;
  };
};

export class GetFlights {
  page = 1;
  pageSize = 10;
  orderBy = 'id';
  order: 'ASC' | 'DESC' = 'ASC';
  searchTerm?: string = null;
  departureAirportId?: number;
  arriveAirportId?: number;
  flightStatus?: number;
  isAdmin = false;

  constructor(request: Partial<GetFlights> = {}) {
    Object.assign(this, request);
  }
}

@ApiBearerAuth()
@ApiTags('Flights')
@Controller({
  path: `/flight`,
  version: '1'
})
export class GetFlightsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('get-all')
  @UseGuards(JwtGuard)
  @RateLimitPolicy('read.authenticated.default')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 401, description: 'UNAUTHORIZED' })
  @ApiResponse({ status: 400, description: 'BAD_REQUEST' })
  @ApiResponse({ status: 403, description: 'FORBIDDEN' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'], example: 'ASC' })
  @ApiQuery({
    name: 'orderBy',
    required: false,
    enum: ['id', 'flightNumber', 'price', 'flightDate'],
    example: 'id'
  })
  @ApiQuery({ name: 'searchTerm', required: false, type: String })
  @ApiQuery({ name: 'departureAirportId', required: false, type: Number })
  @ApiQuery({ name: 'arriveAirportId', required: false, type: Number })
  @ApiQuery({ name: 'flightStatus', required: false, enum: FlightStatus })
  public async getFlights(
    @Query() query: GetFlightsQueryDto,
    @Req() request: JwtRequest
  ): Promise<PagedResult<FlightDto[] | null>> {
    const role = Number(request.user?.role);

    if (Number.isNaN(role)) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return await this.queryBus.execute(
      new GetFlights({
        ...query,
        isAdmin: role === Role.ADMIN
      })
    );
  }
}

@QueryHandler(GetFlights)
export class GetFlightsHandler implements IQueryHandler<GetFlights> {
  constructor(@Inject('IFlightRepository') private readonly flightRepository: IFlightRepository) {}

  async execute(query: GetFlights): Promise<PagedResult<FlightDto[] | null>> {
    const now = new Date();
    const normalizedSearchTerm = query.searchTerm || null;
    const minFlightDate = query.isAdmin ? undefined : getVietnamBusinessDayStart(now);

    const [flightsEntity, total] = await this.flightRepository.findFlights({
      page: query.page,
      pageSize: query.pageSize,
      orderBy: query.orderBy,
      order: query.order,
      searchTerm: normalizedSearchTerm,
      minFlightDate,
      departureAirportId: query.departureAirportId,
      arriveAirportId: query.arriveAirportId,
      flightStatus: query.flightStatus,
      effectiveStatusAt: now
    });

    if (flightsEntity?.length === 0) {
      return new PagedResult<FlightDto[] | null>(null, total);
    }

    const result = flightsEntity.map((flight) => {
      const dto = mapper.map<Flight, FlightDto>(flight, new FlightDto());
      dto.flightStatus = getEffectiveFlightStatus(flight, now);

      return dto;
    });

    return new PagedResult<FlightDto[] | null>(result, total);
  }
}
