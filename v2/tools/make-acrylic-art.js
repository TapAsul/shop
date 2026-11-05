/* Regenerates assets/acrylic-front.jpg — the placeholder artwork for the
   acrylic QR review standee.
   Usage:  node mkacrylic.js [url]
   The URL is what the printed QR codes point at. It defaults to the site's
   own address; set brand.reviewUrl in site.config.js and re-run with your
   Google review link to change it.
*/
const { chromium } = require('/home/user/.npm/_npx/13ab0715f9f30c2e/node_modules/playwright');
const fs = require('fs');
const { execFileSync } = require('child_process');

const ROOT = require('path').join(__dirname, '..');
const URL_TO_QR = process.argv[2] || 'https://tapasul.example';

/* Requires the `segno` python package:  pip install segno */

// --- real QR code as inline SVG (segno) -----------------------------------
function qrSvg(text) {
  // a PNG data URI is the most predictable way to get a crisp, scannable code
  const py = `
import segno, base64
q = segno.make(${JSON.stringify(text)}, error='m')
q.save('/tmp/_qr.png', kind='png', scale=12, border=2, dark='#0a0f1d', light='#ffffff')
print(base64.b64encode(open('/tmp/_qr.png','rb').read()).decode())
`;
  return 'data:image/png;base64,' + execFileSync('python3', ['-c', py], { encoding: 'utf8' }).trim();
}

(async () => {
  const b = await chromium.launch();
  const logo = fs.readFileSync(ROOT + '/assets/logo-frog.svg', 'utf8');
  const qr = qrSvg(URL_TO_QR);
  const W = 1000, H = 1364;            // standee panel ratio 2.2 : 3.0
  const p = await b.newPage();
  await p.setViewportSize({ width: W, height: H });
  await p.setContent(`<head><style>svg{display:block;width:100%;height:100%}</style></head><body style="margin:0;width:${W}px;height:${H}px;overflow:hidden;background:#fff">
    <div style="position:relative;width:${W}px;height:${H}px;
                background:linear-gradient(160deg,#f4f8fd 0%,#ffffff 42%,#e8f2fe 100%);
                font-family:Inter,system-ui,sans-serif">
      <div style="position:absolute;left:-120px;top:-160px;width:620px;height:620px;border-radius:50%;
                  background:radial-gradient(circle,rgba(8,129,239,.16),transparent 70%)"></div>
      <div style="position:absolute;right:-100px;bottom:-140px;width:520px;height:520px;border-radius:50%;
                  background:radial-gradient(circle,rgba(8,129,239,.12),transparent 70%)"></div>

      <div style="position:absolute;left:0;right:0;top:104px;text-align:center">
        <div style="width:270px;height:350px;margin:0 auto">${logo}</div>
      </div>

      <div style="position:absolute;left:0;right:0;top:498px;text-align:center">
        <div style="font-size:104px;font-weight:800;letter-spacing:-.04em;color:#0a0f1d;
                    font-family:Outfit,system-ui,sans-serif">Tap<span style="color:#0881ef">Asul</span></div>
        <div style="font-size:32px;font-weight:600;color:#475569;margin-top:10px;letter-spacing:.14em;
                    text-transform:uppercase">Smart NFC Standee</div>
      </div>

      <div style="position:absolute;left:0;right:0;top:686px;display:flex;justify-content:center;gap:22px">
        ${[0, 1, 2].map(() => `<div style="width:216px;height:216px;border-radius:20px;background:#fff;
             border:2px solid #dbe7f6;display:grid;place-items:center;box-shadow:0 10px 30px -18px rgba(8,80,180,.5)">
             <img src="${qr}" width="150" height="150" alt="" style="width:150px;height:150px;display:block;border-radius:8px"></div>`).join('')}
      </div>

      <div style="position:absolute;left:0;right:0;top:982px;text-align:center">
        <div style="font-size:44px;font-weight:700;color:#0a0f1d">Scan to visit us online</div>
        <div style="font-size:30px;color:#64748b;margin-top:16px">or tap the NFC chip with your phone</div>
      </div>

      <div style="position:absolute;left:0;right:0;bottom:62px;text-align:center">
        <div style="display:inline-block;padding:18px 46px;border-radius:999px;background:#0881ef;color:#fff;
                    font-size:30px;font-weight:700;letter-spacing:.08em">tapasul</div>
      </div>
    </div></body>`);
  await p.waitForTimeout(700);
  fs.writeFileSync(ROOT + '/assets/acrylic-front.jpg', await p.screenshot({ type: 'jpeg', quality: 90 }));
  await b.close();
  console.log('acrylic placeholder written · QR points at ' + URL_TO_QR);
})();
