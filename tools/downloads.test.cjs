const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(require('node:path').join(__dirname, '../site.js'), 'utf8');
const asset = name => ({ name, browser_download_url: `https://example.com/${name}` });
async function clickDownload(assets, cached) {
  let click;
  const button = {
    dataset: {}, classList: { add() {}, remove() {} }, setAttribute() {},
    closest(selector) { return selector === '[data-asset]' ? null : this; },
  };
  const window = { scrollY: 0, addEventListener() {}, location: {} };
  vm.runInNewContext(source, {
    navigator: { platform: 'MacIntel', userAgent: 'Macintosh' }, window,
    sessionStorage: { getItem: () => cached ? JSON.stringify({ assets: cached }) : null, setItem() {} },
    fetch: async () => ({ ok: true, json: async () => ({ assets }) }),
    document: {
      documentElement: { dataset: {} }, querySelector: () => null,
      querySelectorAll: selector => selector === '[data-download]' ? [button] : [],
      addEventListener: (name, handler) => { click = handler; },
    },
  });
  click({ target: button, button: 0, preventDefault() {} });
  await new Promise(resolve => setImmediate(resolve));
  return window.location.href;
}
test('Mac downloads ARM DMG even when ZIP and Intel DMG come first', async () => {
  const names = ['Max-darwin-arm64-1.0.0.zip', 'Max-1.0.0-x64.dmg', 'Max-1.0.0-arm64.dmg'];
  assert.equal(await clickDownload(names.map(asset)), 'https://example.com/Max-1.0.0-arm64.dmg');
});
test('missing ARM DMG opens latest release instead of an incompatible installer', async () => {
  assert.equal(await clickDownload(['Max-darwin-arm64-1.0.0.zip', 'Max-1.0.0-x64.dmg'].map(asset)), 'https://github.com/omar-Suleiman14/max/releases/latest');
});
test('click waits for live release instead of downloading cached version', async () => {
  assert.equal(await clickDownload([asset('Max-1.0.1-arm64.dmg')], [asset('Max-1.0.0-arm64.dmg')]), 'https://example.com/Max-1.0.1-arm64.dmg');
});
test('both version pills link to releases', () => {
  for (const page of ['index.html', 'download.html']) {
    assert.match(fs.readFileSync(require('node:path').join(__dirname, '..', page), 'utf8'), /class="nav-pill" href="https:\/\/github.com\/omar-Suleiman14\/max\/releases\/latest"/);
  }
});
