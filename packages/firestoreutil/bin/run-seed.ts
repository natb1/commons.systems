import { initFirebaseAdmin } from "../src/init.js";
import { seed, type SeedSpec, type SeedOptions } from "../src/seed.js";
import { validateNamespace } from "../src/namespace.js";

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

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
const db = await initFirebaseAdmin();
const validatedNamespace = validateNamespace(namespace);
const spec: SeedSpec = { ...appSeed, namespace: validatedNamespace };
const seedOptions: SeedOptions = {
  includeTestOnly: process.env.SEED_TEST_ONLY === "true",
};

console.log(`Seeding Firestore namespace "${namespace}" for app "${appName}"...`);
if (emulatorHost) {
  console.log(`Using emulator at ${emulatorHost}`);
}

await seed(db, spec, seedOptions);
console.log("Seeding complete.");
