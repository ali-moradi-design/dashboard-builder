// Renders mockup.html to PNG for every view, theme and language.
// Usage: node docs/mockups/render.cjs  (needs Playwright with Chromium)
const path = require('node:path');
const { chromium } = require('playwright');
(async () => {
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
  const browser = await chromium.launch({ proxy });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, ignoreHTTPSErrors: true });
  const file = 'file://' + path.join(__dirname, 'mockup.html');
  for (const view of ['dashboard', 'edit', 'query'])
    for (const theme of ['dark', 'light'])
      for (const lang of ['en', 'fa']) {
        await page.goto(`${file}?view=${view}&theme=${theme}&lang=${lang}`, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        const out = path.join(__dirname, 'png', `${view}-${theme}-${lang}.png`);
        await page.screenshot({ path: out, fullPage: true });
        console.log(out, await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').length));
      }
  await browser.close();
})();
