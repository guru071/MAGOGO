const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[PAGE_ERROR] ${err.message}`));
  await page.goto('http://localhost:3000/browse?category=chatgpt', { waitUntil: 'networkidle' });
  console.log("LOGS:", logs);
  await browser.close();
})();
