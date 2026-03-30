import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProcessedMessage } from '@/passenger/entities/processed-message.entity';

export interface IProcessedMessageRepository {
  hasProcessedMessage(consumer: string, messageKey: string): Promise<boolean>;
}

export class ProcessedMessageRepository implements IProcessedMessageRepository {
  constructor(
    @InjectRepository(ProcessedMessage)
    private readonly processedMessageRepository: Repository<ProcessedMessage>
  ) {}

  async hasProcessedMessage(consumer: string, messageKey: string): Promise<boolean> {
    if (!messageKey) {
      return false;
    }

    return await this.processedMessageRepository.exist({
      where: {
        consumer,
        messageKey
      }
    });
  }
}
