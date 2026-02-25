# Firestore Rules

`firestore.rules` changes are deployed automatically by CI when a PR merges to `main`.
Preview branch deploys do not deploy rules.

**Put rules changes in a standalone PR targeting `main`**, separate from feature work.
Smoke tests on a feature branch will fail with permission-denied until the standalone
rules PR merges and CI deploys the updated rules.

**Important:** The production deploy workflow (`landing-prod-deploy.yml`) must already
exist on `main` for CI to trigger on a rules PR merge. If it does not exist yet (e.g.
the app is brand new), the standalone rules PR will merge but the rules will not deploy
automatically. In that case, deploy rules manually (see below) while the feature PR is
still in review.

## Manual rules deployment (for debugging or bootstrapping)

If rules need to be tested or deployed before the prod-deploy workflow exists on `main`,
ask the user to run:

```bash
firebase deploy --only firestore:rules --project <project-id>
```

Once the correct rule set is confirmed, include the rules in the declarative
`firestore.rules` file and open a standalone PR targeting `main` for permanent deployment.

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
