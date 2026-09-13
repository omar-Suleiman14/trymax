const fs = require('node:fs');
const path = require('node:path');
const { origin, pages, googleSiteVerification } = require('../site.config.cjs');
const root = path.join(__dirname, '..');
const out = path.join(root, 'dist');
const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
if (new URL(origin).origin !== origin) throw new Error('origin must be an absolute origin without a trailing slash');
fs.mkdirSync(out, { recursive: true });
const image = `${origin}/assets/app-graph.png?v=20260913-3`;
const imageAlt = 'Max desktop workspace showing a graph of linked pages, colour groups and filters.';
for (const page of pages) {
  const url = origin + page.path;
  const graph = [{ '@type': 'WebSite', '@id': origin + '/#website', name: 'Max', url: origin + '/', description: pages[0].description }, {
    '@type': 'SoftwareApplication', '@id': origin + '/#software', name: 'Max', url: origin + '/',
    description: pages[0].description, applicationCategory: 'BusinessApplication',
    operatingSystem: ['Windows (x64)', 'macOS (Apple silicon)', 'Linux (x64)'],
    downloadUrl: origin + '/download', inLanguage: ['en', 'ar'],
    license: 'https://github.com/omar-Suleiman14/max/blob/main/LICENSE',
  }];
  const verification = process.env.GOOGLE_SITE_VERIFICATION || googleSiteVerification;
  const seo = [
    `<title>${escape(page.title)}</title>`,
    `<meta name="description" content="${escape(page.description)}">`,
    `<link rel="canonical" href="${url}">`,
    '<meta property="og:type" content="website">', '<meta property="og:site_name" content="Max">',
    `<meta property="og:url" content="${url}">`,
    ...['og', 'twitter'].flatMap(kind => [
      `<meta ${kind === 'og' ? 'property' : 'name'}="${kind}:title" content="${escape(page.title)}">`,
      `<meta ${kind === 'og' ? 'property' : 'name'}="${kind}:description" content="${escape(page.description)}">`,
      `<meta ${kind === 'og' ? 'property' : 'name'}="${kind}:image" content="${image}">`,
      `<meta ${kind === 'og' ? 'property' : 'name'}="${kind}:image:alt" content="${imageAlt}">`,
    ]),
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="theme-color" content="#09090b">',
    '<link rel="manifest" href="/site.webmanifest">',
    ...(verification ? [`<meta name="google-site-verification" content="${escape(verification)}">`] : []),
    `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replaceAll('<', '\\u003c')}</script>`,
  ].join('\n');
  const file = path.join(root, page.file);
  const html = fs.readFileSync(file, 'utf8').replace(/<!-- SEO:START -->[\s\S]*?<!-- SEO:END -->/, `<!-- SEO:START -->\n${seo}\n<!-- SEO:END -->`);
  fs.writeFileSync(file, html);
  fs.writeFileSync(path.join(out, page.file), html);
}
const generated = {
  'robots.txt': `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`,
  'sitemap.xml': `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(page => `  <url><loc>${origin}${page.path}</loc></url>`).join('\n')}\n</urlset>\n`,
  'site.webmanifest': JSON.stringify({ name: 'Max — Offline Desktop Workspace', short_name: 'Max', icons: [192, 512].map(size => ({ src: `/assets/max-icon-${size}.png?v=20260913-transparent`, sizes: `${size}x${size}`, type: 'image/png' })), theme_color: '#09090b', background_color: '#09090b' }, null, 2) + '\n',
};
for (const [name, contents] of Object.entries(generated)) {
  fs.writeFileSync(path.join(root, name), contents);
  fs.writeFileSync(path.join(out, name), contents);
}
for (const file of ['styles.css', 'site.js', 'analytics.js', 'favicon.ico', 'apple-touch-icon.png']) fs.copyFileSync(path.join(root, file), path.join(out, file));
fs.cpSync(path.join(root, 'assets'), path.join(out, 'assets'), { recursive: true });
console.log('Built two static pages, crawler metadata and public assets in dist/.');
