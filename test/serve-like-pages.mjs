/**
 * Serves dist/ the way GitHub Pages does, so the built site can be tested in
 * the shape it will actually be deployed in.
 *
 * `astro preview` serves dist/ at the root and ignores `base`, so a subpath
 * build's links (/levels_website/ielts) all 404 against it even though the
 * build is correct. This mirrors Pages instead:
 *
 *   - the whole site is mounted under a base path
 *   - an extensionless URL falls back to <path>.html (Pages does this)
 *   - a directory request falls back to index.html
 *   - anything unmatched gets 404.html with a 404 status
 *
 *   node test/serve-like-pages.mjs [--base /levels_website] [--port 4322]
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};

const BASE = flag('base', '').replace(/\/+$/, '');
const PORT = Number(flag('port', 4322));
const ROOT = path.resolve(flag('dir', 'dist'));

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

async function readIfFile(candidate) {
  try {
    const info = await stat(candidate);
    if (!info.isFile()) return null;
    return await readFile(candidate);
  } catch {
    return null;
  }
}

const server = createServer(async (req, res) => {
  let pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);

  if (BASE) {
    if (pathname === BASE) pathname = '/';
    else if (pathname.startsWith(`${BASE}/`)) pathname = pathname.slice(BASE.length);
    else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end(`not under base ${BASE}`);
    }
  }

  // Keep the resolved path inside ROOT regardless of what the request contains.
  const target = path.join(ROOT, path.normalize(pathname).replace(/^(\.\.[/\\])+/, ''));
  if (!target.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end('forbidden');
  }

  const candidates = pathname.endsWith('/')
    ? [path.join(target, 'index.html')]
    : [target, `${target}.html`, path.join(target, 'index.html')];

  for (const candidate of candidates) {
    const body = await readIfFile(candidate);
    if (!body) continue;
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(candidate)] ?? 'application/octet-stream',
    });
    return res.end(body);
  }

  const notFound = await readIfFile(path.join(ROOT, '404.html'));
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(notFound ?? 'Not found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`serving ${ROOT} at http://127.0.0.1:${PORT}${BASE || ''}`);
});
