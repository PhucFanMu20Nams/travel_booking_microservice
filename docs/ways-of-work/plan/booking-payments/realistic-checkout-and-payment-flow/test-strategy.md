# Test Strategy

## Scope

This strategy covers the new realistic checkout flow across `frontend`, `booking`, `flight`, and `payment`.

## Quality Objectives

- Prevent free-confirmed bookings
- Guarantee seat-aware locked pricing
- Prevent duplicate active bookings and duplicate request replay
- Guarantee seat release on expiry/cancel/setup failure
- Guarantee paid-cancel refund dispatch

## ISTQB Techniques

- **Equivalence Partitioning**
  - payment scenarios: `SUCCESS`, `DECLINE`, `TIMEOUT`
  - booking statuses: `PENDING_PAYMENT`, `CONFIRMED`, `EXPIRED`, `CANCELED`
- **Boundary Value Analysis**
  - payment expiry window at `T-1s`, `T`, `T+1s`
- **Decision Table Testing**
  - cancel action by booking status x flight status x payment status
- **State Transition Testing**
  - `PENDING_PAYMENT -> CONFIRMED`
  - `PENDING_PAYMENT -> EXPIRED`
  - `PENDING_PAYMENT/CONFIRMED -> CANCELED`
- **Experience-Based Testing**
  - double click submit, replay payment confirm, stale checkout reopen

## Test Levels

- **Unit**
  - seat price multipliers
  - booking create handler duplicate prevention + price locking
  - payment confirm handler success + idempotent replay
- **Integration**
  - frontend checkout flow with MSW
  - booking detail/list cancellation behavior
- **Build Verification**
  - `building-blocks`, `flight`, `booking`, `payment`, `frontend`

## Current Automated Coverage

- `src/flight/test/unit/seat-pricing.test.ts`
- `src/booking/test/unit/create-booking.handler.test.ts`
- `src/payment/test/unit/confirm-payment.handler.test.ts`
- `src/frontend/src/test/integration/create-booking-flow.test.tsx`
- `src/frontend/src/test/integration/booking-status-and-cancel.test.tsx`
- `src/frontend/src/test/unit/presentation.rules.test.ts`
