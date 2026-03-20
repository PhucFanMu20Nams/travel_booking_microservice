# 7. Reliability & Delivery Guarantees

## What Improved

| Mechanism | Current State |
|-----------|---------------|
| **HTTP Idempotency** | `booking/create` and `payment/confirm` persist request hash + response snapshots |
| **Consumer Inbox Deduplication** | `booking`, `payment`, and `flight` persist processed message keys |
| **Seat Reservation Race Protection** | flight keeps atomic reserve logic and now still releases via explicit compensation |
| **Payment Expiry Automation** | `payment` scheduler expires stale intents and publishes `PaymentExpired` |
| **Compensating Actions** | seat release on booking setup failure, payment expiry, and cancellation; refund request on paid cancellation |
| **Problem Details Metadata** | RFC 7807 responses now preserve extra fields such as duplicate-booking references |

## Current Delivery Guarantees

| Aspect | State |
|--------|-------|
| **RabbitMQ publish** | Durable exchanges + persistent messages. Still no publisher confirms. |
| **RabbitMQ consume** | Manual ACK with DLQ routing and consumer-side dedupe. |
| **Request retries** | Safe on protected endpoints because idempotency records return the stored response. |
| **Booking confirmation** | Event-driven: only `PaymentSucceeded` can move a booking to `CONFIRMED`. |
| **Refund handling** | Asynchronous and replay-safe through `PaymentRefundRequested`. |

## Remaining Gaps

1. **No transactional outbox**
   Database write and event publish are still not atomic.

2. **No publisher confirm mode**
   RabbitMQ publishers still do not wait for broker confirmation.

3. **No circuit breaker**
   `booking -> flight/passenger/payment` synchronous HTTP calls still rely on timeouts/retries only.

4. **No full payment reconciliation**
   The fake gateway is deterministic and useful for development, but it is not yet a real PSP integration.

5. **No dedicated load/performance suite**
   Functional and unit coverage improved, but sustained throughput tests are still missing.

---

# 8. Summary Table

| Dimension | Current State |
|-----------|---------------|
| **Requirements** | Flight booking platform with 5 microservices: Identity, Flight, Passenger, Booking, Payment |
| **Protocol** | REST/HTTP for immediate orchestration, RabbitMQ for async workflow transitions, OTLP/gRPC for observability |
| **Architecture** | Microservices + Event-Driven + CQRS + Vertical Slice + Repository Pattern |
| **Booking Flow** | `reserve seat -> create PENDING_PAYMENT booking -> create payment intent -> confirm payment -> event-driven CONFIRMED` |
| **Pricing** | Base fare on flight, seat-aware computed fare returned by flight and locked by booking |
| **Reliability** | HTTP idempotency + inbox dedupe + expiry scheduler + seat compensation; still missing outbox and publisher confirms |
