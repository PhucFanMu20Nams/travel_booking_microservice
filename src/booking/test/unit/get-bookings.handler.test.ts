import { GetBookings, GetBookingsHandler } from '@/booking/features/v1/get-bookings/get-bookings';
import { BookingStatus } from '@/booking/enums/booking-status.enum';
import { SeatClass } from '@/booking/enums/seat-class.enum';
import { PaymentStatus, RefundStatus } from 'building-blocks/contracts/payment.contract';

const makeBookingEntity = (partial: Partial<Record<string, unknown>> = {}) => ({
  id: 1,
  flightId: 7,
  flightNumber: 'VN777',
  aircraftId: 3,
  departureAirportId: 1,
  arriveAirportId: 2,
  flightDate: new Date('2099-03-10T00:00:00.000Z'),
  price: 2625000,
  currency: 'VND',
  description: 'Window seat',
  seatNumber: '1A',
  seatClass: SeatClass.BUSINESS,
  passengerName: 'Nguyen Van A',
  userId: 42,
  passengerId: 11,
  bookingStatus: BookingStatus.PENDING_PAYMENT,
  paymentId: 901,
  paymentExpiresAt: new Date('2099-03-10T07:15:00.000Z'),
  confirmedAt: null,
  expiredAt: null,
  createdAt: new Date('2099-03-10T07:00:00.000Z'),
  updatedAt: new Date('2099-03-10T07:01:00.000Z'),
  canceledAt: null,
  ...partial
});

const makePaymentSummary = (id: number, partial: Partial<Record<string, unknown>> = {}) => ({
  id,
  bookingId: 99,
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
  ...partial
});

describe('GetBookingsHandler', () => {
  it('skips payment enrichment entirely when includePaymentSummary is false', async () => {
    const bookingRepository = {
      findBookings: jest.fn().mockResolvedValue([[makeBookingEntity({ paymentId: 901 })], 1])
    };
    const paymentClient = {
      createPaymentIntent: jest.fn(),
      getPaymentById: jest.fn(),
      getPaymentSummariesByIds: jest.fn()
    };

    const handler = new GetBookingsHandler(bookingRepository as any, paymentClient as any);
    const result = await handler.execute(new GetBookings({ includePaymentSummary: false, page: 1, pageSize: 10 }));

    expect(paymentClient.getPaymentSummariesByIds).not.toHaveBeenCalled();
    expect(result.result[0].paymentSummary).toBeNull();
  });

  it('requests payment summaries once with unique payment ids', async () => {
    const bookings = [
      makeBookingEntity({ id: 1, paymentId: 901 }),
      makeBookingEntity({ id: 2, paymentId: 901 }),
      makeBookingEntity({ id: 3, paymentId: 902 }),
      makeBookingEntity({ id: 4, paymentId: null })
    ];
    const bookingRepository = {
      findBookings: jest.fn().mockResolvedValue([bookings, bookings.length])
    };
    const paymentClient = {
      createPaymentIntent: jest.fn(),
      getPaymentById: jest.fn(),
      getPaymentSummariesByIds: jest
        .fn()
        .mockResolvedValue([makePaymentSummary(901), makePaymentSummary(902, { paymentStatus: PaymentStatus.SUCCEEDED })])
    };

    const handler = new GetBookingsHandler(bookingRepository as any, paymentClient as any);
    const result = await handler.execute(new GetBookings({ includePaymentSummary: true, page: 1, pageSize: 10 }));

    expect(paymentClient.getPaymentSummariesByIds).toHaveBeenCalledTimes(1);
    expect(paymentClient.getPaymentSummariesByIds).toHaveBeenCalledWith([901, 902]);
    expect(result.result[0].paymentSummary?.id).toBe(901);
    expect(result.result[1].paymentSummary?.id).toBe(901);
    expect(result.result[2].paymentSummary?.id).toBe(902);
    expect(result.result[3].paymentSummary).toBeNull();
  });

  it('degrades gracefully to null payment summaries when bulk lookup fails', async () => {
    const bookingRepository = {
      findBookings: jest.fn().mockResolvedValue([[makeBookingEntity({ paymentId: 901 })], 1])
    };
    const paymentClient = {
      createPaymentIntent: jest.fn(),
      getPaymentById: jest.fn(),
      getPaymentSummariesByIds: jest.fn().mockRejectedValue(new Error('payment service unavailable'))
    };

    const handler = new GetBookingsHandler(bookingRepository as any, paymentClient as any);
    const result = await handler.execute(new GetBookings({ includePaymentSummary: true, page: 1, pageSize: 10 }));

    expect(paymentClient.getPaymentSummariesByIds).toHaveBeenCalledWith([901]);
    expect(result.result[0].paymentSummary).toBeNull();
  });
});
