const { chromium } = require('/home/user/.npm/_npx/13ab0715f9f30c2e/node_modules/playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const root = '/home/user/tapasul-site';
  const white = fs.readFileSync(path.join(root,'assets/logo-frog-white.svg'),'utf8');

  async function shoot(vb, size, bg) {
    const p = await b.newPage();
    await p.setViewportSize({width:size, height:size});
    await p.setContent(`<body style="margin:0;background:${bg};display:grid;place-items:center;width:${size}px;height:${size}px">
      <div style="width:${size*0.78}px;height:${size*0.78}px">${white.replace('viewBox="20 -690 1640 2140"', 'viewBox="'+vb+'"')}</div></body>`);
    await p.waitForTimeout(300);
    const buf = await p.screenshot();
    await p.close();
    return buf;
  }
  // apple-touch-icon: blue rounded square + white lockup
  const p2 = await b.newPage();
  const S = 180;
  await p2.setViewportSize({width:S, height:S});
  const lock = white.replace('viewBox="20 -690 1640 2140"','viewBox="20 -690 1640 2140"');
  await p2.setContent(`<body style="margin:0">
    <div style="position:relative;width:${S}px;height:${S}px;background:#0881ef;border-radius:22%;overflow:hidden;display:grid;place-items:center">
      <div style="width:${S*0.7}px;height:${S*0.7}px">${lock}</div>
    </div></body>`);
  await p2.waitForTimeout(300);
  fs.writeFileSync(path.join(root,'assets/apple-touch-icon.png'), await p2.screenshot());
  await p2.close();

  // icon-512: same, square, full bleed (maskable safe zone = 80%)
  const S2 = 512;
  const p3 = await b.newPage();
  await p3.setViewportSize({width:S2, height:S2});
  await p3.setContent(`<body style="margin:0">
    <div style="position:relative;width:${S2}px;height:${S2}px;background:#0881ef;display:grid;place-items:center">
      <div style="width:${S2*0.58}px;height:${S2*0.58}px">${white}</div>
    </div></body>`);
  await p3.waitForTimeout(300);
  fs.writeFileSync(path.join(root,'assets/icon-512.png'), await p3.screenshot());
  await p3.close();
  await b.close();
  console.log('icons written');
})();
