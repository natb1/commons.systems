# Firestore Rules

`firestore.rules` changes are deployed by CI on every preview deploy AND on every
production deploy (when a PR merges to `main`). Because preview deploys run rules
deployment, feature branches do not require a separate standalone PR for rules changes.

**Keep rules changes in the same PR as the feature that needs them.** Smoke tests on
the preview deployment will have the correct rules because the preview deploy script
deploys rules before smoke tests run.

## List query compatibility

Security rules for list queries require the query to include a filter matching the rule
condition. A rule like `allow read: if resource.data.published == true || request.auth != null`
rejects an unauthenticated `orderBy("publishedAt")` query even when all documents satisfy
`published == true` — because no `where` clause restricts the query to published documents.

Use `where("published", "==", true)` for unauthenticated list queries and sort client-side:

```typescript
const q = isNatb1(user)
  ? query(collection(db, path), orderBy("publishedAt"))
  : query(collection(db, path), where("published", "==", true));
```
