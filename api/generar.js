const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');
const path = require('path');

module.exports = async (req, res) => {
  const { horas, minutos, segundos, distancia, paleta } = req.query;

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
  });

  const page = await browser.newPage();
  const filePath = path.join(__dirname, '../public/editor.html');
  await page.goto(`file://${filePath}`, { waitUntil: 'networkidle0' });

  await page.evaluate((h, m, s, d, p) => {
    document.getElementById('hours').value = h;
    document.getElementById('minutes').value = m;
    document.getElementById('seconds').value = s;
    document.getElementById('distanceSelect').value = d;
    document.getElementById('distanceSelect').dispatchEvent(new Event('change'));

    const palettes = {
      sunset: ['#FF6B6B', '#FFA94D', '#FFD93D'],
      oceanic: ['#894DFB', '#3F9DFE', '#3FCF77'],
      contraste: ['#FF1514', '#201C73', '#F12A2A']
    };
    const selected = palettes[p.toLowerCase()];
    if (selected) {
      document.getElementById('color1').value = selected[0];
      document.getElementById('color2').value = selected[1];
      document.getElementById('color3').value = selected[2];
    }
    document.querySelector('button[onclick*=convertTimeToPercentages]').click();
  }, horas, minutos, segundos, distancia, paleta);

  await page.waitForTimeout(500);

  const svgHTML = await page.evaluate(() => {
    const allSvgs = document.querySelectorAll('svg');
    let result = '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">';
    allSvgs.forEach(svg => result += svg.innerHTML);
    result += '</svg>';
    return result;
  });

  await browser.close();
  res.setHeader('Content-Type', 'image/svg+xml');
  res.status(200).send(svgHTML);
};