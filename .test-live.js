const { chromium } = require('playwright');
const path = require('path');

(async () => {
  console.log('==========================================');
  console.log('🤖 LIVE TEST STARTING');
  console.log('==========================================');
  console.log('1. Launching Chrome...');
  
  const browser = await chromium.launch({ headless: false, slowMo: 100 }); 
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('2. Opening MAGHGO Homepage...');
  await page.goto('http://localhost:3000/');

  console.log('==========================================');
  console.log('⚠️ ACTION REQUIRED ⚠️');
  console.log('Please click "Sign In" and log in to your Seller account in the popup window!');
  console.log('I am pausing and waiting for you to log in...');
  console.log('==========================================');
  
  // Wait for the "Sign Out" button or the Seller dashboard link to appear in the DOM
  // This means the user has successfully logged in
  try {
    await page.waitForFunction(() => {
      return document.body.innerText.includes('Sign Out') || 
             document.body.innerText.includes('Seller Dashboard') ||
             document.querySelector('button')?.innerText.includes('Profile');
    }, { timeout: 120000 }); // Wait up to 2 minutes for the user to log in
  } catch (e) {
    console.log('Timed out waiting for login. Proceeding anyway...');
  }

  console.log('✅ Login detected! Taking over control now...');
  
  console.log('3. Navigating to Upload Page...');
  await page.goto('http://localhost:3000/seller/upload');
  
  // Wait for the category dropdown to be populated and attached
  await page.waitForSelector('select#categoryId option:not([value=""])', { state: 'attached', timeout: 10000 });
  const categoryOptions = await page.$$eval('select#categoryId option:not([value=""])', options => options.map(o => o.value));
  
  console.log('4. Filling out form data...');
  await page.fill('#title', 'Live Playwright Upload Test');
  await page.fill('#description', 'This is a live test of the Supabase upload and image compression integration.');
  await page.fill('#promptText', 'You are a test AI. Provide live feedback.');
  
  if (categoryOptions.length > 0) {
    await page.selectOption('#categoryId', categoryOptions[0]);
  }
  
  await page.fill('#recommendedAI', 'ChatGPT');
  await page.fill('#tags', 'live, test, playwright');
  await page.fill('#price', '15.99');

  console.log('5. Uploading logo.jpeg image...');
  const fileInput = await page.$('input[type="file"]');
  // Pass the absolute path to the image
  await fileInput.setInputFiles('/run/media/guru/New Volume/workspace-be1e7206-b5c6-4688-a3c4-0f25f20b014d(1)/public/logo.jpeg');

  console.log('6. Form fully populated. Clicking Submit in 3 seconds...');
  await page.waitForTimeout(3000);

  // Click submit button
  await page.click('button[type="submit"]');

  console.log('7. Form submitted! Waiting for success redirect...');
  
  try {
    await page.waitForURL('**/seller', { timeout: 15000 });
    console.log('🎉 SUCCESS! Prompt created and redirected to Seller Dashboard!');
  } catch (err) {
    console.log('Did not redirect within 15 seconds, checking if it stayed on the page.');
  }
  
  console.log('Keeping browser open for 15 seconds so you can see the result...');
  await page.waitForTimeout(15000);
  
  await browser.close();
})();
