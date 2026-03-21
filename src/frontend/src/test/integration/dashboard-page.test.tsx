import { screen, within } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { DashboardPage } from '@pages/dashboard/DashboardPage';
import { server } from '@/test/msw/server';
import { renderWithRoute } from '@/test/utils';
import { airports, makeBooking, makeFlight, setAuthenticatedUser } from '@/test/frontend.fixtures';
import { BookingStatus, FlightStatus, Role } from '@/types/enums';

describe('dashboard page', () => {
  it('keeps query strip in Ready state when totals are zero', async () => {
    setAuthenticatedUser({ role: Role.ADMIN });
    let includePaymentSummaryParam: string | null = null;

    server.use(
      http.get('/api/v1/airport/get-all', () => HttpResponse.json(airports)),
      http.get('/api/v1/user/get', () =>
        HttpResponse.json({
          result: [],
          total: 0
        })
      ),
      http.get('/api/v1/passenger/get-all', () =>
        HttpResponse.json({
          result: [],
          total: 0
        })
      ),
      http.get('/api/v1/flight/get-all', () =>
        HttpResponse.json({
          result: [],
          total: 0
        })
      ),
      http.get('/api/v1/booking/get-all', ({ request }) => {
        includePaymentSummaryParam = new URL(request.url).searchParams.get('includePaymentSummary');
        return HttpResponse.json({
          result: [],
          total: 0
        });
      })
    );

    renderWithRoute(<DashboardPage />, { route: '/dashboard', path: '/dashboard' });

    expect(await screen.findByText('Identity · Ready')).toBeInTheDocument();
    expect(screen.getByText('Flights · Ready')).toBeInTheDocument();
    expect(screen.getByText('Bookings · Ready')).toBeInTheDocument();
    expect(screen.getByText('Passengers · Ready')).toBeInTheDocument();
    expect(screen.getByText('Analytics · Ready')).toBeInTheDocument();
    expect(includePaymentSummaryParam).toBe('false');

    const metricsGrid = screen.getByTestId('dashboard-metrics-grid');
    expect(within(metricsGrid).getAllByTestId(/dashboard-metric-/)).toHaveLength(5);
  });

  it('keeps same-day upcoming flights visible by using departureDate fallback', async () => {
    setAuthenticatedUser({ role: Role.ADMIN });

    const now = Date.now();
    const sameDayDateOnly = new Date(now).toISOString().slice(0, 10);
    const flightWithDateOnly = makeFlight({
      id: 777,
      flightNumber: 'VN777',
      flightStatus: FlightStatus.SCHEDULED,
      flightDate: sameDayDateOnly,
      departureDate: new Date(now + 2 * 60 * 60 * 1000).toISOString(),
      arriveDate: new Date(now + 4 * 60 * 60 * 1000).toISOString()
    });

    server.use(
      http.get('/api/v1/airport/get-all', () => HttpResponse.json(airports)),
      http.get('/api/v1/user/get', () =>
        HttpResponse.json({
          result: [],
          total: 0
        })
      ),
      http.get('/api/v1/passenger/get-all', () =>
        HttpResponse.json({
          result: [],
          total: 0
        })
      ),
      http.get('/api/v1/flight/get-all', () =>
        HttpResponse.json({
          result: [flightWithDateOnly],
          total: 1
        })
      ),
      http.get('/api/v1/booking/get-all', () =>
        HttpResponse.json({
          result: [],
          total: 0
        })
      )
    );

    renderWithRoute(<DashboardPage />, { route: '/dashboard', path: '/dashboard' });

    expect(await screen.findByText('VN777')).toBeInTheDocument();
  });

  it('renders compact revenue metric using K/M/B unit', async () => {
    setAuthenticatedUser({ role: Role.ADMIN });

    server.use(
      http.get('/api/v1/airport/get-all', () => HttpResponse.json(airports)),
      http.get('/api/v1/user/get', () =>
        HttpResponse.json({
          result: [],
          total: 0
        })
      ),
      http.get('/api/v1/passenger/get-all', () =>
        HttpResponse.json({
          result: [],
          total: 0
        })
      ),
      http.get('/api/v1/flight/get-all', () =>
        HttpResponse.json({
          result: [],
          total: 0
        })
      ),
      http.get('/api/v1/booking/get-all', () =>
        HttpResponse.json({
          result: [
            makeBooking({ id: 1, price: 15_250_000, bookingStatus: BookingStatus.CONFIRMED }),
            makeBooking({ id: 2, price: 0, bookingStatus: BookingStatus.CANCELED })
          ],
          total: 2
        })
      )
    );

    renderWithRoute(<DashboardPage />, { route: '/dashboard', path: '/dashboard' });

    const revenueCard = await screen.findByTestId('dashboard-metric-revenue');
    expect(await within(revenueCard).findByText(/M đ$/)).toBeInTheDocument();
  });
});
