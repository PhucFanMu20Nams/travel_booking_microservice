# Realistic Checkout and Payment Flow

## Goal

Replace the old "click once and get confirmed immediately" booking behavior with a realistic airline-style checkout:

1. User selects flight and seat.
2. System creates a `PENDING_PAYMENT` booking and locks the seat-aware price.
3. `payment` service owns confirmation, expiry, attempts, and refunds.
4. Booking is only `CONFIRMED` after `PaymentSucceeded`.

## Scope

- New `payment` microservice
- seat-aware pricing in `flight`
- booking lifecycle hardening in `booking`
- 5-step frontend checkout
- idempotency, duplicate protection, refund flow, docs, tests, CI

## Default Business Rules

- Currency: `VND`
- Payment window: `15 minutes`
- Class multipliers:
  - Economy `1.0`
  - Business `1.75`
  - First Class `2.5`
- Duplicate policy: one active booking per user per flight
- Refund policy: async full refund for post-rollout paid bookings
