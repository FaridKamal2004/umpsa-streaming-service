import { chromium, devices } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const baseURL = process.env.DEMO_URL || 'http://127.0.0.1:4173/';
await mkdir('docs', { recursive: true });
const browser = await chromium.launch();
try {
  for (const [name, options] of [['desktop', { viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 }], ['mobile', { ...devices['Pixel 7'], deviceScaleFactor: 1 }]]) {
    const context = await browser.newContext(options);
    const page = await context.newPage();
    await page.goto(baseURL);
    await page.locator('.film-card').last().waitFor();
    await page.screenshot({ path: `docs/${name}.png`, fullPage: true });
    console.log(`Saved docs/${name}.png`);
    await context.close();
  }
} finally { await browser.close(); }
