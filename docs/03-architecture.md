# 3. High-level Architecture

## Architecture Type

**Microservices Architecture** with **event-driven integration**, **CQRS**, and **vertical slices** inside each service.

## Service Topology

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                         CLIENT                                          │
│                                React/Vite frontend via nginx                            │
└───────────────────────────────────────┬─────────────────────────────────────────────────┘
                                        │ HTTP
┌───────────────────────────────────────▼─────────────────────────────────────────────────┐
│                                      SERVICES                                            │
│                                                                                         │
│ Identity  :3333  auth, users, JWT validation                                            │
│ Flight    :3344  flights, aircraft, airports, seats, seat reservation, seat pricing     │
│ Passenger :3355  passenger profiles synced from identity events                          │
│ Booking   :3366  checkout creation, reservation state, duplicate policy, cancellation    │
│ Payment   :3377  payment intents, attempts, expiry, confirmation, refunds                │
└──────────────────────────────┬──────────────────────────────────────────────────────────┘
                               │ RabbitMQ fanout exchanges
┌──────────────────────────────▼──────────────────────────────────────────────────────────┐
│                                      MESSAGES                                           │
│ UserCreated / UserUpdated                                                               │
│ SeatReleaseRequested                                                                    │
│ PaymentSucceeded / PaymentFailed / PaymentExpired / PaymentRefunded                     │
│ PaymentRefundRequested                                                                  │
│ BookingCreated                                                                          │
└──────────────────────────────┬──────────────────────────────────────────────────────────┘
                               │ PostgreSQL logical databases
┌──────────────────────────────▼──────────────────────────────────────────────────────────┐
│                                       DATA                                               │
│ identity_db | flight_db | passenger_db | booking_db | payment_db                        │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

## Bounded Context Responsibilities

| Service | Owns | Does Not Own |
|---------|------|--------------|
| **Identity** | authentication, token validation, users | passenger profiles, bookings, payments |
| **Flight** | flights, seats, seat class, sellable seat fare | bookings, payments |
| **Passenger** | passenger profile materialization | authentication, booking state |
| **Booking** | booking lifecycle, duplicate policy, seat hold lifecycle | payment success/failure execution |
| **Payment** | payment intents, attempts, expiry, refunds | flight inventory, booking selection |

## New Realistic Checkout Lifecycle

1. Frontend asks `booking` to create checkout.
2. `booking` validates passenger + flight, reserves the seat in `flight`, creates a `PENDING_PAYMENT` booking, and asks `payment` to create a payment intent.
3. Frontend confirms payment directly with `payment`.
4. `payment` publishes `PaymentSucceeded` or `PaymentExpired`.
5. `booking` consumes those events and moves the booking to `CONFIRMED` or `EXPIRED`.
6. `flight` only releases inventory when `booking` publishes `SeatReleaseRequested`.

## Internal Architectural Patterns

| Pattern | Current Usage |
|---------|---------------|
| **CQRS** | `CommandHandler` and `QueryHandler` per feature in booking, payment, flight |
| **Vertical Slice** | Each feature folder contains controller + command/query + handler |
| **Repository Pattern** | Interface-based repositories with DI in booking, flight, payment |
| **Shared Kernel** | `building-blocks/` for contracts, middleware, validation, telemetry, auth |
| **Inbox Deduplication** | `booking_processed_message`, `payment_processed_message`, `flight_processed_message` |
| **Request Idempotency** | `booking_idempotency_record`, `payment_idempotency_record` |
