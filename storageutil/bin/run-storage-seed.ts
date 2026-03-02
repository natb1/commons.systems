import { seedStorage, type StorageSeedSpec } from "../src/seed.js";

const appName = process.env.APP_NAME;
if (!appName) {
  console.error("APP_NAME env var is required");
  process.exit(1);
}
if (!/^[a-z][a-z0-9-]*$/.test(appName)) {
  console.error(`Invalid APP_NAME: "${appName}" (must match ^[a-z][a-z0-9-]*$)`);
  process.exit(1);
}

const host = process.env.STORAGE_EMULATOR_HOST;
if (!host) {
  console.error("STORAGE_EMULATOR_HOST required");
  process.exit(1);
}

let spec: StorageSeedSpec;
try {
  const mod = (await import(`../../${appName}/seeds/storage.js`)) as {
    default: StorageSeedSpec;
  };
  spec = mod.default;
} catch (err) {
  console.error(
    `Failed to import storage seed for app "${appName}": ${err instanceof Error ? err.message : err}`,
  );
  console.error(`Ensure ${appName}/seeds/storage.ts exists and exports a default StorageSeedSpec.`);
  process.exit(1);
}

const projectId = process.env.FIREBASE_PROJECT_ID ?? "commons-systems";
const bucket = `${projectId}.appspot.com`;

await seedStorage(host, bucket, spec);
console.log(`Storage seeded: ${spec.files.length} files in bucket ${bucket}`);
