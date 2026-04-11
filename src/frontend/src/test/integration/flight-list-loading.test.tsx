import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlightListPage } from '@pages/flights/FlightListPage';
import { server } from '@/test/msw/server';
import { renderWithRoute } from '@/test/utils';
import { aircrafts, airports, makeFlight, setAuthenticatedUser } from '@/test/frontend.fixtures';

const mockResponsiveViewport = (desktop: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => {
      const normalized = query.replace(/\s+/g, '');
      const matches = normalized.includes('(min-width:992px)') ? desktop : false;

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

const createDeferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((resolver) => {
    resolve = resolver;
  });

  return { promise, resolve };
};

describe('FlightListPage loading behavior', () => {
  beforeEach(() => {
    setAuthenticatedUser();
  });

  it('keeps the desktop shell mounted and preserves previous rows while search refetch is pending', async () => {
    const user = userEvent.setup();
    const pendingSearch = createDeferred();
    const initialFlights = [
      makeFlight({ id: 1, flightNumber: 'VN123' }),
      makeFlight({ id: 2, flightNumber: 'VN456' })
    ];
    let requestCount = 0;

    server.use(
      http.get('/api/v1/airport/get-all', () => HttpResponse.json(airports)),
      http.get('/api/v1/aircraft/get-all', () => HttpResponse.json(aircrafts)),
      http.get('/api/v1/flight/get-all', async ({ request }) => {
        requestCount += 1;
        const searchTerm = new URL(request.url).searchParams.get('searchTerm') || '';

        if (searchTerm === 'ZZZ') {
          await pendingSearch.promise;
          return HttpResponse.json({
            result: [],
            total: 0
          });
        }

        return HttpResponse.json({
          result: initialFlights,
          total: initialFlights.length
        });
      })
    );

    mockResponsiveViewport(true);
    renderWithRoute(<FlightListPage />, { route: '/flights', path: '/flights' });

    expect(screen.getByRole('heading', { name: 'Flight list' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search by flight number')).toBeInTheDocument();

    await screen.findByText('VN123');
    expect(screen.getByRole('table')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Search by flight number'), 'ZZZ');

    await waitFor(() => expect(requestCount).toBe(2));
    expect(screen.getByRole('heading', { name: 'Flight list' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search by flight number')).toHaveValue('ZZZ');
    expect(screen.getByText('VN123')).toBeInTheDocument();
    expect(screen.queryByText('No flights found')).not.toBeInTheDocument();
    expect(document.querySelector('.ant-spin-spinning')).toBeInTheDocument();

    await act(async () => {
      pendingSearch.resolve();
    });

    await waitFor(() => expect(screen.queryByText('VN123')).not.toBeInTheDocument());
    expect(await screen.findByText('No flights found')).toBeInTheDocument();
  }, 10000);

  it('renders the shell immediately on mobile and keeps first-load placeholders inside the results area', async () => {
    const pendingInitialLoad = createDeferred();
    const mobileFlight = makeFlight({ id: 9, flightNumber: 'VN909' });

    server.use(
      http.get('/api/v1/airport/get-all', () => HttpResponse.json(airports)),
      http.get('/api/v1/aircraft/get-all', () => HttpResponse.json(aircrafts)),
      http.get('/api/v1/flight/get-all', async () => {
        await pendingInitialLoad.promise;
        return HttpResponse.json({
          result: [mobileFlight],
          total: 1
        });
      })
    );

    mockResponsiveViewport(false);
    renderWithRoute(<FlightListPage />, { route: '/flights', path: '/flights' });

    expect(screen.getByRole('heading', { name: 'Flight list' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search by flight number')).toBeInTheDocument();
    expect(screen.getByTestId('flight-results-placeholder')).toBeInTheDocument();
    expect(screen.queryByText('No flights found')).not.toBeInTheDocument();

    await act(async () => {
      pendingInitialLoad.resolve();
    });

    expect(await screen.findByText('VN909')).toBeInTheDocument();
    expect(screen.queryByTestId('flight-results-placeholder')).not.toBeInTheDocument();
  }, 10000);
});
