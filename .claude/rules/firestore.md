# Firestore Rules

`firestore.rules` changes deploy automatically via `firestore-deploy.yml` when a PR
merges to `main` — this workflow is independent of any app's prod-deploy workflow.
Preview branch deploys do not deploy rules.

**Put rules changes in a standalone PR targeting `main`**, separate from feature work.
Smoke tests on a feature branch will fail with permission-denied until the standalone
rules PR merges and the centralized workflow deploys the updated rules.

## Manual deployment (for debugging)

To test or deploy rules without merging:

```bash
firebase deploy --only firestore:rules --project <project-id>
```

Once the correct rule set is confirmed, commit to `firestore.rules` and open a
standalone PR targeting `main`.

## Path schema

Each app owns a top-level Firestore collection matching its name. Environments are
documents within that collection:

```
{appName}/{envSuffix}/{collection}/{docId}
```

Examples: `landing/prod/posts/abc123`, `landing/preview-pr-42/posts/abc123`

Rules use the literal app name as a path segment:

```
match /landing/{env}/posts/{postId} {
  allow read: if resource.data.published == true || request.auth != null;
  allow write: if false;
}
```

The scaffolding's `RemoveFirestoreRules` function identifies rule blocks by matching the `match /<appName>/` path prefix. `InsertFirestoreRules` inserts new blocks immediately before the deny-all catch-all comment that serves as an insertion marker.

The deny-all catch-all at the bottom of the file must remain as the last rule.

## List query compatibility

Security rules for list queries require the query to include a filter matching the rule
condition. A rule like `allow read: if resource.data.published == true || request.auth != null`
rejects an unauthenticated `orderBy("publishedAt")` query even when all documents satisfy
`published == true` — because no `where` clause restricts the query to published documents.

Use `where("published", "==", true)` for unauthorized list queries and sort client-side:

```typescript
const q = isAuthorized(user)
  ? query(collection(db, path), orderBy("publishedAt"))
  : query(collection(db, path), where("published", "==", true));
```
