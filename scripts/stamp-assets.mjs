// Adds ?v=<content hash> to every local stylesheet and script link. GitHub Pages lets browsers
// cache assets for ten minutes, so without this a fresh page can load yesterday's CSS or JS.
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assetReference = /\b(href|src)="((?:\.\.\/)?assets\/[^"?#]+\.(?:css|js))(?:\?v=[0-9a-f]+)?"/g;

export const htmlPages = () => ['index.html', ...['en', 'id'].flatMap(locale => readdirSync(path.join(root, locale))
  .filter(name => name.endsWith('.html'))
  .map(name => `${locale}/${name}`))];

const assetVersion = file => createHash('sha256').update(readFileSync(path.join(root, file))).digest('hex').slice(0, 10);

export const stampHtml = (page, html) => html.replace(assetReference, (match, attribute, target) => {
  const file = path.normalize(path.join(path.dirname(page), target));
  return `${attribute}="${target}?v=${assetVersion(file)}"`;
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  let changed = 0;
  for (const page of htmlPages()) {
    const html = readFileSync(path.join(root, page), 'utf8');
    const stamped = stampHtml(page, html);
    if (stamped !== html) {
      writeFileSync(path.join(root, page), stamped);
      changed += 1;
    }
  }
  console.log(`Asset versions updated in ${changed} page${changed === 1 ? '' : 's'}.`);
}
