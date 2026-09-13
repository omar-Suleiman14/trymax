const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../site.js'), 'utf8');
const asset = name => ({ name, browser_download_url: `https://github.com/omar-Suleiman14/max/releases/download/v1.0.2/${name}` });
const assets = ['Max-1.0.2.Setup.exe', 'Max-darwin-arm64.zip', 'Max-x64.dmg', 'Max-1.0.2-arm64.dmg', 'max-shop-os_1.0.2_amd64.deb', 'com.maxshop.Max_stable_x86_64.flatpak'].map(asset);
async function run(navigator, releaseAssets = assets, failure = false) {
  class Element { constructor() { this.dataset = {}; } }
  class Anchor extends Element { constructor(href = '/download') { super(); this.href = href; this.textContent = 'View release'; } setAttribute() {} }
  const button = new Anchor();
  const label = { textContent: 'Get Max for desktop' };
  const rows = ['windows', 'mac', 'linux', 'flatpak'].map(kind => {
    const row = new Element(); row.dataset.asset = kind;
    row.link = new Anchor('https://github.com/omar-Suleiman14/max/releases/latest'); row.meta = {};
    row.querySelector = selector => selector === '[data-asset-link]' ? row.link : row.meta;
    return row;
  });
  const document = { documentElement: { dataset: {} }, querySelector: () => null,
    querySelectorAll: selector => ({ '[data-download]': [button], '[data-download-label]': [label], '[data-asset]': rows }[selector] || []) };
  vm.runInNewContext(source, { navigator, document, HTMLElement: Element, HTMLAnchorElement: Anchor, AbortSignal,
    fetch: async () => { if (failure) throw new Error('offline'); return { ok: true, json: async () => ({ assets: releaseAssets }) }; } });
  assert.equal(label.textContent, 'Get Max for desktop', 'initial render is generic');
  await new Promise(resolve => setImmediate(resolve));
  return { button, label, rows, platform: document.documentElement.dataset.platform };
}
for (const [os, navigator, label] of [
  ['Windows', { platform: 'Win32', userAgent: 'Windows NT 10.0; Win64; x64' }, 'Windows'],
  ['macOS', { platform: 'MacIntel', userAgent: 'Macintosh', maxTouchPoints: 0 }, 'macOS'],
  ['Linux', { platform: 'Linux x86_64', userAgent: 'X11; Linux x86_64' }, 'Linux'],
]) test(`${os}: correct CTA and all four build choices remain available`, async () => {
  const result = await run(navigator);
  assert.equal(result.label.textContent, `Download for ${label}`);
  assert.equal(result.button.href, os === 'Windows' ? assets[0].browser_download_url : '/download');
  assert.equal(result.rows.length, 4);
  assert.ok(result.rows.every(row => row.link.dataset.resolved === 'true'));
  assert.match(result.rows[1].link.href, /arm64\.dmg$/);
});
for (const [name, navigator] of [
  ['iPhone', { platform: 'iPhone', userAgent: 'iPhone like Mac OS X' }],
  ['iPad desktop mode', { platform: 'MacIntel', userAgent: 'Macintosh', maxTouchPoints: 5 }],
  ['Android', { platform: 'Linux', userAgent: 'Android' }],
  ['ChromeOS', { platform: 'Linux', userAgent: 'X11 CrOS x86_64' }],
  ['FreeBSD', { platform: 'FreeBSD', userAgent: 'X11' }],
  ['unknown', {}],
  ['mobile client hint', { userAgentData: { platform: 'Windows', mobile: true } }],
]) test(`${name}: generic desktop CTA`, async () => {
  const result = await run(navigator);
  assert.equal(result.label.textContent, 'Get Max for desktop');
  assert.equal(result.button.href, '/download');
  assert.equal(result.platform, undefined);
});
test('missing builds do not produce a platform download claim', async () => {
  const result = await run({ platform: 'Win32' }, []);
  assert.equal(result.label.textContent, 'Get Max for desktop');
  assert.ok(result.rows.every(row => row.link.textContent === 'View release'));
});
test('network failure keeps immediate fallback links', async () => {
  const result = await run({ platform: 'Win32' }, assets, true);
  assert.equal(result.button.href, '/download');
  assert.equal(result.label.textContent, 'Get Max for desktop');
});
test('Linux can use a release with only Flatpak', async () => {
  assert.equal((await run({ platform: 'Linux' }, assets.filter(a => a.name.endsWith('.flatpak')))).label.textContent, 'Download for Linux');
});
test('without JavaScript both hero buttons link to desktop choices', () => {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  assert.equal((html.match(/data-download class="[^"]+" href="\/download"/g) || []).length, 2);
  assert.equal((html.match(/data-download-label>Get Max for desktop/g) || []).length, 2);
});
