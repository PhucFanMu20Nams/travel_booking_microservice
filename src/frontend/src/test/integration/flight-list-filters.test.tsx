import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlightListPage } from '@pages/flights/FlightListPage';
import { server } from '@/test/msw/server';
import { renderWithRoute } from '@/test/utils';
import { aircrafts, makeFlight, setAuthenticatedUser } from '@/test/frontend.fixtures';
import { AirportDto } from '@/types/airport.types';
import { FlightStatus, Role } from '@/types/enums';

const routeAirports: AirportDto[] = [
  {
    id: 1,
    code: 'SGN',
    name: 'Tan Son Nhat International Airport',
    address: 'Ho Chi Minh City',
    createdAt: '2099-01-01T00:00:00.000Z'
  },
  {
    id: 2,
    code: 'HAN',
    name: 'Noi Bai International Airport',
    address: 'Ha Noi',
    createdAt: '2099-01-01T00:00:00.000Z'
  },
  {
    id: 3,
    code: 'DAD',
    name: 'Da Nang International Airport',
    address: 'Da Nang',
    createdAt: '2099-01-01T00:00:00.000Z'
  }
];

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

const createDeferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((resolver) => {
    resolve = resolver;
  });

  return { promise, resolve };
};

const getVisibleDropdown = () =>
  Array.from(document.querySelectorAll('.ant-select-dropdown'))
    .filter((element) => !element.classList.contains('ant-select-dropdown-hidden'))
    .filter(
      (element) =>
        !element.classList.contains('ant-slide-up-leave') && (element as HTMLElement).style.pointerEvents !== 'none'
    )
    .at(-1) as HTMLElement | undefined;

const getFlightFilterBar = () => {
  const filterBar = screen.getByRole('button', { name: 'Clear filters' }).closest('.app-surface');
  expect(filterBar).toBeTruthy();
  return filterBar as HTMLElement;
};

const openSelect = async (index: number) => {
  const selectors = getFlightFilterBar().querySelectorAll('.ant-select-selector');
  const target = selectors[index] as HTMLElement | undefined;

  expect(target).toBeDefined();
  fireEvent.mouseDown(target as HTMLElement);

  await waitFor(() => {
    expect(getVisibleDropdown()).toBeDefined();
  });

  return getVisibleDropdown() as HTMLElement;
};

const getVisibleOption = (dropdown: HTMLElement, label: string) => {
  const option = dropdown.querySelector(`.ant-select-item-option[title="${label}"]`);
  expect(option).toBeTruthy();
  return option as HTMLElement;
};

const chooseSelectOption = async (
  index: number,
  label: string,
  user: ReturnType<typeof userEvent.setup>
) => {
  const dropdown = await openSelect(index);
  await user.click(getVisibleOption(dropdown, label));
};

describe('FlightListPage filters', () => {
  beforeEach(() => {
    setAuthenticatedUser();
    enableDesktopBreakpoints();
  });

  it('sends search, departure, arrival, and status as combined server-side filters', async () => {
    const user = userEvent.setup();
    const requestedParams: Array<Record<string, string>> = [];
    const filteredFlight = makeFlight({
      id: 9,
      flightNumber: 'VN789',
      departureAirportId: 2,
      arriveAirportId: 1,
      flightStatus: FlightStatus.DELAY
    });

    server.use(
      http.get('/api/v1/airport/get-all', () => HttpResponse.json(routeAirports)),
      http.get('/api/v1/aircraft/get-all', () => HttpResponse.json(aircrafts)),
      http.get('/api/v1/flight/get-all', ({ request }) => {
        requestedParams.push(Object.fromEntries(new URL(request.url).searchParams.entries()));
        return HttpResponse.json({
          result: [filteredFlight],
          total: 1
        });
      })
    );

    renderWithRoute(<FlightListPage />, { route: '/flights', path: '/flights' });

    expect(await screen.findByText('VN789')).toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText('Search by flight number'));
    await user.type(screen.getByPlaceholderText('Search by flight number'), 'VN789');

    await waitFor(() => {
      expect(requestedParams.at(-1)?.searchTerm).toBe('VN789');
    });

    await chooseSelectOption(0, 'HAN - Noi Bai International Airport', user);

    await waitFor(() => {
      expect(requestedParams.at(-1)?.departureAirportId).toBe('2');
      expect(requestedParams.at(-1)?.page).toBe('1');
      expect(requestedParams.at(-1)?.searchTerm).toBe('VN789');
    });

    const arrivalDropdown = await openSelect(1);
    expect(arrivalDropdown.querySelector('.ant-select-item-option[title="HAN - Noi Bai International Airport"]')).toBeNull();
    expect(arrivalDropdown.querySelector('.ant-select-item-option[title="SGN - Tan Son Nhat International Airport"]')).not.toBeNull();
    await user.click(getVisibleOption(arrivalDropdown, 'SGN - Tan Son Nhat International Airport'));

    await waitFor(() => {
      expect(requestedParams.at(-1)?.departureAirportId).toBe('2');
      expect(requestedParams.at(-1)?.arriveAirportId).toBe('1');
    });

    await chooseSelectOption(2, 'Delayed', user);

    await waitFor(() => {
      expect(requestedParams.at(-1)).toMatchObject({
        page: '1',
        orderBy: 'flightDate',
        order: 'ASC',
        searchTerm: 'VN789',
        departureAirportId: '2',
        arriveAirportId: '1',
        flightStatus: String(FlightStatus.DELAY)
      });
    });
  }, 15000);

  it('clears all filters and restores default pagination and sorting', async () => {
    const user = userEvent.setup();
    const requestedParams: Array<Record<string, string>> = [];
    const flights = Array.from({ length: 11 }, (_, index) =>
      makeFlight({
        id: index + 1,
        flightNumber: `VN${index + 100}`,
        departureAirportId: index % 2 === 0 ? 1 : 2,
        arriveAirportId: index % 2 === 0 ? 2 : 1
      })
    );

    server.use(
      http.get('/api/v1/airport/get-all', () => HttpResponse.json(routeAirports)),
      http.get('/api/v1/aircraft/get-all', () => HttpResponse.json(aircrafts)),
      http.get('/api/v1/flight/get-all', ({ request }) => {
        requestedParams.push(Object.fromEntries(new URL(request.url).searchParams.entries()));
        return HttpResponse.json({
          result: flights,
          total: flights.length
        });
      })
    );

    renderWithRoute(<FlightListPage />, { route: '/flights', path: '/flights' });

    expect(await screen.findByText('VN100')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Search by flight number'), 'VN1');
    await waitFor(() => {
      expect(requestedParams.at(-1)?.searchTerm).toBe('VN1');
    });

    await chooseSelectOption(0, 'HAN - Noi Bai International Airport', user);
    await waitFor(() => {
      expect(requestedParams.at(-1)?.departureAirportId).toBe('2');
    });

    await chooseSelectOption(2, 'Scheduled', user);
    await waitFor(() => {
      expect(requestedParams.at(-1)?.flightStatus).toBe(String(FlightStatus.SCHEDULED));
    });

    fireEvent.click(document.querySelector('.ant-pagination-item-2') as HTMLElement);
    await waitFor(() => {
      expect(requestedParams.at(-1)?.page).toBe('2');
    });

    await user.click(screen.getAllByText('Base fare')[0].closest('th') as HTMLElement);
    await waitFor(() => {
      expect(requestedParams.at(-1)?.orderBy).toBe('price');
    });

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    await waitFor(() => {
      expect(requestedParams.at(-1)).toMatchObject({
        page: '1',
        pageSize: '10',
        orderBy: 'flightDate',
        order: 'ASC'
      });
    });

    const latestParams = requestedParams.at(-1) || {};
    expect(latestParams.searchTerm).toBeUndefined();
    expect(latestParams.departureAirportId).toBeUndefined();
    expect(latestParams.arriveAirportId).toBeUndefined();
    expect(latestParams.flightStatus).toBeUndefined();
    expect(screen.getByPlaceholderText('Search by flight number')).toHaveValue('');
  }, 15000);

  it('keeps previous rows visible while an airport filter refetch is pending', async () => {
    const user = userEvent.setup();
    const pendingDepartureFilter = createDeferred();
    const initialFlights = [
      makeFlight({ id: 1, flightNumber: 'VN123', departureAirportId: 1, arriveAirportId: 2 }),
      makeFlight({ id: 2, flightNumber: 'VN456', departureAirportId: 3, arriveAirportId: 1 })
    ];

    server.use(
      http.get('/api/v1/airport/get-all', () => HttpResponse.json(routeAirports)),
      http.get('/api/v1/aircraft/get-all', () => HttpResponse.json(aircrafts)),
      http.get('/api/v1/flight/get-all', async ({ request }) => {
        const departureAirportId = new URL(request.url).searchParams.get('departureAirportId');

        if (departureAirportId === '2') {
          await pendingDepartureFilter.promise;
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

    renderWithRoute(<FlightListPage />, { route: '/flights', path: '/flights' });

    await screen.findByText('VN123');

    await chooseSelectOption(0, 'HAN - Noi Bai International Airport', user);

    expect(screen.getByText('VN123')).toBeInTheDocument();
    expect(screen.queryByText('No flights found')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(document.querySelector('.ant-spin-spinning')).not.toBeNull();
    });

    await act(async () => {
      pendingDepartureFilter.resolve();
    });

    await waitFor(() => {
      expect(screen.queryByText('VN123')).not.toBeInTheDocument();
    });
    expect(await screen.findByText('No flights found')).toBeInTheDocument();
  });

  it('keeps the admin create action visible while route filters are available', async () => {
    setAuthenticatedUser({ role: Role.ADMIN });

    server.use(
      http.get('/api/v1/airport/get-all', () => HttpResponse.json(routeAirports)),
      http.get('/api/v1/aircraft/get-all', () => HttpResponse.json(aircrafts)),
      http.get('/api/v1/flight/get-all', () =>
        HttpResponse.json({
          result: [makeFlight({ id: 5, flightNumber: 'VN505' })],
          total: 1
        })
      )
    );

    renderWithRoute(<FlightListPage />, { route: '/flights', path: '/flights' });

    expect(await screen.findByText('VN505')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create new/i })).toBeInTheDocument();
  });
});
