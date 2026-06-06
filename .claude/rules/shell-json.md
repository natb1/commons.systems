# Parsing JSON in the shell

The Bash tool runs in **zsh**, whose builtin `echo` interprets backslash escapes
(`\t`, `\n`, `\uXXXX`) by default. Piping a captured JSON variable through `echo`
into `jq` corrupts valid JSON: `gh … --json` emits a tab inside a string as the
two-character escape `\t`, and `echo "$VAR"` rewrites it to a literal TAB — a
control character `jq` rejects with:

```
jq: parse error: Invalid string: control characters from U+0000 through U+001F must be escaped
```

PR and issue bodies routinely contain tabs and newlines, so this fires often.

## Never `echo` a captured JSON variable into `jq`

```bash
# BAD — zsh echo un-escapes \t/\n, injecting raw control chars jq rejects
PR_JSON=$(gh pr view "$BRANCH" --json number,labels,body)
PR_NUM=$(echo "$PR_JSON" | jq -r .number)
```

Use one of these instead:

```bash
# GOOD — here-string: no escape interpretation, single fetch reused
PR_JSON=$(gh pr view "$BRANCH" --json number,labels,body)
PR_NUM=$(jq -r .number <<<"$PR_JSON")
jq -r '.labels[].name' <<<"$PR_JSON"

# GOOD — let gh run the filter on its in-memory JSON (no shell round-trip)
PR_NUM=$(gh pr view "$BRANCH" --json number --jq .number)

# GOOD — printf '%s' does not interpret escapes
PR_NUM=$(printf '%s' "$PR_JSON" | jq -r .number)
```

A direct pipe (`gh … --json … | jq`) is also safe — gh's stdout reaches `jq`
without an `echo` in between. For non-JSON raw text fed to `jq`, use
`jq --raw-input`.
