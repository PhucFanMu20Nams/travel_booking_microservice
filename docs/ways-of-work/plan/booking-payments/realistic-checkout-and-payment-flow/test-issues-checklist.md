# Test Issues Checklist

- [x] Add unit test for seat-class pricing multipliers
- [x] Add unit test for booking create using locked seat price
- [x] Add unit test for duplicate active booking rejection
- [x] Add unit test for payment confirmation success path
- [x] Add unit test for payment confirmation idempotent replay
- [x] Update frontend integration test to verify pending checkout then payment confirmation
- [x] Update booking list/detail tests for new payment-aware booking views
- [x] Update presentation rule tests for `PENDING_PAYMENT` and `EXPIRED`
- [x] Add CI steps for flight, booking, payment, and frontend
- [ ] Add backend integration tests with Testcontainers for cross-service expiry and refund paths
- [ ] Add Playwright end-to-end browser flow for success and decline scenarios
- [ ] Add load/performance tests for concurrent checkout and payment confirmation
