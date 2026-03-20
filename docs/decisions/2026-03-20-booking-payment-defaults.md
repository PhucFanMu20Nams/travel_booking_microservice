# Decision Log: Booking Payment Defaults

Date: 2026-03-20

## Chosen Defaults

- Payment remains a dedicated microservice, not a booking module
- Currency defaults to `VND`
- Payment hold window is `15 minutes`
- Seat-class price multipliers:
  - Economy `1.0`
  - Business `1.75`
  - First Class `2.5`
- One active booking per user per flight
- Automatic async full refund for paid post-rollout cancellations
- Legacy bookings keep `paymentId = null` and are not backfilled with synthetic payments

## Why

These defaults keep the codebase microservice-first, make the checkout realistic enough for testing and demos, and reduce accidental double booking or silent free confirmations without introducing a real external PSP yet.
