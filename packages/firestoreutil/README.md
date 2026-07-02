# @commons-systems/firestoreutil/bounded-query

`boundedQuery` is the **default way to read a Firestore collection** in this codebase. Use it instead of calling the Firebase SDK's `getDocs` directly. An unbounded full-collection scan is unrepresentable by construction — the type system enforces the bound.

## Why

A raw `getDocs(collection(db, path))` scans every document in the collection. On a growing collection, read cost scales with collection size × poll rate. `boundedQuery` forces every collection read to make an explicit bound decision before `.getDocs()` is reachable, eliminating accidental full-collection scans.

## API

```
boundedQuery(db, path)  →  UnboundedQuery
```

Pass a namespaced collection path (e.g. from `nsCollectionPath`). Chain `.where()` and `.orderBy()` as needed, then choose a bound:

| Method | Returns | Effect |
|---|---|---|
| `.where(field, op, value)` | `UnboundedQuery` | Adds a filter |
| `.orderBy(field, direction?)` | `UnboundedQuery` | Adds an ordering |
| `.limit(n)` | `BoundedQuery` | Caps results at `n` documents |
| `.unbounded(reason)` | `BoundedQuery` | Escape hatch — full scan with documented justification |

`BoundedQuery` adds `.getDocs()` (returns `Promise<QuerySnapshot>`), which is the only way to run the query. Because `.getDocs()` does not exist on `UnboundedQuery`, calling it before picking a bound is a compile error. The in-source JSDoc on each type is the authoritative API reference.

## Examples

**Bounded (preferred):**

```typescript
import { boundedQuery } from "@commons-systems/firestoreutil/bounded-query";

const snapshot = await boundedQuery(db, nsCollectionPath(ns, "samples"))
  .where("memberEmails", "array-contains", email)
  .orderBy("sampledAt", "desc")
  .limit(2000)
  .getDocs();
```

**Escape hatch — intentional full scan:**

```typescript
const snapshot = await boundedQuery(db, nsCollectionPath(ns, "mediaCatalog"))
  .where("publicDomain", "==", true)
  .unbounded(
    "public-domain media catalog is a small curated set; paginate if it grows"
  )
  .getDocs();
```

## When to use each

Prefer `.limit(n)` (or pagination) whenever the collection can grow with user activity. Use `.unbounded(reason)` only when a full scan is genuinely intentional — small, practically-bounded sets where reading every document is correct. The `reason` string must be an honest, non-empty justification; an empty or whitespace-only reason throws at runtime.

## Backstop

The repo also carries a lint sensor (#2687) as a thin backstop that flags any remaining raw-SDK `getDocs` usage that bypasses this helper. The two work together: `boundedQuery` is the primary enforcement at the type level; the lint sensor catches anything that slips past it.
