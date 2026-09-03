import type { SeedSpec } from "@commons-systems/firestoreutil/seed";

// No Firestore data model yet — the shared notes board (tactic-demo-saas-data-rules)
// adds the first collection. An empty spec keeps the seed runner (and the
// acceptance/preview-deploy seeding step, which every app is expected to have) working.
const appSeed: Omit<SeedSpec, "namespace"> = {
  collections: [],
};

export default appSeed;
