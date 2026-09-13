const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { origin, pages } = require('../site.config.cjs');
const read = name => fs.readFileSync(path.join(__dirname, '../dist', name), 'utf8');
for (const page of pages) test(`${page.path}: complete static metadata and semantic content`, () => {
  const html = read(page.file);
  assert.equal((html.match(/<title>/g) || []).length, 1);
  assert.equal((html.match(/name="description"/g) || []).length, 1);
  assert.equal((html.match(/rel="canonical"/g) || []).length, 1);
  assert.ok(html.includes(`rel="canonical" href="${origin}${page.path}"`));
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.ok(html.includes('<main id="main"'));
  assert.doesNotMatch(html, /noindex|nofollow|trymax\.sh|trymax\.vercel\.app/i);
  for (const kind of ['og', 'twitter']) for (const field of ['title', 'description', 'image', 'image:alt']) {
    assert.equal((html.match(new RegExp(`(?:property|name)="${kind}:${field}"`, 'g')) || []).length, 1);
  }
  const json = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.deepEqual(json['@graph'].map(node => node['@type']), ['WebSite', 'SoftwareApplication']);
  assert.doesNotMatch(JSON.stringify(json), /aggregateRating|reviewCount|offers/);
  for (const match of html.matchAll(/(?:src|href)="(\/[^"?#]*)/g)) {
    if (['/', '/download', '/#main'].includes(match[1])) continue;
    assert.ok(fs.existsSync(path.join(__dirname, '../dist', match[1])), `missing local asset ${match[1]}`);
  }
  for (const match of html.matchAll(/<img\b[^>]*>/g)) assert.match(match[0], /alt="[^"]*"/);
});
test('crawler files list only the two canonical public pages', () => {
  assert.equal(read('robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
  assert.deepEqual([...read('sitemap.xml').matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]), pages.map(p => origin + p.path));
});
test('copy distinguishes local data, blueprint configuration and full backup', () => {
  const html = read('index.html');
  assert.doesNotMatch(html, /Your whole workspace|is one file on|One workspace file|Copy your workspace to move/);
  assert.match(html, /does not contain all your records/);
  assert.match(html, /A complete copy of your workspace, including its data, that you can restore/);
  assert.match(html, /Open Max\. Get to work\./);
  assert.match(html, /Read the code\. Make it yours\./);
});
