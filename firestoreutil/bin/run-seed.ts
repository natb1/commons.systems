import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { seed, type SeedSpec, type SeedOptions } from "../src/seed.js";

const appName = process.env.APP_NAME;
if (!appName) {
  console.error("APP_NAME env var is required");
  process.exit(1);
}
if (!/^[a-z][a-z0-9-]*$/.test(appName)) {
  console.error(`Invalid APP_NAME: "${appName}" (must match ^[a-z][a-z0-9-]*$)`);
  process.exit(1);
}

const namespace = process.env.FIRESTORE_NAMESPACE;
if (!namespace) {
  console.error("FIRESTORE_NAMESPACE env var is required");
  process.exit(1);
}

let appSeed: Omit<SeedSpec, "namespace">;
try {
  const mod = (await import(`../../${appName}/seeds/firestore.js`)) as {
    default: Omit<SeedSpec, "namespace">;
  };
  appSeed = mod.default;
} catch (err) {
  console.error(
    `Failed to import seed module for app "${appName}": ${err instanceof Error ? err.message : err}`,
  );
  console.error(`Ensure ${appName}/seeds/firestore.ts exists and exports a default SeedSpec.`);
  process.exit(1);
}

const projectId = process.env.FIREBASE_PROJECT_ID ?? "commons-systems";
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;

if (emulatorHost) {
  // When using the emulator, initialize without credentials
  initializeApp({ projectId });
} else {
  // Production: use application default credentials or service account
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (serviceAccountPath) {
    const serviceAccount = (
      await import(serviceAccountPath, { with: { type: "json" } })
    ).default as ServiceAccount;
    initializeApp({ credential: cert(serviceAccount) });
  } else {
    console.warn(
      "No GOOGLE_APPLICATION_CREDENTIALS set — using application default credentials. " +
        "Ensure ADC is configured (e.g. via `gcloud auth application-default login`).",
    );
    initializeApp({ projectId });
  }
}

const db = getFirestore();
const spec: SeedSpec = { ...appSeed, namespace };
const seedOptions: SeedOptions = {
  includeTestOnly: process.env.SEED_TEST_ONLY === "true",
};

console.log(`Seeding Firestore namespace "${namespace}" for app "${appName}"...`);
if (emulatorHost) {
  console.log(`Using emulator at ${emulatorHost}`);
}

await seed(db, spec, seedOptions);
console.log("Seeding complete.");
