import path from "path";
import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "url";
import type { Page } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const fixturePath = path.join(__dirname, "fixtures", "test-budget.json");

export async function uploadFixture(page: Page): Promise<void> {
  const fileInput = page.locator(".upload-input");
  await fileInput.setInputFiles(fixturePath);
}

// Encrypts using the same BENC format as budget-etl (Go) and src/crypto.ts (Web Crypto).
// Uses Node.js crypto for Playwright e2e.
export function encryptBuffer(plaintext: Buffer, password: string): Buffer {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.pbkdf2Sync(password, salt, 600000, 32, "sha256");
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([Buffer.from("BENC"), salt, iv, encrypted, tag]);
}

export async function uploadEncryptedFixture(page: Page, password: string): Promise<void> {
  const plaintext = fs.readFileSync(fixturePath);
  const encrypted = encryptBuffer(plaintext, password);
  const fileInput = page.locator(".upload-input");
  await fileInput.setInputFiles({
    name: "encrypted-budget.json",
    mimeType: "application/octet-stream",
    buffer: encrypted,
  });
}
