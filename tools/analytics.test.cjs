const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../analytics.js'), 'utf8');

/* A node is the set of selectors it answers to, plus the ancestors a selector
   can reach, which is all analytics.js ever asks a click target for. */
const el = (spec = {}) => ({
  selectors: spec.selectors ?? [],
  ancestors: spec.ancestors ?? {},
  dataset: spec.dataset ?? {},
  href: spec.href ?? '',
  textContent: spec.text ?? '',
  matches(selector) {
    return selector.split(',').some((one) => this.selectors.includes(one.trim()));
  },
  closest(selector) {
    if (this.matches(selector)) return this;
    for (const one of selector.split(',').map((s) => s.trim())) if (this.ancestors[one]) return this.ancestors[one];
    return null;
  },
});

/* __SV short-circuits the loader snippet, so the stub below is the posthog the
   page code talks to and no script tag is ever inserted. */
function click(node, { platform = 'mac', version = 'v1.2.3' } = {}, key = 'phc_test') {
  const captured = [];
  const posthog = { __SV: 1, init() {}, capture: (name, properties) => captured.push([name, properties]) };
  const context = {
    posthog,
    window: { posthog },
    URL,
    location: { hostname: 'trymax.sh', protocol: 'https:', href: 'https://trymax.sh/', origin: 'https://trymax.sh' },
    document: {
      documentElement: { dataset: { platform } },
      querySelector: (selector) => (selector === '[data-version]' ? { textContent: version } : null),
      addEventListener: (name, handler) => { context.click = handler; },
    },
  };
  vm.runInNewContext(source.replace(/const PROJECT_KEY = '[^']*'/, `const PROJECT_KEY = '${key}'`), context);
  context.click?.({ target: node, button: 0 });
  /* The events are built inside the vm, so they are copied out before any
     comparison, which otherwise trips over the other realm's prototypes. */
  return JSON.parse(JSON.stringify(captured));
}

test('the hero button reports the platform the site detected', () => {
  const node = el({ selectors: ['a[href]', '[data-download]', '.btn'], ancestors: { '.hero': el() } });
  assert.deepEqual(click(node), [
    ['download_clicked', { platform: 'mac', asset: 'mac', platform_source: 'detected', location: 'hero', version: 'v1.2.3' }],
  ]);
});

test('a download page row reports the platform the visitor chose', () => {
  const node = el({
    selectors: ['a[href]', '[data-asset-link]', '.btn'],
    ancestors: { '[data-asset]': el({ dataset: { asset: 'flatpak' } }), '.dl-row': el() },
  });
  assert.deepEqual(click(node, { platform: 'win' }), [
    ['download_platform_selected', { platform: 'flatpak', location: 'download-page-row' }],
    ['download_clicked', { platform: 'linux', asset: 'flatpak', platform_source: 'chosen', location: 'download-page-row', version: 'v1.2.3' }],
  ]);
});

test('a placeholder version is left off the event', () => {
  const node = el({ selectors: ['a[href]', '[data-download]'], ancestors: { '.hero': el() } });
  assert.equal(click(node, { version: 'Download' })[0][1].version, null);
});

test('GitHub links are named by where they go, not by their URL', () => {
  const link = (href, ancestors) => el({ selectors: ['a[href]'], href, ancestors });
  assert.deepEqual(click(link('https://github.com/omar-Suleiman14/max', { '.hero': el() })), [
    ['github_clicked', { destination: 'repo', location: 'hero' }],
  ]);
  assert.deepEqual(click(link('https://github.com/omar-Suleiman14/max/releases/latest', { '.nav': el() })), [
    ['github_clicked', { destination: 'releases', location: 'nav' }],
  ]);
  assert.deepEqual(click(link('https://github.com/omar-Suleiman14/max/fork', { 'section[id]': Object.assign(el(), { id: 'open' }) })), [
    ['github_clicked', { destination: 'fork', location: 'open' }],
  ]);
});

test('the ghost button to the download page is a CTA, not a download', () => {
  const node = el({
    selectors: ['a[href]', '.btn'],
    href: 'https://trymax.sh/download',
    text: '  Windows, macOS,\n  Linux ',
    ancestors: { 'section[id]': Object.assign(el(), { id: 'download' }) },
  });
  assert.deepEqual(click(node), [
    ['cta_clicked', { label: 'Windows, macOS, Linux', href: '/download', location: 'download' }],
  ]);
});

test('nothing is sent until a real project key is pasted in', () => {
  const node = el({ selectors: ['a[href]', '[data-download]'], ancestors: { '.hero': el() } });
  assert.deepEqual(click(node, {}, 'phc_REPLACE_WITH_PROJECT_KEY'), []);
});

test('both pages load the analytics script', () => {
  for (const page of ['index.html', 'download.html']) {
    assert.match(fs.readFileSync(path.join(__dirname, '..', page), 'utf8'), /<script src="\/analytics\.js" defer><\/script>/);
  }
});
