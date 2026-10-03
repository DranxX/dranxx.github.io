// Adds ?v=<content hash> to every local stylesheet and script link. GitHub Pages lets browsers
// cache assets for ten minutes, so without this a fresh page can load yesterday's CSS or JS.
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assetReference = /\b(href|src)="((?:\.\.\/)?assets\/[^"?#]+\.(?:css|js))(?:\?v=[0-9a-f]+)?"/g;

const htmlFiles = (directory, prefix = '') => readdirSync(path.join(root, directory), { withFileTypes: true })
  .flatMap(entry => {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) return htmlFiles(path.join(directory, entry.name), relativePath);
    return entry.isFile() && entry.name.endsWith('.html') ? [relativePath] : [];
  });

export const htmlPages = () => ['index.html', ...['en', 'id'].flatMap(locale => htmlFiles(locale, locale))];

const assetVersion = file => createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 10);

export const stampHtml = (page, html) => {
  const baseHref = html.match(/<base\s+href=["']([^"']+)["']/i)?.[1];
  const assetBase = baseHref
    ? path.resolve(root, path.dirname(page), baseHref)
    : path.resolve(root, path.dirname(page));
  return html.replace(assetReference, (match, attribute, target) => {
  const file = path.resolve(assetBase, target);
  return `${attribute}="${target}?v=${assetVersion(file)}"`;
  });
};

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
