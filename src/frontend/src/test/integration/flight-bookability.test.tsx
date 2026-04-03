import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlightDetailPage } from '@pages/flights/FlightDetailPage';
import { FlightListPage } from '@pages/flights/FlightListPage';
import { server } from '@/test/msw/server';
import { renderWithRoute } from '@/test/utils';
import { aircrafts, airports, makeFlight, makeSeat, setAuthenticatedUser } from '@/test/frontend.fixtures';
import { FlightStatus } from '@/types/enums';

const enableDesktopBreakpoints = () => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => {
      const normalized = query.replace(/\s+/g, '');
      const matches = normalized.includes('(min-width:992px)');

      return {
        matches,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      };
    })
  });
};

describe('flight booking availability surfaces', () => {
  beforeEach(() => {
    setAuthenticatedUser();
  });

  it('disables the booking CTA in the flight list for invalid flights', async () => {
    const validFlight = makeFlight({ id: 1, flightNumber: 'VN123', flightStatus: FlightStatus.SCHEDULED });
    const invalidFlight = makeFlight({ id: 2, flightNumber: 'VN404', flightStatus: FlightStatus.CANCELED });

    server.use(
      http.get('/api/v1/airport/get-all', () => HttpResponse.json(airports)),
      http.get('/api/v1/aircraft/get-all', () => HttpResponse.json(aircrafts)),
      http.get('/api/v1/flight/get-all', () =>
        HttpResponse.json({
          result: [validFlight, invalidFlight],
          total: 2
        })
      )
    );

    enableDesktopBreakpoints();
    renderWithRoute(<FlightListPage />, { route: '/flights', path: '/flights' });

    await screen.findByText('VN404');
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByText('Base fare').length).toBeGreaterThan(0);

    const validFlightRow = screen.getByText('VN123').closest('tr');
    const invalidFlightRow = screen.getByText('VN404').closest('tr');

    expect(validFlightRow).not.toBeNull();
    expect(invalidFlightRow).not.toBeNull();
    expect(within(validFlightRow as HTMLElement).getByRole('button', { name: 'shopping-cart' })).toBeEnabled();
    expect(within(invalidFlightRow as HTMLElement).getByRole('button', { name: 'shopping-cart' })).toBeDisabled();
  });

  it('maps summary column sorting to orderBy=flightDate', async () => {
    const user = userEvent.setup();
    const validFlight = makeFlight({ id: 1, flightNumber: 'VN123', flightStatus: FlightStatus.SCHEDULED });
    const requestedOrderBy: Array<string | null> = [];

    server.use(
      http.get('/api/v1/airport/get-all', () => HttpResponse.json(airports)),
      http.get('/api/v1/aircraft/get-all', () => HttpResponse.json(aircrafts)),
      http.get('/api/v1/flight/get-all', ({ request }) => {
        requestedOrderBy.push(new URL(request.url).searchParams.get('orderBy'));
        return HttpResponse.json({
          result: [validFlight],
          total: 1
        });
      })
    );

    enableDesktopBreakpoints();
    renderWithRoute(<FlightListPage />, { route: '/flights', path: '/flights' });

    await screen.findByText('VN123');

    await user.click(screen.getAllByText('Base fare')[0].closest('th') as HTMLElement);
    await waitFor(() => expect(requestedOrderBy).toContain('price'));

    await user.click(screen.getAllByText('Flight')[0].closest('th') as HTMLElement);
    await waitFor(() => expect(requestedOrderBy.at(-1)).toBe('flightDate'));
    expect(requestedOrderBy).not.toContain('summary');
  });

  it('disables the booking CTA in the flight detail page for invalid flights', async () => {
    const invalidFlight = makeFlight({ id: 9, flightNumber: 'VN909', flightStatus: FlightStatus.COMPLETED });

    server.use(
      http.get('/api/v1/airport/get-all', () => HttpResponse.json(airports)),
      http.get('/api/v1/aircraft/get-all', () => HttpResponse.json(aircrafts)),
      http.get('/api/v1/flight/get-by-id', () => HttpResponse.json(invalidFlight)),
      http.get('/api/v1/seat/get-available-seats', () => HttpResponse.json([makeSeat({ flightId: 9 })]))
    );

    renderWithRoute(<FlightDetailPage />, { route: '/flights/9', path: '/flights/:id' });

    expect(await screen.findByText('VN909')).toBeInTheDocument();
    expect(screen.getByText('Base fare')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Đặt vé' })).toBeDisabled();
  });
});
