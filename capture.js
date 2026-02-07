const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({headless: 'new'});
  const page = await browser.newPage();
  await page.setViewport({width: 1920, height: 1080});
  await page.goto('file://' + path.resolve('demo/dashboard.html'));
  
  // Capture 78 frames (1 per second for 78s video)
  for (let i = 0; i < 78; i++) {
    await page.screenshot({path: `frames/frame_${String(i).padStart(4, '0')}.png`});
    await new Promise(r => setTimeout(r, 1000));
  }
  
  await browser.close();
  console.log('Done capturing frames');
})();
