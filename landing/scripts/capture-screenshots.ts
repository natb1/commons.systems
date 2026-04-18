import { chromium } from "playwright";
import { dirname, join } from "node:path";

const outDir = join(dirname(new URL(import.meta.url).pathname), "..", "public", "screenshots");

interface Shot {
  name: string;
  url: string;
  wait?: number;
  scrollY?: number;
}

const shots: Shot[] = [
  { name: "budget", url: "https://budget.commons.systems/transactions", wait: 2500, scrollY: 540 },
  { name: "audio", url: "https://audio.commons.systems/", wait: 2500, scrollY: 540 },
  { name: "print", url: "https://print.commons.systems/", wait: 2500, scrollY: 540 },
];

const WIDTH = 1200;
const HEIGHT = 800;

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT } });
  const page = await context.newPage();

  try {
    for (const shot of shots) {
      console.log(`Capturing ${shot.name} from ${shot.url}`);
      await page.goto(shot.url, { waitUntil: "domcontentloaded", timeout: 60000 });
      if (shot.wait) await page.waitForTimeout(shot.wait);
      if (shot.scrollY) await page.evaluate((y) => window.scrollTo(0, y), shot.scrollY);
      await page.waitForTimeout(500);
      await page.screenshot({
        path: join(outDir, `${shot.name}.png`),
        clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
      });
      console.log(`  wrote ${shot.name}.png`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
