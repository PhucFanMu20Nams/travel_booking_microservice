# Technical Breakdown

## Service Boundaries

- `flight`
  - owns flights, seats, seat reservation, seat-aware sellable fare
- `booking`
  - owns booking rows, active-booking policy, seat hold lifecycle
- `payment`
  - owns payment intents, attempts, expiry, refunds

## Key APIs

- `POST /api/v1/booking/create`
  - now returns `BookingCheckoutDto`
- `PATCH /api/v1/payment/confirm/:id`
  - confirms payment with `Idempotency-Key`
- `GET /api/v1/payment/get-by-id`
  - returns payment state for UI and booking enrichment

## Key Events

- `PaymentSucceeded`
- `PaymentExpired`
- `PaymentRefundRequested`
- `PaymentRefunded`
- `SeatReleaseRequested`
- `BookingCreated`

## Persistence Changes

- `booking`
  - new fields: `seatClass`, `currency`, `paymentId`, `paymentExpiresAt`, `confirmedAt`, `expiredAt`
  - new tables: `booking_idempotency_record`, `booking_processed_message`
- `payment`
  - new tables: `payment_intent`, `payment_attempt`, `refund`, `payment_idempotency_record`, `payment_processed_message`
- `flight`
  - new table: `flight_processed_message`
