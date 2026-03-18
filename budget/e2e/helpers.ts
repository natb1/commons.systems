import path from "path";
import { fileURLToPath } from "url";
import type { Page } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const fixturePath = path.join(__dirname, "fixtures", "test-budget.json");

export async function uploadFixture(page: Page): Promise<void> {
  const fileInput = page.locator(".upload-input");
  await fileInput.setInputFiles(fixturePath);
}
