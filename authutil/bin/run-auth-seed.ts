import { seedAuthUser, type AuthUser } from "../src/seed.js";

const appName = process.env.APP_NAME;
if (!appName) {
  console.error("APP_NAME env var is required");
  process.exit(1);
}

const host = process.env.AUTH_EMULATOR_HOST;
if (!host) {
  console.error("AUTH_EMULATOR_HOST required");
  process.exit(1);
}

let testUser: AuthUser;
try {
  const mod = (await import(`../../${appName}/seeds/auth.js`)) as {
    default: AuthUser;
  };
  testUser = mod.default;
} catch (err) {
  console.error(
    `Failed to import auth seed for app "${appName}": ${err instanceof Error ? err.message : err}`,
  );
  console.error(`Ensure ${appName}/seeds/auth.ts exists and exports a default AuthUser.`);
  process.exit(1);
}

const projectId = process.env.FIREBASE_PROJECT_ID ?? "commons-systems";

await seedAuthUser(host, testUser, projectId);
console.log(`Auth user seeded: ${testUser.email}`);
