# 2. Protocol Choice

## Communication Protocols

| Protocol | Transport | Primary Usage |
|----------|-----------|---------------|
| **HTTP/REST** | TCP + JSON | Client-facing APIs and synchronous service-to-service orchestration |
| **AMQP 0-9-1** | TCP via RabbitMQ | Domain events, compensation, confirmation, expiry, refund workflows |
| **OTLP/gRPC** | TCP + gRPC | Traces, metrics, and logs export to the observability stack |

## Current Communication Style

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           SYNCHRONOUS HTTP/REST                            │
│                                                                              │
│ Frontend ──► Identity  (login, user context)                                 │
│ Frontend ──► Flight    (search flights, list seats)                          │
│ Frontend ──► Booking   (create checkout, list/detail/cancel booking)         │
│ Frontend ──► Payment   (confirm payment, fetch payment status)               │
│ Booking  ──► Flight    (getFlightById, reserveSeat)                          │
│ Booking  ──► Passenger (getPassengerByUserId)                                │
│ Booking  ──► Payment   (create payment intent, get payment by id)            │
│ JwtGuard ──► Identity  (validate access token)                               │
│                                                                              │
│                           ASYNCHRONOUS AMQP/RabbitMQ                         │
│                                                                              │
│ Identity ──publish──► UserCreated / UserUpdated ──consume──► Passenger       │
│ Booking  ──publish──► SeatReleaseRequested ──consume──► Flight               │
│ Payment  ──publish──► PaymentSucceeded ──consume──► Booking                  │
│ Payment  ──publish──► PaymentExpired   ──consume──► Booking                  │
│ Booking  ──publish──► PaymentRefundRequested ──consume──► Payment            │
│ Booking  ──publish──► BookingCreated (only after paid confirmation)          │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Why This Mix

- `HTTP/REST` remains the right fit where the caller needs an immediate answer: creating a checkout, reserving a seat, showing payment status, or canceling a booking.
- `AMQP` is now used for the cross-service state transitions that must remain decoupled: payment success, payment expiry, refund execution, and seat release compensation.
- The system keeps a microservice shape: `booking` owns reservation state, `flight` owns sellable inventory, `payment` owns money state, and events connect the long-running workflow.

## Envelope and Idempotency

- RabbitMQ publishers for `booking`, `flight`, and `payment` now run with the shared message envelope enabled.
- Envelope fields `messageId`, `traceId`, and `idempotencyKey` are used together with per-service processed-message tables to deduplicate consumer work.
- Client-originated idempotency is enforced on:
  - `POST /api/v1/booking/create`
  - `PATCH /api/v1/payment/confirm/:id`
