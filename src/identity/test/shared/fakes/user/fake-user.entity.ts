import { faker } from '@faker-js/faker';
import { Role } from '@/user/enums/role.enum';
import { PassengerType } from '@/user/enums/passenger-type.enum';
import { User } from '@/user/entities/user.entity';

export class FakeUser {
  static generate(overrides: Partial<User> = {}): User {
    const user: User = {
      id: overrides.id ?? 1,
      name: overrides.name ?? faker.person.fullName(),
      role: overrides.role ?? Role.USER,
      password: overrides.password ?? 'Admin@1234',
      email: overrides.email ?? faker.internet.email(),
      passportNumber: overrides.passportNumber ?? faker.string.numeric(9),
      age: overrides.age ?? 18,
      passengerType: overrides.passengerType ?? PassengerType.UNKNOWN,
      isEmailVerified: overrides.isEmailVerified ?? false,
      createdAt: overrides.createdAt ?? faker.date.anytime(),
      updatedAt: overrides.updatedAt ?? null,
      tokens: overrides.tokens ?? []
    };

    return user;
  }
}
