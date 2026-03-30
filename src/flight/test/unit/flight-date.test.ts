import { deriveFlightDateFromDeparture, getVietnamBusinessDayStart } from '@/flight/utils/flight-date';

describe('flight-date helpers', () => {
  it('returns the canonical Vietnam business-day start for arbitrary instants', () => {
    expect(getVietnamBusinessDayStart(new Date('2026-03-25T05:30:00.000Z')).toISOString()).toBe(
      '2026-03-24T17:00:00.000Z'
    );
  });

  it('keeps the exact 00:00 Asia/Ho_Chi_Minh boundary visible', () => {
    expect(getVietnamBusinessDayStart(new Date('2026-03-24T17:00:00.000Z')).toISOString()).toBe(
      '2026-03-24T17:00:00.000Z'
    );
  });

  it('derives flightDate from departureDate using the same Vietnam business-day rule', () => {
    const departureDate = new Date('2026-03-25T12:45:00.000Z');

    expect(deriveFlightDateFromDeparture(departureDate).toISOString()).toBe(
      getVietnamBusinessDayStart(departureDate).toISOString()
    );
  });
});
