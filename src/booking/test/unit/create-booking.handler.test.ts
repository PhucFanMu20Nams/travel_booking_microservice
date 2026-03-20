import { ConflictException } from '@nestjs/common';
import { CreateBooking, CreateBookingHandler } from '@/booking/features/v1/create-booking/create-booking';
import { BookingStatus } from '@/booking/enums/booking-status.enum';
import { SeatClass } from '@/booking/enums/seat-class.enum';
import { FlightStatus } from 'building-blocks/contracts/flight.contract';

describe('CreateBookingHandler', () => {
  it('creates a pending checkout with the locked seat price instead of the base flight fare', async () => {
    const bookingRepository = {
      findActiveBookingByUserAndFlight: jest.fn().mockResolvedValue(null),
      createBooking: jest.fn().mockImplementation(async (booking) => ({ ...booking, id: 99 })),
      updateBooking: jest.fn().mockImplementation(async (booking) => booking)
    };
    const flightClient = {
      getFlightById: jest.fn().mockResolvedValue({
        id: 7,
        flightNumber: 'VN777',
        price: 1500000,
        flightStatus: FlightStatus.SCHEDULED,
        flightDate: '2099-03-10T00:00:00.000Z',
        departureDate: '2099-03-10T08:00:00.000Z',
        aircraftId: 3,
        departureAirportId: 1,
        arriveAirportId: 2
      }),
      reserveSeat: jest.fn().mockResolvedValue({
        id: 55,
        seatNumber: '1A',
        seatClass: SeatClass.BUSINESS,
        seatType: 1,
        flightId: 7,
        price: 2625000,
        currency: 'VND',
        isReserved: true,
        createdAt: new Date().toISOString()
      })
    };
    const passengerClient = {
      getPassengerByUserId: jest.fn().mockResolvedValue({
        id: 11,
        name: 'Nguyen Van A'
      })
    };
    const paymentClient = {
      createPaymentIntent: jest.fn().mockResolvedValue({
        id: 901,
        bookingId: 99,
        userId: 42,
        amount: 2625000,
        currency: 'VND',
        paymentStatus: 0,
        refundStatus: 0,
        expiresAt: '2099-03-10T07:15:00.000Z',
        createdAt: new Date().toISOString()
      }),
      getPaymentById: jest.fn()
    };
    const idempotencyRepository = {
      findByScopeAndKey: jest.fn().mockResolvedValue(null),
      saveRecord: jest.fn()
    };
    const rabbitmqPublisher = {
      publishMessage: jest.fn(),
      isPublished: jest.fn()
    };

    const handler = new CreateBookingHandler(
      bookingRepository as any,
      flightClient as any,
      passengerClient as any,
      paymentClient as any,
      idempotencyRepository as any,
      rabbitmqPublisher as any
    );

    const result = await handler.execute(
      new CreateBooking({
        currentUserId: 42,
        flightId: 7,
        description: 'Window seat',
        seatNumber: '1A',
        idempotencyKey: 'booking-1'
      })
    );

    expect(bookingRepository.createBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        price: 2625000,
        seatClass: SeatClass.BUSINESS,
        bookingStatus: BookingStatus.PENDING_PAYMENT
      })
    );
    expect(paymentClient.createPaymentIntent).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 2625000,
        currency: 'VND'
      })
    );
    expect(result.booking.bookingStatus).toBe(BookingStatus.PENDING_PAYMENT);
    expect(result.payment.amount).toBe(2625000);
  });

  it('rejects duplicate active bookings before reserving a new seat', async () => {
    const bookingRepository = {
      findActiveBookingByUserAndFlight: jest.fn().mockResolvedValue({
        id: 88,
        paymentId: 45,
        bookingStatus: BookingStatus.PENDING_PAYMENT
      })
    };
    const flightClient = {
      getFlightById: jest.fn().mockResolvedValue({
        id: 7,
        flightNumber: 'VN777',
        price: 1500000,
        flightStatus: FlightStatus.SCHEDULED,
        flightDate: '2099-03-10T00:00:00.000Z',
        departureDate: '2099-03-10T08:00:00.000Z'
      }),
      reserveSeat: jest.fn()
    };
    const passengerClient = {
      getPassengerByUserId: jest.fn().mockResolvedValue({
        id: 11,
        name: 'Nguyen Van A'
      })
    };
    const paymentClient = {
      createPaymentIntent: jest.fn(),
      getPaymentById: jest.fn().mockResolvedValue({
        id: 45,
        paymentStatus: 0
      })
    };
    const idempotencyRepository = {
      findByScopeAndKey: jest.fn().mockResolvedValue(null),
      saveRecord: jest.fn()
    };
    const rabbitmqPublisher = {
      publishMessage: jest.fn(),
      isPublished: jest.fn()
    };

    const handler = new CreateBookingHandler(
      bookingRepository as any,
      flightClient as any,
      passengerClient as any,
      paymentClient as any,
      idempotencyRepository as any,
      rabbitmqPublisher as any
    );

    await expect(
      handler.execute(
        new CreateBooking({
          currentUserId: 42,
          flightId: 7,
          description: 'Window seat',
          seatNumber: '1A',
          idempotencyKey: 'booking-dup'
        })
      )
    ).rejects.toBeInstanceOf(ConflictException);

    expect(flightClient.reserveSeat).not.toHaveBeenCalled();
    expect(paymentClient.createPaymentIntent).not.toHaveBeenCalled();
  });
});
