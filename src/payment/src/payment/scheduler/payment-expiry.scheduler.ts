import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DataSource, LessThanOrEqual, In } from 'typeorm';
import { PaymentExpired, PaymentStatus } from 'building-blocks/contracts/payment.contract';
import { PaymentIntent } from '@/payment/entities/payment-intent.entity';
import { OutboxMessage } from '@/payment/entities/outbox-message.entity';
import { prepareOutboxMessage } from 'building-blocks/rabbitmq/outbox-message';

@Injectable()
export class PaymentExpiryScheduler implements OnModuleInit, OnModuleDestroy {
  private intervalRef?: NodeJS.Timeout;

  constructor(
    private readonly dataSource: DataSource
  ) {}

  onModuleInit(): void {
    const sweepMs = Number(process.env.PAYMENT_EXPIRY_SWEEP_MS || 60000);

    this.intervalRef = setInterval(async () => {
      await this.expirePendingPayments();
    }, sweepMs);

    void this.expirePendingPayments();
  }

  onModuleDestroy(): void {
    if (this.intervalRef) {
      clearInterval(this.intervalRef);
    }
  }

  private async expirePendingPayments(): Promise<void> {
    const expiredCandidates = await this.dataSource.getRepository(PaymentIntent).find({
      where: {
        expiresAt: LessThanOrEqual(new Date()),
        paymentStatus: In([PaymentStatus.PENDING, PaymentStatus.PROCESSING, PaymentStatus.FAILED])
      },
      relations: ['attempts', 'refunds']
    });

    for (const payment of expiredCandidates) {
      try {
        await this.dataSource.transaction(async (manager) => {
          const paymentRepository = manager.getRepository(PaymentIntent);
          const lockedPayment = await paymentRepository
            .createQueryBuilder('payment')
            .setLock('pessimistic_write')
            .where('payment.id = :id', { id: payment.id })
            .getOne();

          if (
            !lockedPayment ||
            ![PaymentStatus.PENDING, PaymentStatus.PROCESSING, PaymentStatus.FAILED].includes(
              lockedPayment.paymentStatus
            ) ||
            new Date(lockedPayment.expiresAt) > new Date()
          ) {
            return;
          }

          const occurredAt = new Date();
          lockedPayment.paymentStatus = PaymentStatus.EXPIRED;
          lockedPayment.updatedAt = occurredAt;
          await paymentRepository.save(lockedPayment);

          await manager.getRepository(OutboxMessage).insert(
            prepareOutboxMessage(
              new PaymentExpired({
                paymentId: lockedPayment.id,
                bookingId: lockedPayment.bookingId,
                userId: lockedPayment.userId,
                occurredAt
              }),
              {
                occurredAt
              }
            )
          );
        });
      } catch (error) {
        Logger.error(error);
      }
    }
  }
}
