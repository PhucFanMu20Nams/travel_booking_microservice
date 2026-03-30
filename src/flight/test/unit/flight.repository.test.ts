import { FlightRepository } from '@/data/repositories/flightRepository';

describe('FlightRepository.findFlights', () => {
  it('applies searchTerm and minFlightDate before pagination', async () => {
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
      minFlightDate
    });

    expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(1, 'flight.flightNumber ILIKE :searchTerm', {
      searchTerm: '%VN%'
    });
    expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(2, 'flight.flightDate >= :minFlightDate', {
      minFlightDate
    });
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('flight.flightDate', 'ASC');
    expect(queryBuilder.skip).toHaveBeenCalledWith(5);
    expect(queryBuilder.take).toHaveBeenCalledWith(5);
    expect(queryBuilder.getManyAndCount).toHaveBeenCalledTimes(1);
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
