import { seedStorage, type StorageSeedItem } from "../src/seed-storage.js";

const appName = process.env.APP_NAME;
if (!appName) {
  console.error("APP_NAME env var is required");
  process.exit(1);
}
if (!/^[a-z][a-z0-9-]*$/.test(appName)) {
  console.error(`APP_NAME must match ^[a-z][a-z0-9-]*$`);
  process.exit(1);
}

const storageBucket = process.env.STORAGE_BUCKET;
if (!storageBucket) {
  console.error("STORAGE_BUCKET env var is required");
  process.exit(1);
}

const storageEmulatorHost = process.env.STORAGE_EMULATOR_HOST;
if (!storageEmulatorHost) {
  console.error("STORAGE_EMULATOR_HOST env var is required");
  process.exit(1);
}

const includeTestOnly = process.env.SEED_TEST_ONLY === "true";

let items: StorageSeedItem[];
try {
  const mod = (await import(`../../${appName}/seeds/storage.js`)) as {
    default: StorageSeedItem[];
  };
  items = mod.default;
} catch (err) {
  console.error(
    `Failed to import seed module for app "${appName}": ${err instanceof Error ? err.message : err}`,
  );
  console.error(`Ensure ${appName}/seeds/storage.ts exists and exports a default StorageSeedItem[].`);
  process.exit(1);
}

let result: { uploaded: number; skipped: number };
try {
  result = await seedStorage({
    items,
    bucket: storageBucket,
    emulatorHost: storageEmulatorHost,
    includeTestOnly,
  });
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}

console.log(`Seeded ${result.uploaded} storage objects (skipped ${result.skipped})`);
