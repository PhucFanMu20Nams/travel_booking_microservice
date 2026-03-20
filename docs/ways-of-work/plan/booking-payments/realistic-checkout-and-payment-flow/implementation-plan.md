# Implementation Plan

## Delivered Change Sets

1. Shared contracts updated for booking/payment lifecycle and seat-aware fare.
2. New `payment` microservice added with intent creation, confirmation, expiry, refund consumer, and migrations.
3. `booking` changed to create `PENDING_PAYMENT` checkouts, call `payment`, consume payment events, and enforce idempotency plus duplicate protection.
4. `flight` now returns seat-aware prices and deduplicates seat-release events.
5. Frontend checkout now has 5 steps and a real payment step.
6. CI, compose, nginx, and documentation updated.

## Rollout Notes

- Existing bookings remain valid with `paymentId = null`.
- New bookings require the payment service to be reachable.
- `BookingCreated` is now published only after payment success, not at booking row creation time.
