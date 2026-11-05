const { chromium } = require('/home/user/.npm/_npx/13ab0715f9f30c2e/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({acceptDownloads:true, viewport:{width:1240,height:800}});
  const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:8080/tools/make-og-image.html',{waitUntil:'load'});
  await p.waitForTimeout(1800);
  const dl = p.waitForEvent('download',{timeout:15000});
  await p.click('button');
  const d = await dl;
  const path = require('path');
  const ROOT = path.join(__dirname, '..');
  const out = path.join(ROOT, 'assets', 'social-preview.png');
  await d.saveAs(out);

  // shrink it — a raw canvas PNG is ~670 KB, a quantised one is ~110 KB
  try {
    require('child_process').execFileSync('python3', ['-c', [
      "from PIL import Image",
      "im = Image.open(r'" + out + "').convert('RGB')",
      "im.quantize(colors=200, method=Image.MEDIANCUT, dither=Image.FLOYDSTEINBERG).save(r'" + out + "', optimize=True)",
    ].join('\n')]);
    console.log('saved + optimised', out);
  } catch (e) {
    console.log('saved (no PIL for optimisation)', out);
  }
  await b.close();
})();
