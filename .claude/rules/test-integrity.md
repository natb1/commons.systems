# Test Integrity

## A failing test means fix the code or escalate — never weaken the test

When a test fails, fix the underlying code. Removing, skipping (`.skip`, `xit`,
`xdescribe`, `test.skip`, `it.skip`), commenting out, or otherwise disabling or
weakening a test to make CI green is forbidden. A red test is a signal, not an
obstacle — suppressing it destroys the signal without fixing the problem.

If the underlying code genuinely cannot be fixed within the current session,
escalate to office-hours. There is no self-serve escape hatch: the test stays
enabled, and the work is parked until a fix is viable.
