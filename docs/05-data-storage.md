# 5. Data Storage

## Databases and ORM

| Component | Technology | Notes |
|-----------|------------|-------|
| **RDBMS** | PostgreSQL 16 | Shared server, logical database per service |
| **ORM** | TypeORM | Each service keeps its own `data-source.ts` |
| **Schema Management** | TypeORM migrations | `POSTGRES_MIGRATIONS_RUN=true` in docker/dev |

## Core Models After Payment Hardening

### Flight

- `flight.price` remains the **base fare**.
- `seat.price` is **computed at runtime**, not persisted, using class multipliers:
  - `ECONOMY = 1.0`
  - `BUSINESS = 1.75`
  - `FIRST_CLASS = 2.5`

### Booking

`booking` now persists the locked commercial state required for a realistic checkout:

| Field | Purpose |
|-------|---------|
| `bookingStatus` | `PENDING_PAYMENT`, `CONFIRMED`, `EXPIRED`, `CANCELED` |
| `price` | locked seat-aware amount captured at reservation time |
| `currency` | `VND` |
| `seatClass` | class of the reserved seat |
| `paymentId` | payment reference owned by `payment` service |
| `paymentExpiresAt` | checkout/payment hold deadline |
| `confirmedAt` | timestamp when payment success confirmed the booking |
| `expiredAt` | timestamp when payment expiry released the booking |

Additional booking-side persistence:

- `booking_idempotency_record`
- `booking_processed_message`

### Payment

`payment` owns all finance-related persistence:

| Table | Purpose |
|-------|---------|
| `payment_intent` | current payment state for a booking |
| `payment_attempt` | each confirmation attempt and fake gateway scenario |
| `refund` | refund history per payment |
| `payment_idempotency_record` | HTTP idempotency for payment confirmation |
| `payment_processed_message` | inbox dedupe for refund events |

## Constraints and Indexes

- `booking.paymentId` is unique when present.
- `booking` has a partial unique index enforcing **one active booking per user per flight** where status is `PENDING_PAYMENT` or `CONFIRMED`.
- `payment_intent.bookingId` is unique to ensure one payment intent per booking.
- processed-message and idempotency tables have unique composite indexes on their dedupe keys.

## Legacy Data Handling

- Pre-rollout bookings keep `paymentId = null`.
- Old confirmed bookings are migrated to the new `bookingStatus = CONFIRMED`.
- No synthetic historical payments are generated for legacy rows.
