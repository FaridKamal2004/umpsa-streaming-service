import { chromium } from "@playwright/test";
import { catalog } from "../src/catalog.js";
// Optional external-service smoke check; intentionally excluded from deterministic CI.
// Run npm start in another terminal before invoking this script.
const browser = await chromium.launch();
let failed = false;
try {
  for (const movie of catalog) {
    const page = await browser.newPage();
    try {
      await page.goto(process.env.DEMO_URL || "http://127.0.0.1:4173/");
      await page.locator(`[data-play="${movie.id}"]`).click();
      await page.waitForFunction(
        () => document.querySelector("video").currentTime > 1,
        null,
        { timeout: 45000 },
      );
      const duration = await page.locator("video").evaluate((video) => {
        video.pause();
        video.currentTime = 12;
        return video.duration;
      });
      await page.waitForFunction(
        () => Math.abs(document.querySelector("video").currentTime - 12) < 1,
      );
      await page
        .getByRole("button", { name: "Close player", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Continue watching", exact: true })
        .click();
      await page
        .getByRole("button", { name: `Resume ${movie.title}`, exact: true })
        .waitFor();
      await page.reload();
      await page.locator(`[data-play="${movie.id}"]`).click();
      await page.waitForFunction(
        () => document.querySelector("video").currentTime >= 11,
        null,
        { timeout: 45000 },
      );
      console.log(
        `PASS ${movie.title}: media decoded, seeking worked, progress persisted, reload resumed; duration=${Math.round(duration)}s`,
      );
    } catch (error) {
      failed = true;
      console.error(`FAIL ${movie.title}: ${error.message}`);
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
}
if (failed) process.exitCode = 1;
