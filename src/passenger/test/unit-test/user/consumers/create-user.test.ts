import { UserCreated } from 'building-blocks/contracts/identity.contract';
import { IPassengerRepository } from '@/data/repositories/passenger.repository';
import { CreateUserConsumerHandler } from '@/user/consumers/create-user';

describe('unit test for create user consumer handler', () => {
  let handler: CreateUserConsumerHandler;
  let passengerRepository: jest.Mocked<IPassengerRepository>;

  beforeEach(() => {
    passengerRepository = {
      createPassenger: jest.fn().mockImplementation(async (passenger) => passenger),
      updatePassenger: jest.fn(),
      findPassengerById: jest.fn(),
      findPassengerByUserId: jest.fn(),
      findPassengers: jest.fn()
    } as unknown as jest.Mocked<IPassengerRepository>;

    handler = new CreateUserConsumerHandler(passengerRepository);
  });

  it('should create a passenger from a sanitized UserCreated event', async () => {
    passengerRepository.findPassengerByUserId.mockResolvedValue(null);

    const message = new UserCreated({
      id: 5,
      email: 'user132@test.com',
      name: 'Phuc Truong',
      isEmailVerified: false,
      role: 0,
      passportNumber: 'A123214413',
      age: 18,
      passengerType: 1,
      createdAt: new Date('2026-03-30T02:25:56.844Z')
    });

    await handler.handle('passenger service.user_created', message, {
      messageId: 'message-1'
    } as never);

    expect(passengerRepository.findPassengerByUserId).toHaveBeenCalledWith(5);
    expect(passengerRepository.createPassenger).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 5,
        name: 'Phuc Truong',
        passportNumber: 'A123214413',
        age: 18,
        passengerType: 1
      })
    );
  });
});
