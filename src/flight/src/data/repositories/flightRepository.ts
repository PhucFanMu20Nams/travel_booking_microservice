import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Flight } from '@/flight/entities/flight.entity';
import { FlightStatus } from '@/flight/enums/flight-status.enum';

export type FindFlightsParams = {
  page: number;
  pageSize: number;
  orderBy: string;
  order: 'ASC' | 'DESC';
  searchTerm?: string | null;
  departureAirportId?: number;
  arriveAirportId?: number;
  flightStatus?: number;
  minFlightDate?: Date;
  effectiveStatusAt?: Date;
};

export interface IFlightRepository {
  createFlight(flight: Flight, manager?: EntityManager): Promise<Flight>;
  findFlightByNumber(flightNumber: string): Promise<Flight>;
  findFlightByNumberAndDate(
    flightNumber: string,
    flightDate: Date,
    manager?: EntityManager
  ): Promise<Flight>;
  findFlightById(id: number): Promise<Flight>;
  findFlights(params: FindFlightsParams): Promise<[Flight[], number]>;
  getAll(): Promise<Flight[]>;
}

export class FlightRepository implements IFlightRepository {
  constructor(
    @InjectRepository(Flight)
    private readonly flightRepository: Repository<Flight>
  ) {}

  async createFlight(flight: Flight, manager?: EntityManager): Promise<Flight> {
    const repository = manager?.getRepository(Flight) || this.flightRepository;
    return await repository.save(flight);
  }

  async findFlightByNumber(flightNumber: string): Promise<Flight> {
    return await this.flightRepository.findOneBy({
      flightNumber: flightNumber
    });
  }

  async findFlightByNumberAndDate(
    flightNumber: string,
    flightDate: Date,
    manager?: EntityManager
  ): Promise<Flight> {
    const repository = manager?.getRepository(Flight) || this.flightRepository;
    return await repository
      .createQueryBuilder('flight')
      .where('flight.flightNumber = :flightNumber', { flightNumber })
      .andWhere('DATE(flight.flightDate) = DATE(:flightDate)', { flightDate })
      .getOne();
  }

  async findFlightById(id: number): Promise<Flight> {
    return await this.flightRepository.findOneBy({
      id: id
    });
  }

  async findFlights({
    page,
    pageSize,
    orderBy,
    order,
    searchTerm,
    departureAirportId,
    arriveAirportId,
    flightStatus,
    minFlightDate,
    effectiveStatusAt
  }: FindFlightsParams): Promise<[Flight[], number]> {
    const query = this.flightRepository
      .createQueryBuilder('flight');

    if (searchTerm) {
      query.andWhere('flight.flightNumber ILIKE :searchTerm', {
        searchTerm: `%${searchTerm}%`
      });
    }

    if (minFlightDate) {
      query.andWhere('flight.flightDate >= :minFlightDate', {
        minFlightDate
      });
    }

    if (typeof departureAirportId === 'number') {
      query.andWhere('flight.departureAirportId = :departureAirportId', {
        departureAirportId
      });
    }

    if (typeof arriveAirportId === 'number') {
      query.andWhere('flight.arriveAirportId = :arriveAirportId', {
        arriveAirportId
      });
    }

    if (typeof flightStatus === 'number') {
      const statusAt = effectiveStatusAt || new Date();

      switch (flightStatus) {
        case FlightStatus.CANCELED:
          query.andWhere('flight.flightStatus = :canceledStatus', {
            canceledStatus: FlightStatus.CANCELED
          });
          break;
        case FlightStatus.COMPLETED:
          query
            .andWhere('flight.flightStatus <> :completedCanceledStatus', {
              completedCanceledStatus: FlightStatus.CANCELED
            })
            .andWhere('flight.arriveDate <= :effectiveStatusAt', {
              effectiveStatusAt: statusAt
            });
          break;
        case FlightStatus.FLYING:
          query
            .andWhere('flight.flightStatus <> :flyingCanceledStatus', {
              flyingCanceledStatus: FlightStatus.CANCELED
            })
            .andWhere('flight.departureDate <= :effectiveStatusAt', {
              effectiveStatusAt: statusAt
            })
            .andWhere('flight.arriveDate > :effectiveStatusAt', {
              effectiveStatusAt: statusAt
            });
          break;
        case FlightStatus.DELAY:
          query
            .andWhere('flight.flightStatus = :delayStatus', {
              delayStatus: FlightStatus.DELAY
            })
            .andWhere('flight.departureDate > :effectiveStatusAt', {
              effectiveStatusAt: statusAt
            });
          break;
        case FlightStatus.SCHEDULED:
          query
            .andWhere('flight.flightStatus <> :scheduledCanceledStatus', {
              scheduledCanceledStatus: FlightStatus.CANCELED
            })
            .andWhere('flight.flightStatus <> :scheduledDelayStatus', {
              scheduledDelayStatus: FlightStatus.DELAY
            })
            .andWhere('flight.departureDate > :effectiveStatusAt', {
              effectiveStatusAt: statusAt
            });
          break;
        default:
          query.andWhere('1 = 0');
          break;
      }
    }

    query
      .orderBy(`flight.${orderBy}`, order)
      .skip((page - 1) * pageSize)
      .take(pageSize);

    return await query.getManyAndCount();
  }

  async getAll(): Promise<Flight[]> {
    return await this.flightRepository.find();
  }
}
