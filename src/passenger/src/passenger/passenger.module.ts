import { Inject, Module, OnApplicationBootstrap } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IPassengerRepository, PassengerRepository } from '@/data/repositories/passenger.repository';
import { Passenger } from '@/passenger/entities/passenger.entity';
import { ProcessedMessage } from '@/passenger/entities/processed-message.entity';
import { RabbitmqModule } from 'building-blocks/rabbitmq/rabbitmq.module';
import {
  GetPassengerByIdController,
  GetPassengerByIdHandler
} from '@/passenger/features/v1/get-passenger-by-id/get-passenger-by-id';
import {
  GetPassengersController,
  GetPassengersHandler
} from '@/passenger/features/v1/get-passengers/get-passengers';
import {
  GetPassengerByUserIdController,
  GetPassengerByUserIdHandler
} from '@/passenger/features/v1/get-passenger-by-user-id/get-passenger-by-user-id';
import { UserCreated, UserUpdated } from 'building-blocks/contracts/identity.contract';
import { CreateUserConsumerHandler } from '@/user/consumers/create-user';
import { IRabbitmqConsumer } from 'building-blocks/rabbitmq/rabbitmq-subscriber';
import { UpdateUserConsumerHandler } from '@/user/consumers/update-user';
import { ProcessedMessageRepository } from '@/data/repositories/processed-message.repository';

@Module({
  imports: [
    CqrsModule,
    RabbitmqModule.forRoot(),
    TypeOrmModule.forFeature([Passenger, ProcessedMessage])
  ],
  controllers: [GetPassengerByIdController, GetPassengerByUserIdController, GetPassengersController],
  providers: [
    GetPassengerByIdHandler,
    GetPassengerByUserIdHandler,
    GetPassengersHandler,
    CreateUserConsumerHandler,
    UpdateUserConsumerHandler,
    {
      provide: 'IPassengerRepository',
      useClass: PassengerRepository
    },
    {
      provide: 'IProcessedMessageRepository',
      useClass: ProcessedMessageRepository
    }
  ],
  exports: []
})
export class PassengerModule implements OnApplicationBootstrap {
  constructor(
    @Inject('IRabbitmqConsumer') private readonly rabbitmqConsumer: IRabbitmqConsumer,
    private readonly createUserConsumerHandler: CreateUserConsumerHandler,
    private readonly updateUserConsumerHandler: UpdateUserConsumerHandler
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    void this.rabbitmqConsumer.consumeMessage(
      UserCreated,
      this.createUserConsumerHandler.handle.bind(this.createUserConsumerHandler)
    );
    void this.rabbitmqConsumer.consumeMessage(
      UserUpdated,
      this.updateUserConsumerHandler.handle.bind(this.updateUserConsumerHandler)
    );
  }
}
