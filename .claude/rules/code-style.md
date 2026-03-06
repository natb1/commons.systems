# Code Style

## Prefer clear errors over defensive fallbacks

When an operation fails, exit with a descriptive error rather than falling back to a
safe default. The anti-pattern is duplicative branching business logic that buries
errors and adds bloat. For operations like git diff, file reads, or configuration
parsing, failures indicate a misconfigured environment -- hiding them behind fallbacks
causes silent incorrect behavior.

Defensive checks (e.g., runtime type guards at public API boundaries, input validation
at system edges) are not fallbacks — they turn confusing crashes into clear errors and
are encouraged.
