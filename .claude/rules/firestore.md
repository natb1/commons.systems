# Firestore Rules

`firestore.rules` changes are deployed automatically by CI when a PR merges to `main`.
Preview branch deploys do not deploy rules.

**Put rules changes in a standalone PR targeting `main`**, separate from feature work.
Smoke tests on a feature branch will fail with permission-denied until the standalone
rules PR merges and CI deploys the updated rules.

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
