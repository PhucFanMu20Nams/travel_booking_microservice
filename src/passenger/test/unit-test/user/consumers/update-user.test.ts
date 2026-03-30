import { PassengerType, UserUpdated } from 'building-blocks/contracts/identity.contract';
import { DataSource } from 'typeorm';
import { IProcessedMessageRepository } from '@/data/repositories/processed-message.repository';
import { Passenger } from '@/passenger/entities/passenger.entity';
import { ProcessedMessage } from '@/passenger/entities/processed-message.entity';
import { UpdateUserConsumerHandler } from '@/user/consumers/update-user';

describe('unit test for update user consumer handler', () => {
  let handler: UpdateUserConsumerHandler;
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
      findOneBy: jest.fn(),
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

    handler = new UpdateUserConsumerHandler(processedMessageRepository, dataSource);
  });

  it('should update an existing passenger from a sanitized UserUpdated event', async () => {
    const existingPassenger = new Passenger({
      id: 7,
      userId: 5,
      name: 'Old Name',
      passportNumber: 'OLD123456',
      age: 17,
      passengerType: PassengerType.UNKNOWN,
      createdAt: new Date('2026-03-29T00:00:00.000Z'),
      sourceUpdatedAt: new Date('2026-03-29T00:00:00.000Z')
    });
    txPassengerRepository.findOneBy.mockResolvedValue(existingPassenger);

    const message = new UserUpdated({
      id: 5,
      email: 'user132@test.com',
      name: 'Phuc Truong',
      isEmailVerified: false,
      role: 0,
      passportNumber: 'A123214413',
      age: 18,
      passengerType: PassengerType.MALE,
      createdAt: new Date('2026-03-30T02:25:56.844Z'),
      updatedAt: new Date('2026-03-30T04:00:00.000Z')
    });

    await handler.handle('passenger service.user_updated', message, {
      messageId: 'message-2'
    } as never);

    expect(processedMessageRepository.hasProcessedMessage).toHaveBeenCalledWith(
      UpdateUserConsumerHandler.name,
      'message-2'
    );
    expect(txPassengerRepository.findOneBy).toHaveBeenCalledWith({ userId: 5 });
    expect(txPassengerRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 7,
        userId: 5,
        name: 'Phuc Truong',
        passportNumber: 'A123214413',
        age: 18,
        passengerType: PassengerType.MALE
      })
    );
    expect(txProcessedMessageRepository.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        consumer: UpdateUserConsumerHandler.name,
        messageKey: 'message-2'
      })
    );
  });
});
