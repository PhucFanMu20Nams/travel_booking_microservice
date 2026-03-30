import { Inject, Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Passenger } from '@/passenger/entities/passenger.entity';
import { RabbitmqMessageEnvelope } from 'building-blocks/contracts/message-envelope.contract';
import { UserUpdated } from 'building-blocks/contracts/identity.contract';
import {
  IProcessedMessageRepository
} from '@/data/repositories/processed-message.repository';
import { ProcessedMessage } from '@/passenger/entities/processed-message.entity';

@Injectable()
export class UpdateUserConsumerHandler {
  constructor(
    @Inject('IProcessedMessageRepository')
    private readonly processedMessageRepository: IProcessedMessageRepository,
    private readonly dataSource: DataSource
  ) {}

  async handle(
    queue: string,
    message: UserUpdated,
    envelope?: RabbitmqMessageEnvelope<UserUpdated> | null
  ): Promise<void> {
    const messageKey = envelope?.messageId || envelope?.idempotencyKey;
    const consumer = UpdateUserConsumerHandler.name;

    if (await this.processedMessageRepository.hasProcessedMessage(consumer, messageKey)) {
      Logger.warn(`Passenger update event ${messageKey || 'legacy'} already processed. Skipping.`);
      return;
    }

    const eventTime = new Date(message.updatedAt ?? message.createdAt ?? new Date());
    let action: 'created' | 'updated' | 'ignored-stale' = 'updated';

    await this.dataSource.transaction(async (manager) => {
      const processedMessageRepository = manager.getRepository(ProcessedMessage);
      const existingProcessedMessage = messageKey
        ? await processedMessageRepository.findOneBy({
            consumer,
            messageKey
          })
        : null;

      if (existingProcessedMessage) {
        action = 'ignored-stale';
        return;
      }

      const passengerRepository = manager.getRepository(Passenger);
      const existingPassenger = await passengerRepository.findOneBy({ userId: message.id });

      if (existingPassenger?.sourceUpdatedAt && new Date(existingPassenger.sourceUpdatedAt) > eventTime) {
        action = 'ignored-stale';
      } else if (existingPassenger) {
        await passengerRepository.save(
          passengerRepository.create({
            ...existingPassenger,
            id: existingPassenger.id,
            userId: existingPassenger.userId,
            name: message.name,
            passportNumber: message.passportNumber,
            age: message.age,
            passengerType: message.passengerType,
            createdAt: existingPassenger.createdAt,
            updatedAt: new Date(),
            sourceUpdatedAt: eventTime
          })
        );
      } else {
        action = 'created';
        await passengerRepository.save(
          new Passenger({
            userId: message.id,
            name: message.name,
            passportNumber: message.passportNumber,
            age: message.age,
            passengerType: message.passengerType,
            createdAt: message.createdAt ? new Date(message.createdAt) : new Date(),
            updatedAt: message.updatedAt ? new Date(message.updatedAt) : new Date(),
            sourceUpdatedAt: eventTime
          })
        );
      }

      if (messageKey) {
        await processedMessageRepository.insert({
          consumer,
          messageKey,
          createdAt: new Date()
        });
      }
    });

    Logger.log(`Passenger sync ${action} from queue ${queue} (${messageKey || 'legacy'}).`);
  }
}
