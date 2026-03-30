import { UnauthorizedException } from '@nestjs/common';
import { Role } from 'building-blocks/contracts/identity.contract';
import { Flight } from '@/flight/entities/flight.entity';
import { FlightStatus } from '@/flight/enums/flight-status.enum';
import {
  GetFlights,
  GetFlightsController,
  GetFlightsHandler
} from '@/flight/features/v1/get-flights/get-flights';

const makeFlightEntity = (partial: Partial<Flight> = {}) =>
  new Flight({
    id: 1,
    flightNumber: 'VN123',
    price: 1500000,
    flightStatus: FlightStatus.SCHEDULED,
    flightDate: new Date('2026-03-24T17:00:00.000Z'),
    departureDate: new Date('2026-03-25T01:00:00.000Z'),
    departureAirportId: 1,
    aircraftId: 1,
    arriveDate: new Date('2026-03-25T03:00:00.000Z'),
    arriveAirportId: 2,
    durationMinutes: 120,
    createdAt: new Date('2026-03-20T00:00:00.000Z'),
    updatedAt: new Date('2026-03-20T00:00:00.000Z'),
    ...partial
  });

describe('GetFlightsController', () => {
  it('maps ADMIN role from JWT request into the internal query', async () => {
    const queryBus = {
      execute: jest.fn().mockResolvedValue({ result: [], total: 0 })
    };
    const controller = new GetFlightsController(queryBus as any);
    const query = {
      page: 1,
      pageSize: 10,
      orderBy: 'flightDate',
      order: 'ASC' as const,
      searchTerm: 'VN'
    };

    await controller.getFlights(query as any, { user: { role: String(Role.ADMIN) } } as any);

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        ...query,
        isAdmin: true
      })
    );
  });

  it('rejects requests whose JWT payload has no usable role', async () => {
    const controller = new GetFlightsController({ execute: jest.fn() } as any);

    await expect(controller.getFlights({} as any, { user: {} } as any)).rejects.toThrow(UnauthorizedException);
    await expect(controller.getFlights({} as any, { user: {} } as any)).rejects.toThrow('Invalid token payload');
  });
});

describe('GetFlightsHandler', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('passes the Vietnam business-day filter to the repository for non-admin users', async () => {
    jest.setSystemTime(new Date('2026-03-25T05:00:00.000Z'));

    const flightRepository = {
      findFlights: jest.fn().mockResolvedValue([[makeFlightEntity()], 1])
    };
    const handler = new GetFlightsHandler(flightRepository as any);

    const result = await handler.execute(
      new GetFlights({
        page: 1,
        pageSize: 10,
        orderBy: 'flightDate',
        order: 'ASC',
        searchTerm: 'VN',
        isAdmin: false
      })
    );

    expect(flightRepository.findFlights).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      orderBy: 'flightDate',
      order: 'ASC',
      searchTerm: 'VN',
      minFlightDate: new Date('2026-03-24T17:00:00.000Z')
    });
    expect(result.total).toBe(1);
    expect(result.result?.[0]?.flightNumber).toBe('VN123');
  });

  it('does not pass minFlightDate for admin users', async () => {
    const flightRepository = {
      findFlights: jest.fn().mockResolvedValue([[makeFlightEntity()], 1])
    };
    const handler = new GetFlightsHandler(flightRepository as any);

    await handler.execute(
      new GetFlights({
        page: 1,
        pageSize: 10,
        orderBy: 'flightDate',
        order: 'ASC',
        isAdmin: true
      })
    );

    expect(flightRepository.findFlights).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      orderBy: 'flightDate',
      order: 'ASC',
      searchTerm: null,
      minFlightDate: undefined
    });
  });
});
