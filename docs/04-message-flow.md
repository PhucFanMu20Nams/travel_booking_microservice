# 4. Message Flow

## Scenario: "User Creates a Booking and Pays Successfully"

```
Frontend        Booking         Flight         Passenger        Payment        RabbitMQ
   │               │               │               │               │               │
   │ POST /booking/create          │               │               │               │
   │──────────────►│               │               │               │               │
   │               │ GET flight ──►│               │               │               │
   │               │ GET passenger ───────────────►│               │               │
   │               │ reserve seat ─►│              │               │               │
   │               │ create booking(PENDING_PAYMENT, locked fare)  │               │
   │               │ create-intent ───────────────────────────────►│               │
   │ ◄─────────────│ 201 BookingCheckoutDto                        │               │
   │               │               │               │               │               │
   │ PATCH /payment/confirm/:id ─────────────────────────────────►│               │
   │               │               │               │               │ create attempt │
   │               │               │               │               │ mark SUCCEEDED │
   │               │               │               │               │ publish PaymentSucceeded ─────►│
   │               │ consume PaymentSucceeded ◄──────────────────────────────────────────────────────│
   │               │ mark booking CONFIRMED                                                     │
   │               │ publish BookingCreated ────────────────────────────────────────────────────►│
   │ GET /booking/get-by-id ◄────────────────────────────────────────────────────────────────────│
```

## Scenario: "Payment Expires"

```
Payment scheduler finds intent past expiresAt
   │
   ├─ mark payment EXPIRED
   └─ publish PaymentExpired ─────────────────────────────────────────────────────► RabbitMQ
                                                                      │
                                                                      ▼
                                                            Booking consumes event
                                                                      │
                                                                      ├─ mark booking EXPIRED
                                                                      └─ publish SeatReleaseRequested ───────► Flight
                                                                                                      │
                                                                                                      └─ release seat
```

## Scenario: "Confirmed Booking Is Canceled"

```
Frontend ──► Booking cancel
                │
                ├─ mark booking CANCELED
                ├─ publish SeatReleaseRequested ───────────────► Flight
                └─ publish PaymentRefundRequested ─────────────► Payment
                                                                  │
                                                                  ├─ create refund
                                                                  ├─ mark refund SUCCEEDED
                                                                  └─ publish PaymentRefunded
```

## Integration Patterns Used Now

1. **Reservation + payment intent orchestration over HTTP**
   `booking` performs the synchronous orchestration that must complete before the frontend can continue to the payment step.

2. **Event-driven confirmation**
   `payment` is the source of truth for payment success/expiry, and `booking` reacts to those events rather than assuming a booking is confirmed at create time.

3. **Compensating inventory release**
   Seat release remains explicit and asynchronous through `SeatReleaseRequested`.

4. **Asynchronous refund handling**
   Canceling a paid booking does not block on a synchronous refund call; `payment` completes the refund after the booking is already canceled.
