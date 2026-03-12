import { faker } from '@faker-js/faker';
import { Role } from '@/user/enums/role.enum';
import { PassengerType } from '@/user/enums/passenger-type.enum';
import { CreateUserRequestDto } from '@/user/dtos/create-user-request.dto';

export class FakeCreateUserRequestDto {
  static generate(overrides: Partial<CreateUserRequestDto> = {}): CreateUserRequestDto {
    const createUserRequestDto: CreateUserRequestDto = {
      email: overrides.email ?? faker.internet.email(),
      password: overrides.password ?? 'Admin@1234',
      name: overrides.name ?? faker.person.fullName(),
      role: overrides.role ?? Role.USER,
      passportNumber: overrides.passportNumber ?? faker.string.numeric(9),
      age: overrides.age ?? 18,
      passengerType: overrides.passengerType ?? PassengerType.UNKNOWN
    };

    return createUserRequestDto;
  }
}
