import { Inject, Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { User } from '@/user/entities/user.entity';
import { Role } from '@/user/enums/role.enum';
import { PassengerType } from '@/user/enums/passenger-type.enum';
import { encryptPassword } from 'building-blocks/utils/encryption';
import {
  PassengerType as IdentityContractPassengerType,
  Role as IdentityContractRole,
  UserCreated
} from 'building-blocks/contracts/identity.contract';
import { IRabbitmqPublisher } from 'building-blocks/rabbitmq/rabbitmq-publisher';

type SeedUser = {
  name: string;
  email: string;
  password: string;
  role: Role;
  passportNumber: string;
  age: number;
  passengerType: PassengerType;
  isEmailVerified: boolean;
};

@Injectable()
export class DataSeeder {
  constructor(
    private readonly entityManager: EntityManager,
    @Inject('IRabbitmqPublisher') private readonly rabbitmqPublisher: IRabbitmqPublisher
  ) {}

  private readonly seedUsers: SeedUser[] = [
    {
      name: 'developer',
      email: 'dev@dev.com',
      password: 'Admin@12345',
      role: Role.ADMIN,
      passportNumber: '12345678',
      age: 30,
      passengerType: PassengerType.MALE,
      isEmailVerified: true
    },
    {
      name: 'Nguyen Van A',
      email: 'user@test.com',
      password: 'User@12345',
      role: Role.USER,
      passportNumber: 'VN12345678',
      age: 24,
      passengerType: PassengerType.FEMALE,
      isEmailVerified: true
    }
  ];

  async seedAsync(): Promise<void> {
    const users = await this.seedUser();
    await this.publishUserCreatedEvents(users);
  }

  private async seedUser(): Promise<User[]> {
    const userRepository = this.entityManager.getRepository(User);
    const createdUsers: User[] = [];

    for (const seedUser of this.seedUsers) {
      let user = await userRepository.findOne({
        where: { email: seedUser.email }
      });

      if (!user) {
        user = await userRepository.save(
          new User({
            name: seedUser.name,
            email: seedUser.email,
            password: await encryptPassword(seedUser.password),
            role: seedUser.role,
            passportNumber: seedUser.passportNumber,
            age: seedUser.age,
            passengerType: seedUser.passengerType,
            isEmailVerified: seedUser.isEmailVerified
          })
        );

        Logger.log(`Seeded identity user ${seedUser.email}.`);
        createdUsers.push(user);
      }
    }

    return createdUsers;
  }

  private async publishUserCreatedEvents(users: User[]): Promise<void> {
    for (const user of users) {
      await this.rabbitmqPublisher.publishMessage(
        new UserCreated({
          id: user.id,
          email: user.email,
          name: user.name,
          isEmailVerified: user.isEmailVerified,
          role: user.role as unknown as IdentityContractRole,
          passportNumber: user.passportNumber,
          age: user.age,
          passengerType: user.passengerType as unknown as IdentityContractPassengerType,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt || undefined
        }),
        {
          useEnvelope: true
        }
      );
    }
  }
}
