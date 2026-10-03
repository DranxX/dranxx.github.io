import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number.parseInt(process.env.PORT || '4173', 10);
const host = process.env.HOST || '127.0.0.1';

const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2'
};

const withinRoot = candidate => candidate === root || candidate.startsWith(`${root}${path.sep}`);

const resolveRequest = async pathname => {
  const decoded = decodeURIComponent(pathname);
  let candidate = path.resolve(root, `.${decoded}`);
  if (!withinRoot(candidate)) return null;

  try {
    const details = await stat(candidate);
    if (details.isDirectory()) candidate = path.join(candidate, 'index.html');
  } catch {
    if (!path.extname(candidate)) candidate = `${candidate}.html`;
  }

  return withinRoot(candidate) ? candidate : null;
};

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${request.headers.host || host}`);
    const requestedFile = await resolveRequest(url.pathname === '/' ? '/index.html' : url.pathname);
    if (!requestedFile) {
      response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Forbidden');
      return;
    }

    try {
      const content = await readFile(requestedFile);
      response.writeHead(200, {
        'Content-Type': types[path.extname(requestedFile).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-store'
      });
      response.end(content);
    } catch {
      const fallbackLocale = url.pathname.startsWith('/id/') ? 'id' : 'en';
      const fallback = await readFile(path.join(root, fallbackLocale, '404.html'));
      response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      response.end(fallback);
    }
  } catch (error) {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end(`Server error: ${error.message}`);
  }
});

server.listen(port, host, () => {
  console.log(`DranxX Web running at http://${host}:${port}`);
});
