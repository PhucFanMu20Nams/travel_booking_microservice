import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateBookingPage } from '@pages/bookings/CreateBookingPage';
import { server } from '@/test/msw/server';
import { renderWithRoute } from '@/test/utils';
import {
  aircrafts,
  airports,
  makeBooking,
  makeBookingCheckout,
  makeFlight,
  makePassenger,
  makePayment,
  makeSeat,
  setAuthenticatedUser
} from '@/test/frontend.fixtures';
import { BookingStatus, FlightStatus, PaymentStatus } from '@/types/enums';

const mockCreateBookingDependencies = ({
  flights,
  selectedFlight,
  seats = [makeSeat()],
  passenger = makePassenger()
}: {
  flights: ReturnType<typeof makeFlight>[];
  selectedFlight: ReturnType<typeof makeFlight>;
  seats?: ReturnType<typeof makeSeat>[];
  passenger?: ReturnType<typeof makePassenger>;
}) => {
  server.use(
    http.get('/api/v1/airport/get-all', () => HttpResponse.json(airports)),
    http.get('/api/v1/aircraft/get-all', () => HttpResponse.json(aircrafts)),
    http.get('/api/v1/flight/get-all', () =>
      HttpResponse.json({
        result: flights,
        total: flights.length
      })
    ),
    http.get('/api/v1/flight/get-by-id', ({ request }) => {
      const id = Number(new URL(request.url).searchParams.get('id'));
      const flight = [selectedFlight, ...flights].find((entry) => entry.id === id) || selectedFlight;
      return HttpResponse.json(flight);
    }),
    http.get('/api/v1/seat/get-available-seats', () => HttpResponse.json(seats)),
    http.get('/api/v1/passenger/get-by-user-id', () => HttpResponse.json(passenger)),
    http.get('/api/v1/wallet/me', () =>
      HttpResponse.json({
        userId: 42,
        balance: 10000000,
        currency: 'VND',
        createdAt: '2099-03-10T07:00:00.000Z',
        updatedAt: '2099-03-10T07:00:00.000Z'
      })
    ),
    http.get('/api/v1/booking/get-all', () =>
      HttpResponse.json({
        result: [makeBooking()],
        total: 1
      })
    )
  );
};

describe('create booking flow', () => {
  beforeEach(() => {
    setAuthenticatedUser();
  });

  it('shows a warning and blocks the deep link flow for invalid flights', async () => {
    const invalidFlight = makeFlight({
      id: 2,
      flightNumber: 'VN000',
      flightStatus: FlightStatus.CANCELED
    });
    const validFlight = makeFlight({
      id: 1,
      flightNumber: 'VN123',
      flightStatus: FlightStatus.SCHEDULED
    });

    mockCreateBookingDependencies({
      flights: [validFlight, invalidFlight],
      selectedFlight: invalidFlight
    });

    renderWithRoute(<CreateBookingPage />, {
      route: '/bookings/create?flightId=2',
      path: '/bookings/create'
    });

    expect(await screen.findByText('Chuyến bay từ deep link hiện không còn mở đặt vé')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Chọn chuyến bay' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Chọn ghế' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Không thể đặt' })).toBeDisabled();
  });

  it(
    'creates a pending checkout, then syncs booking once payment becomes succeeded',
    async () => {
    const user = userEvent.setup();
    const selectedFlight = makeFlight({ id: 1, flightNumber: 'VN321' });
    const checkout = makeBookingCheckout(
      {},
      {
        id: 99,
        flightId: 1,
        flightNumber: 'VN321',
        bookingStatus: 0,
        paymentId: 91
      },
      {
        id: 91,
        bookingId: 99,
        paymentStatus: 0
      }
    );
    const confirmedPayment = makePayment({
      id: 91,
      bookingId: 99
    });
    const confirmedBooking = makeBooking({
      id: 99,
      flightId: 1,
      flightNumber: 'VN321'
    });
    const submittedPayloads: unknown[] = [];
    let paymentAfterWalletPay = checkout.payment;

    mockCreateBookingDependencies({
      flights: [selectedFlight],
      selectedFlight,
      seats: [makeSeat({ id: 10, flightId: 1, seatNumber: '1A' })]
    });

    server.use(
      http.post('/api/v1/booking/create', async ({ request }) => {
        submittedPayloads.push(await request.json());
        return HttpResponse.json(checkout);
      }),
      http.post('/api/v1/wallet/pay-booking', () => {
        paymentAfterWalletPay = confirmedPayment;
        return HttpResponse.json({
          payment: confirmedPayment,
          wallet: {
            userId: 42,
            balance: 7375000,
            currency: 'VND',
            createdAt: '2099-03-10T07:00:00.000Z',
            updatedAt: '2099-03-10T07:01:00.000Z'
          }
        });
      }),
      http.get('/api/v1/payment/get-by-id', () => HttpResponse.json(paymentAfterWalletPay)),
      http.get('/api/v1/booking/get-by-id', () => HttpResponse.json(confirmedBooking))
    );

    renderWithRoute(<CreateBookingPage />, {
      route: '/bookings/create',
      path: '/bookings/create'
    });

    await user.click(await screen.findByRole('button', { name: 'Chọn chuyến' }));
    await user.click(await screen.findByRole('button', { name: '1A' }));
    await user.click(screen.getByRole('button', { name: 'Tiếp tục review' }));
    await user.click(await screen.findByRole('button', { name: 'Tiếp tục thanh toán ví' }));

    await waitFor(() => {
      expect(submittedPayloads).toEqual([
        {
          flightId: 1,
          description: 'N/A',
          seatNumber: '1A'
        }
      ]);
    });

    expect(await screen.findByText('Locked total')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Thanh toán bằng ví' }));

    expect(await screen.findByText('Booking #99')).toBeInTheDocument();
    },
    10000
  );

  it('hydrates payment step when opening with bookingId deep-link', async () => {
    const selectedFlight = makeFlight({ id: 1, flightNumber: 'VN678' });
    const pendingBooking = makeBooking({
      id: 55,
      flightId: 1,
      flightNumber: 'VN678',
      bookingStatus: BookingStatus.PENDING_PAYMENT,
      paymentId: 500,
      paymentSummary: null
    });
    const pendingPayment = makePayment({
      id: 500,
      bookingId: 55,
      paymentStatus: PaymentStatus.PENDING,
      completedAt: null,
      paymentCode: 'TBK-55',
      transferInstruction: {
        bankName: 'Vietcombank',
        accountName: 'TRAVEL BOOKING COMPANY',
        accountNumber: '1029384756',
        amount: 2625000,
        currency: 'VND',
        content: 'TBK-55',
        expiresAt: '2099-03-10T07:15:00.000Z'
      }
    });

    mockCreateBookingDependencies({
      flights: [selectedFlight],
      selectedFlight,
      seats: [makeSeat({ id: 10, flightId: 1, seatNumber: '1A' })]
    });

    server.use(
      http.get('/api/v1/booking/get-by-id', () => HttpResponse.json(pendingBooking)),
      http.get('/api/v1/payment/get-by-id', () => HttpResponse.json(pendingPayment))
    );

    renderWithRoute(<CreateBookingPage />, {
      route: '/bookings/create?bookingId=55',
      path: '/bookings/create'
    });

    expect(await screen.findByText('Đang nạp tiền cho booking #55')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Thanh toán bằng ví' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Chọn chuyến bay' })).not.toBeInTheDocument();
  });

  it('shows warning and blocks payment deep-link when booking is not pending payment', async () => {
    const selectedFlight = makeFlight({ id: 1, flightNumber: 'VN679' });
    const confirmedBooking = makeBooking({
      id: 56,
      flightId: 1,
      flightNumber: 'VN679',
      bookingStatus: BookingStatus.CONFIRMED,
      paymentId: 501
    });

    mockCreateBookingDependencies({
      flights: [selectedFlight],
      selectedFlight,
      seats: [makeSeat({ id: 11, flightId: 1, seatNumber: '1A' })]
    });

    server.use(http.get('/api/v1/booking/get-by-id', () => HttpResponse.json(confirmedBooking)));

    renderWithRoute(<CreateBookingPage />, {
      route: '/bookings/create?bookingId=56',
      path: '/bookings/create'
    });

    expect(await screen.findByText('Booking #56 không ở trạng thái chờ thanh toán')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Thanh toán bằng ví' })).not.toBeInTheDocument();
  });
});
