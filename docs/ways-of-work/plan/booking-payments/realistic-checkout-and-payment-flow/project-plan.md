# Project Plan

## Workstreams

| Workstream | Outcome |
|-----------|---------|
| Shared contracts | Stable DTOs/events for checkout, payment, refund, expiry |
| Payment service | New bounded context with REST + RabbitMQ + Postgres |
| Booking hardening | Pending state, duplicate protection, idempotency, event consumers |
| Flight pricing | Seat-aware price returned to booking/frontend |
| Frontend checkout | 5-step UX with payment confirmation and countdown |
| Quality/docs | Tests, CI jobs, architecture and QA docs |

## Done Criteria

- Booking is no longer confirmed at create time.
- No route skips payment.
- Seat price differs by class and is locked into the booking.
- Canceling a paid booking creates a refund request.
- Duplicate submit and event replay are safely handled.
