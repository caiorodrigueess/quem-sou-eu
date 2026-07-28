const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));

  await page.goto('http://localhost:5173');
  
  // Wait for the "Criar Sala" section
  await page.waitForSelector('button');
  
  // Fill the name
  await page.type('input[placeholder="Seu Nome"]', 'TestPlayer');
  
  // Click "Criar Sala"
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.includes('Criar Sala')) {
      await btn.click();
      break;
    }
  }

  // Wait 2 seconds to see what happens
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();
