const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'home.png', fullPage: true });

  await page.goto('http://localhost:3000/browse');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'browse.png', fullPage: true });

  await browser.close();
  console.log("Screenshots captured");
})();
