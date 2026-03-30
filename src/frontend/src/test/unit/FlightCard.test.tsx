import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FlightCard } from '@components/booking/FlightCard';
import { airports, makeFlight } from '@/test/frontend.fixtures';
import { formatCurrency } from '@utils/format';

const airportsMap = Object.fromEntries(airports.map((airport) => [airport.id, airport]));
const toCurrencyRegex = (amount: number, currency = 'VND') =>
  new RegExp(formatCurrency(amount, currency).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'));

describe('FlightCard', () => {
  it('renders base fare semantics on flight-level pricing surfaces', () => {
    const flight = makeFlight({ price: 1750000 });

    render(<FlightCard flight={flight} airportsMap={airportsMap} onSelect={vi.fn()} />);

    expect(screen.getByText('Base fare')).toBeInTheDocument();
    expect(screen.getByText(toCurrencyRegex(flight.price))).toBeInTheDocument();
    expect(screen.getByText('Final total locks after seat selection')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Chọn chuyến này' })).toBeInTheDocument();
  });
});
