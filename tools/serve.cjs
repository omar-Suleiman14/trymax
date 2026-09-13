const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../dist');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.xml': 'application/xml', '.txt': 'text/plain', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };
http.createServer((req, res) => {
  const route = new URL(req.url, 'http://localhost').pathname;
  const redirect = route === '/index.html' ? '/' : route.endsWith('.html') ? route.slice(0, -5) : route !== '/' && route.endsWith('/') ? route.slice(0, -1) : null;
  if (redirect) { res.writeHead(308, { Location: redirect }); res.end(); return; }
  const filename = route === '/' ? 'index.html' : route === '/download' ? 'download.html' : route.slice(1);
  const file = path.resolve(root, filename);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end('Not found'); return; }
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(4173, '127.0.0.1', () => console.log('Preview: http://127.0.0.1:4173'));
