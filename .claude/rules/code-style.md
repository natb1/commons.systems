# Code Style

## Prefer clear errors over defensive fallbacks

When an operation fails, exit with a descriptive error rather than falling back to a
safe default. Fallback logic is appropriate only when transient errors are expected
(e.g., retrying a flaky network call). For operations like git diff, file reads, or
configuration parsing, failures indicate a misconfigured environment -- hiding them
behind fallbacks causes silent incorrect behavior.
