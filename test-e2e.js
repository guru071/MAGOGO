const { chromium } = require('playwright');
const path = require('path');

(async () => {
  console.log('Launching browser so you can lively see the work...');
  const browser = await chromium.launch({ headless: false, slowMo: 50 }); // slowMo so user can see what's happening
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to upload page...');
  await page.goto('http://localhost:3000/seller/upload');

  // Wait until we are actually on the upload page (in case of login redirect)
  if (page.url().includes('login') || page.url().includes('signin')) {
    console.log('⚠️ Please log in to the browser window that just popped up!');
    console.log('Waiting for you to log in...');
    await page.waitForURL('**/seller/upload', { timeout: 0 }); // wait forever
  }

  console.log('Form is ready! Filling out the form...');
  
  // Wait for the category dropdown to be populated
  await page.waitForSelector('select#categoryId option:not([value=""])', { state: 'attached', timeout: 10000 });
  const categoryOptions = await page.$$eval('select#categoryId option:not([value=""])', options => options.map(o => o.value));
  
  await page.fill('#title', 'Live Playwright Upload Test');
  await page.fill('#description', 'This is a live test of the Supabase upload and image compression integration.');
  await page.fill('#promptText', 'You are a test AI. Provide live feedback.');
  
  if (categoryOptions.length > 0) {
    await page.selectOption('#categoryId', categoryOptions[0]);
  }
  
  await page.fill('#recommendedAI', 'ChatGPT');
  await page.fill('#tags', 'live, test, playwright');
  await page.fill('#price', '15.99');

  console.log('Uploading image...');
  // Find the file input
  const fileInput = await page.$('input[type="file"]');
  await fileInput.setInputFiles(path.resolve('./public/logo.jpeg'));

  console.log('Image attached! Submitting form in 2 seconds...');
  await page.waitForTimeout(2000);

  // Click submit button
  await page.click('button[type="submit"]');

  console.log('Form submitted! Waiting for success redirect...');
  
  // Wait for the redirect to /seller or for a success message
  try {
    await page.waitForURL('**/seller', { timeout: 15000 });
    console.log('✅ SUCCESS! Prompt created and redirected to Seller Dashboard!');
  } catch (err) {
    console.log('Did not redirect within 15 seconds, checking if it stayed on the page.');
  }
  
  console.log('Keeping browser open for 10 seconds so you can see the result...');
  await page.waitForTimeout(10000);
  
  await browser.close();
})();
