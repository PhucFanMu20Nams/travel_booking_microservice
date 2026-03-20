# QA Plan

## Entry Criteria

- `building-blocks`, `flight`, `booking`, `payment`, and `frontend` build successfully
- required env vars exist for `payment` and `booking`
- docker compose contains the `payment` service and nginx route

## Quality Gates

1. **Build gate**
   - all touched services compile
2. **Core logic gate**
   - unit tests for pricing, booking create, and payment confirm pass
3. **User flow gate**
   - frontend checkout flow passes with pending checkout and explicit payment confirm
4. **Regression gate**
   - booking list/detail cancellation tests still pass after lifecycle changes

## Exit Criteria

- no path creates `CONFIRMED` bookings before payment success
- confirmed revenue excludes pending/expired/canceled bookings
- duplicate active booking requests fail deterministically
- payment expiry releases seats

## Manual QA Focus

- verify `SUCCESS`, `DECLINE`, and `TIMEOUT` payment scenarios in UI
- verify cancel on pending payment vs confirmed payment
- verify expired checkout cannot be reused
- verify booking detail shows payment/refund state correctly
