import { FlightRepository } from '@/data/repositories/flightRepository';
import { FlightStatus } from '@/flight/enums/flight-status.enum';

describe('FlightRepository.findFlights', () => {
  it('applies searchTerm, route filters, canceled status, and minFlightDate before pagination', async () => {
    const queryBuilder = {
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0])
    };
    const typeormRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder)
    };
    const repository = new FlightRepository(typeormRepository as any);
    const minFlightDate = new Date('2026-03-24T17:00:00.000Z');

    await repository.findFlights({
      page: 2,
      pageSize: 5,
      orderBy: 'flightDate',
      order: 'ASC',
      searchTerm: 'VN',
      departureAirportId: 1,
      arriveAirportId: 2,
      flightStatus: FlightStatus.CANCELED,
      minFlightDate
    });

    expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(1, 'flight.flightNumber ILIKE :searchTerm', {
      searchTerm: '%VN%'
    });
    expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(2, 'flight.flightDate >= :minFlightDate', {
      minFlightDate
    });
    expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(3, 'flight.departureAirportId = :departureAirportId', {
      departureAirportId: 1
    });
    expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(4, 'flight.arriveAirportId = :arriveAirportId', {
      arriveAirportId: 2
    });
    expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(5, 'flight.flightStatus = :canceledStatus', {
      canceledStatus: FlightStatus.CANCELED
    });
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('flight.flightDate', 'ASC');
    expect(queryBuilder.skip).toHaveBeenCalledWith(5);
    expect(queryBuilder.take).toHaveBeenCalledWith(5);
    expect(queryBuilder.getManyAndCount).toHaveBeenCalledTimes(1);
  });

  it('applies the effective scheduled-status filter before pagination', async () => {
    const queryBuilder = {
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0])
    };
    const typeormRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder)
    };
    const repository = new FlightRepository(typeormRepository as any);
    const effectiveStatusAt = new Date('2026-03-25T05:00:00.000Z');

    await repository.findFlights({
      page: 1,
      pageSize: 10,
      orderBy: 'flightDate',
      order: 'ASC',
      searchTerm: null,
      flightStatus: FlightStatus.SCHEDULED,
      effectiveStatusAt
    });

    expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(1, 'flight.flightStatus <> :scheduledCanceledStatus', {
      scheduledCanceledStatus: FlightStatus.CANCELED
    });
    expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(2, 'flight.flightStatus <> :scheduledDelayStatus', {
      scheduledDelayStatus: FlightStatus.DELAY
    });
    expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(3, 'flight.departureDate > :effectiveStatusAt', {
      effectiveStatusAt
    });
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('flight.flightDate', 'ASC');
  });

  it('skips the date filter for admin-equivalent queries', async () => {
    const queryBuilder = {
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0])
    };
    const typeormRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder)
    };
    const repository = new FlightRepository(typeormRepository as any);

    await repository.findFlights({
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      order: 'ASC',
      searchTerm: null,
      minFlightDate: undefined
    });

    expect(queryBuilder.andWhere).not.toHaveBeenCalled();
  });
});
