import { UserCreated } from 'building-blocks/contracts/identity.contract';
import { DataSource } from 'typeorm';
import { IProcessedMessageRepository } from '@/data/repositories/processed-message.repository';
import { Passenger } from '@/passenger/entities/passenger.entity';
import { ProcessedMessage } from '@/passenger/entities/processed-message.entity';
import { CreateUserConsumerHandler } from '@/user/consumers/create-user';

describe('unit test for create user consumer handler', () => {
  let handler: CreateUserConsumerHandler;
  let processedMessageRepository: jest.Mocked<IProcessedMessageRepository>;
  let txPassengerRepository: {
    findOneBy: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
  };
  let txProcessedMessageRepository: {
    findOneBy: jest.Mock;
    insert: jest.Mock;
  };

  beforeEach(() => {
    processedMessageRepository = {
      hasProcessedMessage: jest.fn().mockResolvedValue(false)
    } as unknown as jest.Mocked<IProcessedMessageRepository>;
    txPassengerRepository = {
      findOneBy: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockImplementation(async (passenger) => passenger),
      create: jest.fn().mockImplementation((passenger) => passenger)
    };
    txProcessedMessageRepository = {
      findOneBy: jest.fn().mockResolvedValue(null),
      insert: jest.fn().mockResolvedValue(undefined)
    };
    const dataSource = {
      transaction: jest.fn(async (callback) =>
        callback({
          getRepository: jest.fn((entity) => {
            if (entity === Passenger) {
              return txPassengerRepository;
            }
            if (entity === ProcessedMessage) {
              return txProcessedMessageRepository;
            }

            throw new Error('Unexpected repository');
          })
        })
      )
    } as unknown as DataSource;

    handler = new CreateUserConsumerHandler(processedMessageRepository, dataSource);
  });

  it('should create a passenger from a sanitized UserCreated event', async () => {
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

    expect(processedMessageRepository.hasProcessedMessage).toHaveBeenCalledWith(
      CreateUserConsumerHandler.name,
      'message-1'
    );
    expect(txPassengerRepository.findOneBy).toHaveBeenCalledWith({ userId: 5 });
    expect(txPassengerRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 5,
        name: 'Phuc Truong',
        passportNumber: 'A123214413',
        age: 18,
        passengerType: 1
      })
    );
    expect(txProcessedMessageRepository.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        consumer: CreateUserConsumerHandler.name,
        messageKey: 'message-1'
      })
    );
  });
});
