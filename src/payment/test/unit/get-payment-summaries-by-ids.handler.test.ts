import {
  GetPaymentSummariesByIds,
  GetPaymentSummariesByIdsHandler
} from '@/payment/features/v1/get-payment-summaries-by-ids/get-payment-summaries-by-ids';
import { PaymentStatus, RefundStatus } from 'building-blocks/contracts/payment.contract';

const makePaymentEntity = (id: number, partial: Partial<Record<string, unknown>> = {}) => ({
  id,
  bookingId: id + 1000,
  userId: 42,
  amount: 2625000,
  currency: 'VND',
  paymentCode: `TBK-${id}`,
  paymentStatus: PaymentStatus.PENDING,
  refundStatus: RefundStatus.NONE,
  expiresAt: new Date('2099-03-10T07:15:00.000Z'),
  completedAt: null,
  refundedAt: null,
  providerTxnId: null,
  reconciledAt: null,
  reconciledBy: null,
  createdAt: new Date('2099-03-10T07:00:00.000Z'),
  updatedAt: new Date('2099-03-10T07:01:00.000Z'),
  attempts: [],
  refunds: [],
  ...partial
});

describe('GetPaymentSummariesByIdsHandler', () => {
  it('returns summaries for admin and keeps requested id ordering', async () => {
    const paymentRepository = {
      findPaymentSummariesByIds: jest.fn().mockResolvedValue([makePaymentEntity(3), makePaymentEntity(1)])
    };
    const handler = new GetPaymentSummariesByIdsHandler(paymentRepository as any);

    const result = await handler.execute(
      new GetPaymentSummariesByIds({
        ids: [1, 3, 3, 999],
        currentUserId: 7,
        isAdmin: true
      })
    );

    expect(paymentRepository.findPaymentSummariesByIds).toHaveBeenCalledWith([1, 3, 999], undefined);
    expect(result.map((summary) => summary.id)).toEqual([1, 3]);
  });

  it('filters by current user for non-admin requests', async () => {
    const paymentRepository = {
      findPaymentSummariesByIds: jest.fn().mockResolvedValue([makePaymentEntity(5, { userId: 42 })])
    };
    const handler = new GetPaymentSummariesByIdsHandler(paymentRepository as any);

    const result = await handler.execute(
      new GetPaymentSummariesByIds({
        ids: [5, 6],
        currentUserId: 42,
        isAdmin: false
      })
    );

    expect(paymentRepository.findPaymentSummariesByIds).toHaveBeenCalledWith([5, 6], 42);
    expect(result.map((summary) => summary.id)).toEqual([5]);
  });

  it('returns empty response when ids are empty after normalization', async () => {
    const paymentRepository = {
      findPaymentSummariesByIds: jest.fn()
    };
    const handler = new GetPaymentSummariesByIdsHandler(paymentRepository as any);

    const result = await handler.execute(
      new GetPaymentSummariesByIds({
        ids: [0, -1],
        currentUserId: 42,
        isAdmin: true
      })
    );

    expect(paymentRepository.findPaymentSummariesByIds).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });
});
