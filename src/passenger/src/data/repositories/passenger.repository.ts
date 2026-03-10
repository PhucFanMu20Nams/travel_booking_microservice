import { Repository, SelectQueryBuilder } from 'typeorm';
import {InjectRepository} from "@nestjs/typeorm";
import {Passenger} from '@/passenger/entities/passenger.entity';
import {Injectable} from "@nestjs/common";

export interface IPassengerRepository {
  createPassenger(passenger: Passenger): Promise<Passenger>;

  updatePassenger(passenger: Passenger): Promise<void>;

  findPassengerById(id: number): Promise<Passenger>;

  findPassengerByUserId(userId: number): Promise<Passenger>;

  findPassengers(
      page: number,
      pageSize: number,
      orderBy: string,
      order: 'ASC' | 'DESC',
      searchTerm?: string
  ): Promise<[Passenger[], number]>;
}

@Injectable()
export class PassengerRepository implements IPassengerRepository {
  constructor(@InjectRepository(Passenger)
              private readonly passengerRepository: Repository<Passenger>) {
  }

  async createPassenger(passenger: Passenger): Promise<Passenger> {
    return await this.passengerRepository.save(passenger);
  }

  async updatePassenger(passenger: Passenger): Promise<void> {
    await this.passengerRepository.update(passenger.id, passenger);
  }

  async findPassengerById(id: number): Promise<Passenger> {
    return this.passengerRepository.findOneBy({ id: id });
  }

  async findPassengerByUserId(userId: number): Promise<Passenger> {
    return this.passengerRepository.findOneBy({ userId: userId });
  }

  async findPassengers(
      page: number,
      pageSize: number,
      orderBy: string,
      order: 'ASC' | 'DESC',
      searchTerm?: string
  ): Promise<[Passenger[], number]> {
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const queryBuilder: SelectQueryBuilder<Passenger> = this.passengerRepository
        .createQueryBuilder('passenger')
        .orderBy(`passenger.${orderBy}`, order)
        .skip(skip)
        .take(take);

    // Apply filter criteria to the query
    if (searchTerm) {
      queryBuilder.andWhere('passenger.name LIKE :name', { name: `%${searchTerm}%` });
    }

    return await queryBuilder.getManyAndCount();
  }
}
