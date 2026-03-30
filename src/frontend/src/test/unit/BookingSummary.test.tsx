import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BookingSummary } from '@components/booking/BookingSummary';
import { airports, makeFlight, makePassenger, makeSeat } from '@/test/frontend.fixtures';
import { formatCurrency } from '@utils/format';

const airportsMap = Object.fromEntries(airports.map((airport) => [airport.id, airport]));
const toCurrencyRegex = (amount: number, currency = 'VND') =>
  new RegExp(formatCurrency(amount, currency).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'));

describe('BookingSummary', () => {
  it('shows base fare and auto-assign copy when no seat is selected', () => {
    const flight = makeFlight({ price: 1500000 });

    render(<BookingSummary flight={flight} passenger={makePassenger()} airportsMap={airportsMap} />);

    expect(screen.getByText('Base fare')).toBeInTheDocument();
    expect(screen.getByText(toCurrencyRegex(flight.price))).toBeInTheDocument();
    expect(screen.getByText('Final total locks after seat assignment.')).toBeInTheDocument();
    expect(screen.getByText('Auto-assign Economy')).toBeInTheDocument();
    expect(screen.getByText('Business and First Class require explicit selection.')).toBeInTheDocument();
  });

  it('shows the selected premium fare without the no-seat helper copy', () => {
    const flight = makeFlight({ price: 1500000 });
    const selectedSeat = makeSeat({
      seatNumber: '1A',
      price: 2625000
    });

    render(
      <BookingSummary
        flight={flight}
        selectedSeat={selectedSeat}
        passenger={makePassenger()}
        airportsMap={airportsMap}
      />
    );

    expect(screen.getByText('Selected fare')).toBeInTheDocument();
    expect(screen.getByText(toCurrencyRegex(selectedSeat.price, selectedSeat.currency))).toBeInTheDocument();
    expect(screen.getByText('Exact seat price shown before checkout lock.')).toBeInTheDocument();
    expect(screen.getByText('1A · Business / Window')).toBeInTheDocument();
    expect(screen.queryByText('Auto-assign Economy')).not.toBeInTheDocument();
    expect(screen.queryByText('Business and First Class require explicit selection.')).not.toBeInTheDocument();
  });
});
