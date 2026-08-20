# Type-Safety Suppression Marker

`.github/scripts/check-type-safety-escapes.sh` runs in CI on every PR. It
diffs the branch against `origin/main` and flags six net-new type-safety
escape hatches on added TS/JS lines: `@ts-ignore`, `@ts-expect-error`,
`eslint-disable` (including `-line` / `-next-line`), `any` in type position,
an `as <Type>` cast, and a non-null assertion `!`. It only flags lines the PR
adds — hatches already on `origin/main` are not retroactively flagged.

`.claude/skills/dispatch-propagate/scripts/run-lint.sh` runs this check
unconditionally, so it fails locally before push, not just in CI.

## Suppress with `// type-safety-ok: <reason>` on the same line

Append the marker, with a non-empty reason, to the end of the line that
triggers the rule:

```ts
const value = raw as any // type-safety-ok: legacy API returns untyped JSON
```

The marker must be on the **same line** as the hatch — it is not a
block-level or file-level suppression, and a comment on the line above or
below does nothing. An empty reason (`// type-safety-ok:` with nothing after
the colon) does not suppress; the check still flags the line.

## When a suppression is legitimate

Use it when the escape hatch is the correct fix, not a shortcut: an
untyped third-party value at a system boundary, a type gap in a dependency
you don't control, or a narrowing the compiler genuinely cannot prove. Write
the reason for the next reader, not for the linter — "legacy API returns
untyped JSON" is a reason; "needed" or "fixes lint" is not.

Do not reach for the marker to make CI green when the actual fix is to add
the missing type, narrow the value, or restructure the code so the hatch
isn't needed. The marker is a suppression, not an alternative to the check
`.claude/rules/test-integrity.md` describes for tests: escaping typing
problems this way should be the exception, made deliberately and explained,
not the default response to a red check.

This marker family (`// <sensor>-ok: <reason>`) is shared by the other
code-quality decay sensors in the same epic; expect the same same-line,
non-empty-reason shape from siblings.
