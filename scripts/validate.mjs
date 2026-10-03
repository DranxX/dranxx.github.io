import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { stampHtml } from './stamp-assets.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const locales = ['en', 'id'];
const publicPageNames = ['index.html', 'projects.html', 'resources.html', 'services.html', 'profile.html', 'contact.html'];
const compatibilityPageNames = ['platform.html', 'products.html', 'partners.html'];
const publicPages = [...locales.flatMap(locale => publicPageNames.map(page => `${locale}/${page}`)), ...locales.map(locale => `${locale}/Project/Bentengan/index.html`)];
const compatibilityPages = locales.flatMap(locale => compatibilityPageNames.map(page => `${locale}/${page}`));
const errorPages = locales.map(locale => `${locale}/404.html`);
const pages = [...publicPages, ...compatibilityPages, ...errorPages];
const projectStyles = [
  'assets/css/tokens.css',
  'assets/css/base.css',
  'assets/css/layout.css',
  'assets/css/components.css',
  'assets/css/pages.css',
  'assets/css/responsive.css'
];
const drxStyle = 'assets/vendor/drx/drx-framework.css';
const projectScripts = [
  'assets/js/site.config.js',
  'assets/js/data.js',
  'assets/js/shell.js',
  'assets/js/collections.js',
  'assets/js/app.js'
];
const featureScripts = [
  'assets/js/projects.data.js',
  'assets/js/projects.js',
  'assets/js/resources.data.js',
  'assets/js/resources.js'
];
const ownedScripts = [...projectScripts, ...featureScripts];
const drxScript = 'assets/vendor/drx/js/drx.js';
const scriptTools = ['scripts/serve.mjs', 'scripts/smoke.mjs', 'scripts/validate.mjs', 'scripts/stamp-assets.mjs'];
const linksAsset = (html, attribute, file) => new RegExp(`${attribute}="\\.\\./${file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\?v=[0-9a-f]+)?"`).test(html);
const issues = [];
let idCount = 0;
let projectCount = 0;
let technologyCount = 0;
let languageCount = 0;
let resourceCount = 0;
let caseStudyCount = 0;

// GitHub Pages serves /en/projects from projects.html and /en/ from index.html, so links may omit both.
const targetExists = target => {
  if (fs.existsSync(target)) return !fs.statSync(target).isDirectory() || fs.existsSync(path.join(target, 'index.html'));
  return !path.extname(target) && fs.existsSync(`${target}.html`);
};
const cleanRoute = fileName => (fileName === 'index.html' ? '' : fileName.replace(/\.html$/, ''));

const localTarget = (documentBase, rawTarget) => {
  const cleaned = rawTarget.split('#')[0].split('?')[0];
  if (!cleaned || /^(?:[a-z]+:|\/\/)/i.test(cleaned)) return null;
  const base = typeof documentBase === 'string' ? new URL(documentBase, 'https://local.invalid/') : documentBase;
  const resolved = new URL(cleaned, base);
  return path.join(root, decodeURIComponent(resolved.pathname.slice(1)));
};

const listFiles = (directory, extension) => {
  const results = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) results.push(...listFiles(absolute, extension));
    else if (!extension || entry.name.endsWith(extension)) results.push(absolute);
  }
  return results;
};

const validateMarkupNesting = (html, page) => {
  const voidElements = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
  const source = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  const stack = [];
  for (const match of source.matchAll(/<\/?([a-z][\w:-]*)\b[^>]*>/gi)) {
    const token = match[0];
    const tag = match[1].toLowerCase();
    if (voidElements.has(tag) || /\/>$/.test(token)) continue;
    if (!token.startsWith('</')) {
      stack.push(tag);
      continue;
    }
    const open = stack.pop();
    if (open !== tag) {
      issues.push(`${page}: invalid HTML nesting, expected </${open || 'nothing'}> before </${tag}>`);
      return;
    }
  }
  if (stack.length) issues.push(`${page}: unclosed HTML element <${stack.at(-1)}>`);
};

for (const page of pages) {
  const absolutePage = path.join(root, page);
  if (!fs.existsSync(absolutePage)) {
    issues.push(`${page}: file is missing`);
    continue;
  }

  const html = fs.readFileSync(absolutePage, 'utf8');
  const pageUrl = new URL(page, 'https://local.invalid/');
  const baseHref = html.match(/<base\s+href=["']([^"']+)["']/i)?.[1];
  const documentBase = baseHref ? new URL(baseHref, pageUrl) : pageUrl;
  validateMarkupNesting(html, page);
  const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(match => match[1]);
  const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  idCount += new Set(ids).size;
  if (duplicates.length) issues.push(`${page}: duplicate IDs: ${duplicates.join(', ')}`);
  // Headings are titles, not sentences: no trailing period.
  for (const [, , inner] of html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/g)) {
    const text = inner.replace(/<[^>]+>/g, '').trim();
    if (text.endsWith('.')) issues.push(`${page}: heading "${text}" must not end with a period`);
  }

  const requiredMarkup = [
    [/^<!doctype html>/i, 'doctype'],
    [/<html\b[^>]*\blang=["'][^"']+["']/i, 'language'],
    [/<title>[^<]+<\/title>/i, 'title'],
    [/<meta\b[^>]*name=["']description["'][^>]*content=["'][^"']+["']/i, 'description'],
    [/<link\b[^>]*rel=["']icon["'][^>]*href=["']\.\.\/assets\/profile_nobg\.webp["']/i, 'transparent identity favicon'],
    [/<body\b[^>]*data-page=["'][^"']+["']/i, 'page identity'],
    [/<site-header\b/i, 'shared header'],
    [/<main\b[^>]*id=["']main-content["']/i, 'main content landmark'],
    [/<site-footer\b/i, 'shared footer'],
    [/<site-ui\b/i, 'shared interaction layer'],
    [/<noscript>/i, 'no-script fallback'],
    [/class=["'][^"']*nojs-nav[^"']*["']/i, 'no-script navigation'],
    [new RegExp(`href=["']\\.\\./${drxStyle.replaceAll('/', '\\/')}(?:\\?v=[0-9a-f]+)?["']`), 'DRX CSS entrypoint'],
    [new RegExp(`src=["']\\.\\./${drxScript.replaceAll('/', '\\/')}(?:\\?v=[0-9a-f]+)?["']`), 'DRX JavaScript entrypoint']
  ];

  for (const [pattern, label] of requiredMarkup) {
    if (!pattern.test(html)) issues.push(`${page}: missing ${label}`);
  }

  for (const stylesheet of projectStyles) {
    if (!linksAsset(html, 'href', stylesheet)) issues.push(`${page}: missing stylesheet ../${stylesheet}`);
  }
  for (const script of projectScripts) {
    if (!linksAsset(html, 'src', script)) issues.push(`${page}: missing script ../${script}`);
  }
  if (stampHtml(page, html) !== html) issues.push(`${page}: stylesheet or script versions are stale; run npm run stamp`);
  const requiredFeatureScripts = page.endsWith('/resources.html')
    ? ['assets/js/resources.data.js', 'assets/js/resources.js']
    : page.endsWith('/Project/Bentengan/index.html')
      ? ['assets/js/projects.data.js', 'assets/js/projects.js']
      : [];
  for (const script of requiredFeatureScripts) {
    if (!linksAsset(html, 'src', script)) issues.push(`${page}: missing feature script ../${script}`);
  }

  if (publicPages.includes(page) && /name=["']robots["'][^>]*noindex/i.test(html)) {
    issues.push(`${page}: public page must not be noindex`);
  }
  if ([...compatibilityPages, ...errorPages].includes(page) && !/name=["']robots["'][^>]*noindex/i.test(html)) {
    issues.push(`${page}: retired or error page must be noindex`);
  }

  const expectedLocale = page.split('/')[0];
  if (!new RegExp(`<html\\b[^>]*\\blang=["']${expectedLocale}["']`, 'i').test(html)) {
    issues.push(`${page}: document language must match its locale directory`);
  }
  const route = page.slice(expectedLocale.length + 1).replace(/index\.html$/, '').replace(/\.html$/, '');
  for (const locale of locales) {
    const alternate = [...html.matchAll(/<link\b[^>]*rel=["']alternate["'][^>]*>/gi)]
      .find(([tag]) => tag.includes(`hreflang="${locale}"`));
    const href = alternate?.[0].match(/\bhref=["']([^"']+)["']/i)?.[1];
    if (!href || new URL(href, documentBase).pathname !== `/${locale}/${route}`) {
      issues.push(`${page}: missing ${locale} alternate-language route`);
    }
  }

  for (const match of html.matchAll(/\b(href|src)=["']([^"']+)["']/gi)) {
    const [, attribute, rawTarget] = match;
    const target = localTarget(documentBase, rawTarget);
    if (target && !targetExists(target)) issues.push(`${page}: ${attribute} target is missing: ${rawTarget}`);
    if (attribute === 'href' && target && /\.html$/.test(rawTarget.split(/[?#]/)[0])) issues.push(`${page}: link should use the extensionless route: ${rawTarget}`);
  }

  for (const match of html.matchAll(/<a\b[^>]*\btarget=["']_blank["'][^>]*>/gi)) {
    if (!/\brel=["'][^"']*noopener[^"']*["']/i.test(match[0])) {
      issues.push(`${page}: target="_blank" link is missing rel="noopener"`);
    }
  }

  if (/\son[a-z]+\s*=/i.test(html)) issues.push(`${page}: inline event handler found`);
  if (/\uFFFD|Ã¢|â€|Â©/.test(html)) issues.push(`${page}: suspicious text encoding`);
  if (/data-collection=/.test(html) && !/class=["'][^"']*nojs-state[^"']*["']/i.test(html)) {
    issues.push(`${page}: data-driven page is missing a useful no-script content fallback`);
  }
}

const drxRoot = path.join(root, 'assets/vendor/drx');
const cssFiles = [
  ...projectStyles.map(file => path.join(root, file)),
  ...listFiles(drxRoot, '.css')
];

for (const absoluteStylesheet of cssFiles) {
  const source = fs.readFileSync(absoluteStylesheet, 'utf8');
  const relative = path.relative(root, absoluteStylesheet).replaceAll('\\', '/');
  const stripped = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, '');
  const openBraces = (stripped.match(/{/g) || []).length;
  const closeBraces = (stripped.match(/}/g) || []).length;
  if (openBraces !== closeBraces) issues.push(`${relative}: unbalanced braces (${openBraces}/${closeBraces})`);
  if (/\uFFFD/.test(source)) issues.push(`${relative}: replacement character found`);
}

const tokenSource = fs.readFileSync(path.join(root, 'assets/css/tokens.css'), 'utf8');
const layoutSource = fs.readFileSync(path.join(root, 'assets/css/layout.css'), 'utf8');
const componentStyleSource = fs.readFileSync(path.join(root, 'assets/css/components.css'), 'utf8');
const pageStyleSource = fs.readFileSync(path.join(root, 'assets/css/pages.css'), 'utf8');
const responsiveSource = fs.readFileSync(path.join(root, 'assets/css/responsive.css'), 'utf8');
const shellSource = fs.readFileSync(path.join(root, 'assets/js/shell.js'), 'utf8');
const collectionSource = fs.readFileSync(path.join(root, 'assets/js/collections.js'), 'utf8');
const resourceRuntimeSource = fs.readFileSync(path.join(root, 'assets/js/resources.js'), 'utf8');
const caseStudyRuntimeSource = fs.readFileSync(path.join(root, 'assets/js/projects.js'), 'utf8');
const homeSource = fs.readFileSync(path.join(root, 'en/index.html'), 'utf8');
const indonesianHomeSource = fs.readFileSync(path.join(root, 'id/index.html'), 'utf8');
const projectsSource = fs.readFileSync(path.join(root, 'en/projects.html'), 'utf8');
const resourcesSource = fs.readFileSync(path.join(root, 'en/resources.html'), 'utf8');
const caseStudySource = fs.readFileSync(path.join(root, 'en/Project/Bentengan/index.html'), 'utf8');
const profileSource = fs.readFileSync(path.join(root, 'en/profile.html'), 'utf8');
const contactSource = fs.readFileSync(path.join(root, 'en/contact.html'), 'utf8');
const identityAsset = path.join(root, 'assets/profile.webp');
const faviconAsset = path.join(root, 'assets/profile_nobg.webp');

if (!fs.existsSync(identityAsset) || fs.statSync(identityAsset).size === 0) {
  issues.push('assets/profile.webp: canonical DranxX identity asset is missing or empty');
}
if (!fs.existsSync(faviconAsset) || fs.statSync(faviconAsset).size === 0) {
  issues.push('assets/profile_nobg.webp: transparent DranxX favicon is missing or empty');
}
if (!/<img\b[^>]*src=["']\.\.\/assets\/profile\.webp["'][^>]*alt=["']The DranxX identity mark["']/i.test(profileSource)) {
  issues.push('profile.html: profile image must use the canonical identity asset with meaningful alternative text');
}

if (!/--space-section:\s*clamp\(/.test(tokenSource) || !/--text-copy:\s*13px/.test(tokenSource)) {
  issues.push('assets/css/tokens.css: shared section and readable-copy scales are missing');
}
if (!/\.section\s*\{[\s\S]*?padding:\s*var\(--space-section\)/.test(layoutSource)) {
  issues.push('assets/css/layout.css: sections must use the shared vertical rhythm token');
}
if (!/\.technology-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3,/.test(pageStyleSource)) {
  issues.push('assets/css/pages.css: desktop technology grid must use three balanced columns');
}
if (!/\.language-list\s*\{[\s\S]*?grid-template-columns:\s*repeat\(5,/.test(pageStyleSource)) {
  issues.push('assets/css/pages.css: desktop language list must use five compact cards');
}
if (!/\.technology-grid\s*\{\s*grid-template-columns:\s*repeat\(2,/.test(responsiveSource)
  || !/\.technology-grid\s*\{\s*grid-template-columns:\s*1fr/.test(responsiveSource)) {
  issues.push('assets/css/responsive.css: technology grid must step from three to two to one column');
}
if (!/\.language-list\s*\{\s*grid-template-columns:\s*repeat\(3,/.test(responsiveSource)
  || !/\.language-list\s*\{\s*grid-template-columns:\s*repeat\(2,/.test(responsiveSource)
  || !/\.language-list\s*\{\s*grid-template-columns:\s*1fr/.test(responsiveSource)) {
  issues.push('assets/css/responsive.css: language cards must step from five to three, two, and one column');
}
if (!/@media \(max-width: 900px\)[\s\S]*?\.profile-layout\s*\{\s*grid-template-columns:\s*1fr/.test(responsiveSource)) {
  issues.push('assets/css/responsive.css: Profile must collapse before tablet content becomes cramped');
}
if (/wrap split language-layout/.test(profileSource) || !/class="section-head drx-reveal"[\s\S]*?id="languages-title"/.test(profileSource)) {
  issues.push('profile.html: language section must use the shared section header instead of the oversized split layout');
}
if (!/data-resource-catalog/.test(resourcesSource)
  || !/data-resource-filters/.test(resourcesSource)
  || !/data-resource-list/.test(resourcesSource)
  || !/data-resource-modal-root/.test(resourcesSource)) {
  issues.push('resources.html: catalog, filters, list, or modal root is missing');
}
if (/Title: '[^']*\.'/.test(caseStudyRuntimeSource)) {
  issues.push('assets/js/projects.js: case-study section titles must not end with a period');
}
if (!/class ResourceCatalog/.test(resourceRuntimeSource)
  || !/version\.published && version\.channel === 'stable'/.test(resourceRuntimeSource)
  || !/rawBase/.test(resourceRuntimeSource)
  || !/download:\s*resource\.fileName/.test(resourceRuntimeSource)
  || !/data-resource-details/.test(resourceRuntimeSource)
  || !/getSourceUrl/.test(resourceRuntimeSource)
  || !/resource\.installation/.test(resourceRuntimeSource)
  || !/resource\.terms/.test(resourceRuntimeSource)) {
  issues.push('assets/js/resources.js: modular catalog, stable-only publication, direct download, per-resource source, setup, and terms, or detail modal behavior is missing');
}
if (!/data-project-case-study="bentengan"/.test(caseStudySource)
  || !/class ProjectCaseStudy/.test(caseStudyRuntimeSource)
  || !/if \(this\.project\.links\.play\)/.test(caseStudyRuntimeSource)
  || !/addEventListener\('error',[\s\S]*?image\.remove\(\)/.test(caseStudyRuntimeSource)) {
  issues.push('Bentengan case study: detailed renderer, optional media fallback, or conditional Play action is missing');
}
if (!/\.resource-grid\s*\{[\s\S]*?repeat\(3,/.test(pageStyleSource)
  || !/\.resource-modal/.test(pageStyleSource)
  || !/\.project-case-banner/.test(pageStyleSource)
  || !/\.case-credits/.test(pageStyleSource)) {
  issues.push('assets/css/pages.css: resource library or Bentengan case-study layout is incomplete');
}
if (!/dataset\.proficiency/.test(collectionSource)
  || !/\.language-item\[data-proficiency="active"\]/.test(pageStyleSource)
  || !/\.language-item\[data-proficiency="developing"\]/.test(pageStyleSource)
  || !/\.language-item\[data-proficiency="beginner"\]/.test(pageStyleSource)) {
  issues.push('Profile languages: semantic card data or green/yellow/red treatments are missing');
}
if (!/Currently on Roblox/.test(homeSource)
  || !/<h1[^>]*id="home-title">Hi, I’m DranxX<\/h1>/.test(homeSource)
  || !/<section class="home-hero"[\s\S]*?<\/section>\s*<div class="scope-divider"/.test(homeSource)
  || !/drx-marquee-track/.test(homeSource)
  || !/Performance optimization/.test(homeSource)
  || !/Computer vision/.test(homeSource)
  || !/Roblox \/ Unity \/ Godot/.test(homeSource)) {
  issues.push('index.html: the homepage introduction must be followed by the framework marquee as a section boundary');
}
for (const [locale, source] of [['en', homeSource], ['id', indonesianHomeSource]]) {
  const logo = source.match(/<svg\b[^>]*class="studio-mark"[\s\S]*?<\/svg>/)?.[0];
  if (!logo || /<(?:img|image|foreignObject)\b/.test(logo)) {
    issues.push(`${locale}/index.html: the homepage logo must be drawn with inline SVG rather than a bitmap`);
  }
}
if (!/\.scope-divider \.scope-marquee\s*\{[\s\S]*?rotate\(-1\.15deg\)/.test(pageStyleSource)) {
  issues.push('assets/css/pages.css: Home scope marquee must retain the angled Template-style section boundary');
}
if (/hero-facts|scope-ticker/.test(`${homeSource}\n${pageStyleSource}\n${responsiveSource}`)) {
  issues.push('Home: rejected hero facts and duplicate ticker implementation must not return');
}
if (!/\.hero-title\s*\{[^}]*text-transform:\s*none/.test(pageStyleSource)
  || !/\.profile-name\s*\{[^}]*text-transform:\s*none/.test(pageStyleSource)
  || !/\.nav-logo\s*\{[^}]*text-transform:\s*uppercase/.test(componentStyleSource)
  || !/\.nojs-brand\s*\{[^}]*text-transform:\s*uppercase/.test(componentStyleSource)
  || !/\.footer-brand\s*\{[^}]*text-transform:\s*uppercase/.test(componentStyleSource)) {
  issues.push('Brand identity: hero and Profile must keep DranxX casing while navbar and footer use the approved uppercase treatment');
}
if (/Sitemap/.test(shellSource)
  || !/`© \$\{new Date\(\)\.getFullYear\(\)\} `, create\('em', '', 'DranxX Studio'\)/.test(shellSource)) {
  issues.push('assets/js/shell.js: footer must use plain portfolio copy without the unexplained Sitemap link');
}
if (/UTC\+7/.test(homeSource)) {
  issues.push('index.html: timezone belongs on the Profile page, not the Home page');
}
if (/data-wib-clock|Local time|WIB --:--:--/.test(`${homeSource}\n${profileSource}\n${contactSource}`)) {
  issues.push('public pages: unnecessary local-time UI must not be present');
}
if (!/Indonesia · UTC\+7/.test(profileSource) || !/Blacksmithing[\s\S]*?metallurgy/i.test(profileSource) || !/chess\.com\/member\/bramadyafiqri/.test(profileSource)) {
  issues.push('profile.html: biography must include UTC+7, combined metallurgy/blacksmithing, and the Chess profile link');
}
if (!/<dd>Games · Software · AI\/ML · Security<\/dd>/.test(profileSource)
  || /Working mostly in/.test(profileSource)) {
  issues.push('profile.html: sidebar must describe broad project scope instead of labeling DranxX by Roblox');
}
if (!/\.profile-link-logo\s*\{[^}]*object-fit:\s*contain/.test(pageStyleSource)
  || !fs.existsSync(path.join(root, 'assets/brands/chess-com.png'))
  || !/<img[^>]+class="profile-link-logo"[^>]+src="\.\.\/assets\/brands\/chess-com\.png"/.test(profileSource)
  || /profile-link-monogram/.test(profileSource)
  || (profileSource.match(/chess\.com\/member\/bramadyafiqri/g) || []).length !== 1) {
  issues.push('profile.html: Chess.com must use its local official logo and one account link');
}
if (!/brands\/discord\.svg/.test(profileSource)
  || !/brands\/instagram\.svg/.test(profileSource)
  || !/brands\/tiktok\.png/.test(profileSource)
  || !/brands\/youtube\.png/.test(profileSource)
  || !/brands\/github\.svg/.test(profileSource)
  || !/profile-link-logo/.test(profileSource)
  || !/bi bi-envelope/.test(profileSource)) {
  issues.push('profile.html: verified social and email actions must have recognizable icons');
}
if (!/class="profile-interests" aria-labelledby="interests-title"/.test(profileSource)
  || !/id="interests-title"/.test(profileSource)
  || !/class="profile-interest-grid"/.test(profileSource)
  || !/bi bi-book-half/.test(profileSource)
  || !/bi bi-controller/.test(profileSource)) {
  issues.push('profile.html: personal interests must have a labeled section and the three-category grid');
}
if (!/instagram\.com\/the_dranxx/.test(profileSource)
  || !/tiktok\.com\/@thedranxx/.test(profileSource)
  || !/dsc\.gg\/dranxx/.test(profileSource)) {
  issues.push('profile.html: verified corrected-README social links are incomplete');
}

const drxEntrySource = fs.readFileSync(path.join(root, drxStyle), 'utf8');
for (const match of drxEntrySource.matchAll(/@import\s+url\(["']?([^"')]+)["']?\)/g)) {
  const imported = path.resolve(path.dirname(path.join(root, drxStyle)), match[1]);
  if (!fs.existsSync(imported)) issues.push(`${drxStyle}: imported file is missing: ${match[1]}`);
}

for (const script of [...ownedScripts, drxScript, ...scriptTools]) {
  const result = spawnSync(process.execPath, ['--check', path.join(root, script)], { encoding: 'utf8' });
  if (result.status !== 0) issues.push(`${script}: JavaScript syntax error\n${result.stderr.trim()}`);
}

for (const script of ownedScripts) {
  const source = fs.readFileSync(path.join(root, script), 'utf8');
  if (/\.innerHTML\s*=|insertAdjacentHTML\s*\(/.test(source)) {
    issues.push(`${script}: HTML string insertion is not allowed in project-owned runtime code`);
  }
}

if (!/opengraph\.githubassets\.com/.test(collectionSource) || !/project-preview/.test(collectionSource)) {
  issues.push('assets/js/collections.js: GitHub repository preview renderer is missing');
}
if (!/addEventListener\(['"]error['"][\s\S]*?preview\.remove\(\)/.test(collectionSource)
  || !/project-code/.test(collectionSource)) {
  issues.push('assets/js/collections.js: repository previews must retain an offline/error fallback');
}
const contactRuntimeSource = fs.readFileSync(path.join(root, 'assets/js/app.js'), 'utf8');
if (!/formsubmit\.co\/ajax\/\$\{config\.email\}/.test(contactRuntimeSource)
  || !/data-contact-form/.test(contactSource)
  || !/name="_honey"/.test(contactSource)
  || !/href="mailto:dranxx\.contact@gmail\.com">dranxx\.contact@gmail\.com<\/a>/.test(contactSource)) {
  issues.push('contact.html: the form must send through FormSubmit with a honeypot, and the address must be a plain mailto link');
}
if (!/'project-showcase': renderShowcase/.test(collectionSource)
  || !/const items = getOrderedProjects\(\)\.filter\(item => !item\.archived\);/.test(collectionSource)
  || /homeProjectIds|featuredProjectIds|scope-sample/.test(collectionSource)) {
  issues.push('assets/js/collections.js: Home showcase must render every active catalog project');
}
if (!/api\.github\.com\/users\/\$\{encodeURIComponent\(github\.user\)\}\/repos/.test(collectionSource)
  || !/\.filter\(repo => !repo\.fork\)/.test(collectionSource)
  || !/github:\s*Object\.freeze\(\{\s*user: 'DranxX'/.test(fs.readFileSync(path.join(root, 'assets/js/site.config.js'), 'utf8'))) {
  issues.push('assets/js/collections.js: the catalog must sync DranxX repositories from GitHub and skip forks');
}
for (const [page, source] of [['en/index.html', homeSource], ['id/index.html', indonesianHomeSource]]) {
  if (!/<div class="scope-divider"[\s\S]*?<\/div>\s*<section class="section home-section" aria-labelledby="work-title">[\s\S]*?data-collection="project-showcase"/.test(source)) {
    issues.push(`${page}: project showcase must directly follow the hero and scope divider`);
  }
}
if (!/\.showcase-progress/.test(pageStyleSource) || /\.carousel-choice|data-case-study-list/.test(`${pageStyleSource}\n${projectsSource}`)) {
  issues.push('Project showcase: progress styles are missing or the old thumbnail carousel returned');
}

try {
  const dataSource = fs.readFileSync(path.join(root, 'assets/js/data.js'), 'utf8');
  const context = { window: { DRANXX_CONFIG: { locale: 'en', assetBase: '../assets' } } };
  vm.runInNewContext(dataSource, context, { filename: 'assets/js/data.js' });
  const portfolioData = context.window.DRANXX_DATA;
  const projects = Array.isArray(portfolioData?.projects) ? portfolioData.projects : [];
  const technologyGroups = Array.isArray(portfolioData?.technologyGroups) ? portfolioData.technologyGroups : [];
  const languages = Array.isArray(portfolioData?.languages) ? portfolioData.languages : [];

  projects.forEach((project, index) => {
    projectCount += 1;
    if (!project.id || !project.name || !project.code || !project.url) {
      issues.push(`assets/js/data.js: project ${index + 1} is missing preview metadata`);
      return;
    }
    const previewTarget = project.preview && localTarget('en/index.html', project.preview);
    if (previewTarget && !fs.existsSync(previewTarget)) issues.push(`assets/js/data.js: ${project.name} preview file is missing`);
    if (!Array.isArray(project.scopes) || !project.scopes.length || project.scopes.some(scope => !['game', 'software', 'automation', 'ai'].includes(scope))) {
      issues.push(`assets/js/data.js: ${project.name} must use one or more supported evidence-based scopes`);
    }
    if (project.kind === 'case-study') {
      const detailTarget = localTarget('en/index.html', project.url);
      if (!detailTarget || !targetExists(detailTarget)) issues.push(`assets/js/data.js: ${project.name} detail route is missing`);
      return;
    }
    const repository = project.kind === 'repository' || !project.kind;
    if (repository && (project.source !== 'original' || project.visibility !== 'public' || project.archived !== false || project.fork !== false)) {
      issues.push(`assets/js/data.js: ${project.name} must match the verified GitHub metadata: public, non-archived, original`);
    }
    try {
      const repositoryUrl = new URL(project.url);
      const pathParts = repositoryUrl.pathname.split('/').filter(Boolean);
      if (repository && (repositoryUrl.hostname.toLowerCase() !== 'github.com' || pathParts.length < 2)) {
        issues.push(`assets/js/data.js: ${project.name} must point to a GitHub repository URL`);
      }
    } catch {
      issues.push(`assets/js/data.js: ${project.name} has an invalid repository URL`);
    }
  });

  technologyGroups.forEach((group, groupIndex) => {
    if (!group.title || !group.note || !Array.isArray(group.items) || !group.items.length) {
      issues.push(`assets/js/data.js: technology group ${groupIndex + 1} is incomplete`);
      return;
    }
    group.items.forEach((item, itemIndex) => {
      technologyCount += 1;
      if (!item || typeof item !== 'object' || !item.name) {
        issues.push(`assets/js/data.js: technology item ${groupIndex + 1}.${itemIndex + 1} must be a named object`);
        return;
      }
      const iconTarget = item.iconSrc && localTarget('en/profile.html', item.iconSrc);
      if (!iconTarget || !fs.existsSync(iconTarget)) issues.push(`assets/js/data.js: ${item.name} is missing its local brand asset`);
      if (item.iconDarkSrc) {
        const darkTarget = localTarget('en/profile.html', item.iconDarkSrc);
        if (!darkTarget || !fs.existsSync(darkTarget)) issues.push(`assets/js/data.js: ${item.name} dark logo is missing`);
      }
      if (!item.short) issues.push(`assets/js/data.js: ${item.name} is missing its offline short label`);
    });
  });

  const gameTechnology = technologyGroups.find(group => group.title === 'Game development');
  const robloxStudio = gameTechnology?.items.find(item => item.name === 'Roblox Studio');
  const minecraftBedrock = gameTechnology?.items.find(item => item.name === 'Minecraft Bedrock tooling');
  if (!/brands\/roblox-studio\.svg/.test(robloxStudio?.iconSrc || '')) {
    issues.push('assets/js/data.js: Roblox Studio must use the dedicated 2025 icon from the corrected README');
  }
  if (!/brands\/minecraft-bedrock\.svg/.test(minecraftBedrock?.iconSrc || '')) {
    issues.push('assets/js/data.js: Minecraft tooling must use the dedicated Bedrock icon from the corrected README');
  }

  languages.forEach((language, index) => {
    languageCount += 1;
    if (!language.name || !language.level || !language.flag || !language.proficiency || !language.proficiencyLabel) {
      issues.push(`assets/js/data.js: language ${index + 1} is missing name, level, flag, or proficiency metadata`);
      return;
    }
    if (!['active', 'developing', 'beginner'].includes(language.proficiency)) {
      issues.push(`assets/js/data.js: ${language.name} has an unsupported proficiency state`);
    }
    const flagTarget = localTarget('en/profile.html', language.flag);
    if (!flagTarget || !fs.existsSync(flagTarget)) issues.push(`assets/js/data.js: ${language.name} flag is missing: ${language.flag}`);
  });
  const expectedProficiency = new Map([
    ['Indonesian', 'active'],
    ['English', 'active'],
    ['Japanese', 'developing'],
    ['Mandarin', 'beginner'],
    ['French', 'beginner']
  ]);
  if (languages.length !== expectedProficiency.size
    || [...expectedProficiency].some(([name, proficiency]) => languages.find(language => language.name === name)?.proficiency !== proficiency)) {
    issues.push('assets/js/data.js: language proficiency must map Indonesian/English to active, Japanese to developing, and Mandarin/French to beginner');
  }
  const discordBot = projects.find(item => item.name === 'DiscordBot');
  if (!discordBot?.scopes.includes('automation')) issues.push('assets/js/data.js: DiscordBot must be classified under bots and automation');

  const projectIds = new Set(projects.map(project => project.id));

  if (projects.find(project => project.id === 'corpus-cleaner')?.url !== 'https://github.com/DranxX/corpus-cleaner') {
    issues.push('assets/js/data.js: corpus-cleaner must link to the requested repository');
  }
  if (projectIds.size !== projects.length) issues.push('assets/js/data.js: project IDs must be unique');
} catch (error) {
  issues.push(`assets/js/data.js: structured portfolio data could not be evaluated: ${error.message}`);
}

try {
  const resourceDataSource = fs.readFileSync(path.join(root, 'assets/js/resources.data.js'), 'utf8');
  const context = { window: { DRANXX_CONFIG: { locale: 'en' } } };
  vm.runInNewContext(resourceDataSource, context, { filename: 'assets/js/resources.data.js' });
  const resourceData = context.window.DRANXX_RESOURCES;
  const items = Array.isArray(resourceData?.items) ? resourceData.items : [];
  resourceCount = items.length;
  if (items.length < 6) issues.push('assets/js/resources.data.js: the six public MyRobloxAssets packages must be present');
  const resourceConfigSource = fs.readFileSync(path.join(root, 'assets/js/site.config.js'), 'utf8');
  if (!Array.isArray(resourceData?.categories) || !resourceData.categories.some(category => category.id === 'all')) {
    issues.push('assets/js/resources.data.js: resource category metadata is incomplete');
  }
  if (new Set(items.map(item => item.id)).size !== items.length) issues.push('assets/js/resources.data.js: resource IDs must be unique');
  items.forEach((item, index) => {
    if (!item.id || !item.name || !item.description || !item.detail || !item.sourceId || !item.sourcePath || !item.fileName) {
      issues.push(`assets/js/resources.data.js: resource ${index + 1} is missing modular card or source metadata`);
      return;
    }
    if (!new RegExp(`\\b${item.sourceId}:\\s*Object\\.freeze`).test(resourceConfigSource) || item.fileName !== path.basename(item.sourcePath)) {
      issues.push(`assets/js/resources.data.js: ${item.name} must map to a configured resource source and a direct file`);
    }
    if (!item.terms || (item.installation !== undefined && (!Array.isArray(item.installation) || !item.installation.length))) {
      issues.push(`assets/js/resources.data.js: ${item.name} needs usage terms, and installation steps must be a non-empty list when present`);
    }
    const versions = Array.isArray(item.versions) ? item.versions : [];
    const stable = versions.find(version => version.id === item.latestVersionId && version.published && version.channel === 'stable');
    if (item.published && !stable) issues.push(`assets/js/resources.data.js: ${item.name} needs a published stable current version`);
    if (stable && !/^[0-9a-f]{40}$/.test(stable.ref || '')) {
      issues.push(`assets/js/resources.data.js: ${item.name} stable download must be pinned to an immutable commit SHA`);
    }
    if (versions.some(version => version.published && version.channel !== 'stable')) {
      issues.push(`assets/js/resources.data.js: ${item.name} exposes a non-stable version publicly`);
    }
  });
} catch (error) {
  issues.push(`assets/js/resources.data.js: resource catalog could not be evaluated: ${error.message}`);
}

try {
  const caseStudyDataSource = fs.readFileSync(path.join(root, 'assets/js/projects.data.js'), 'utf8');
  const context = { window: { DRANXX_CONFIG: {
    locale: 'en',
    routes: { projectBentengan: 'Project/Bentengan/' },
    projectMedia: { bentengan: { logo: '../assets/projects/bentengan/icon.webp', banner: '../assets/projects/bentengan/banner.webp' } },
    projectLinks: { bentengan: { play: '' } }
  } } };
  vm.runInNewContext(caseStudyDataSource, context, { filename: 'assets/js/projects.data.js' });
  const data = context.window.DRANXX_CASE_STUDIES;
  const items = Array.isArray(data?.items) ? data.items : [];
  caseStudyCount = items.length;
  const bentengan = items.find(item => item.id === 'bentengan');
  if (!bentengan || bentengan.route !== 'Project/Bentengan/' || bentengan.flow?.length !== 4 || bentengan.systems?.length < 6) {
    issues.push('assets/js/projects.data.js: Bentengan must retain its exact route, four-stage flow, and detailed engineering scope');
  }
  if (!bentengan?.ownership?.built?.length || !bentengan?.ownership?.integrated?.length || !bentengan?.ownership?.excluded?.length
    || !/Match Found/.test(bentengan?.ownership?.built?.join(' ') || '')
    || !/Maps/.test(bentengan?.ownership?.excluded?.join(' ') || '')) {
    issues.push('assets/js/projects.data.js: Bentengan authorship and integration boundaries are incomplete');
  }
} catch (error) {
  issues.push(`assets/js/projects.data.js: case-study data could not be evaluated: ${error.message}`);
}

const appSource = fs.readFileSync(path.join(root, 'assets/js/app.js'), 'utf8');
if (!/runtime\.init\s*\(/.test(appSource)) issues.push('assets/js/app.js: DRX.init() integration is missing');
if (!/const runtime = globalThis\.DRX/.test(appSource)) issues.push('assets/js/app.js: DRX runtime is not read from its documented global');
if (!/const revealAll = \(\) =>/.test(appSource) || !/DRX runtime is unavailable; revealing static content/.test(appSource)) {
  issues.push('assets/js/app.js: static content must fail open when the DRX runtime is unavailable');
}
if (/DateTimeFormat|data-wib-clock|setInterval\(updateClock/.test(appSource)) {
  issues.push('assets/js/app.js: unnecessary local-time updater must not be shipped');
}
if (!/class SiteUi/.test(shellSource)
  || /skeleton-shell|skeleton-grid|id:\s*'preloader'/.test(shellSource)
  || /cursor-light|cursorLight/.test(`${shellSource}\n${appSource}\n${componentStyleSource}`)
  || !/cursor-dot/.test(shellSource)
  || !/site-grain/.test(shellSource)) {
  issues.push('Site UI: retain grain and solid cursor feedback without a cursor glow or full-page loader');
}
if (!/preloader:\s*false/.test(appSource)
  || !/pageTransitions:\s*false/.test(appSource)
  || !/const setupTilt = \(\) =>/.test(appSource)
  || !/requestAnimationFrame\(animateCursor\)/.test(appSource)
  || !/classList\.add\('has-custom-cursor'\)/.test(appSource)) {
  issues.push('assets/js/app.js: native navigation, cursor motion, or tilt orchestration is missing');
}
if (/body\.loading \.page-content|\.preloader/.test(fs.readFileSync(path.join(root, 'assets/css/base.css'), 'utf8'))
  || !/\.media-pending::before/.test(fs.readFileSync(path.join(root, 'assets/css/base.css'), 'utf8'))
  || !/@keyframes skeletonSweep/.test(fs.readFileSync(path.join(root, 'assets/css/base.css'), 'utf8'))
  || /clip-path:\s*circle/.test(fs.readFileSync(path.join(root, 'assets/css/base.css'), 'utf8'))
  || !/\.project-card:hover/.test(pageStyleSource)
  || !/\.principle-card:hover/.test(pageStyleSource)
  || !/\.cursor-dot\.is-hovering/.test(componentStyleSource)
  || !/html\.has-custom-cursor body \*\s*\{\s*cursor:\s*none !important/.test(componentStyleSource)) {
  issues.push('portfolio CSS: retain inline media skeletons and responsive hover feedback without hiding the page');
}
if (!/data-project-discovery/.test(projectsSource)
  || !/data-project-search/.test(projectsSource)
  || !/data-project-filter="all"/.test(projectsSource)
  || !/data-project-empty/.test(projectsSource)
  || !/data-project-clear/.test(projectsSource)) {
  issues.push('projects.html: project discovery must include search, category buttons, reset, and an empty state');
}
if (!/matchesProject/.test(appSource)
  || !/projectSearch/.test(appSource)
  || !/state\.category/.test(appSource)
  || !/aria-pressed/.test(appSource)) {
  issues.push('assets/js/app.js: project discovery must combine search and categories with accessible selection state');
}
if (/data-project-pinned|data-project-tag|data-project-scopes/.test(projectsSource)
  || /pinnedProjectIds|dataset\.pinned/.test(collectionSource)
  || /tabindex:\s*'-1'|button\.hidden = true|buildCategoryOptions/.test(resourceRuntimeSource)) {
  issues.push('Project and resource catalogs must not retain GitHub pin controls, duplicated filters, or hidden legacy filter buttons');
}

const drxRuntimeSource = fs.readFileSync(path.join(root, drxScript), 'utf8');
if (!/^globalThis\.DRX\s*=\s*\(\(\)\s*=>\s*\{/m.test(drxRuntimeSource)) {
  issues.push(`${drxScript}: documented globalThis.DRX export is missing`);
}

const manifestPath = path.join(drxRoot, 'framework.manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (manifest.entrypoints?.css !== 'drx-framework.css') issues.push('framework.manifest.json: unexpected CSS entrypoint');
if (manifest.entrypoints?.javascript !== 'js/drx.js') issues.push('framework.manifest.json: unexpected JavaScript entrypoint');
if (manifest.entrypoints?.initialize !== 'DRX.init()') issues.push('framework.manifest.json: unexpected initializer contract');
if (!Array.isArray(manifest.components) || manifest.components.length !== 64) {
  issues.push(`framework.manifest.json: expected 64 canonical components, found ${manifest.components?.length ?? 0}`);
}

const packageData = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (packageData.version !== '0.2.0') issues.push('package.json: version must match V0.2.0');
if (packageData.scripts?.start !== 'node scripts/serve.mjs') issues.push('package.json: unexpected start command');

const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
for (const page of publicPages) {
  const route = `/${page.split('/')[0]}/${cleanRoute(path.basename(page))}`;
  const escapedRoute = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!new RegExp(`<loc>[^<]+${escapedRoute}<\\/loc>`).test(sitemap)) issues.push(`sitemap.xml: public route is missing: ${route}`);
}
for (const page of compatibilityPages) {
  if (sitemap.includes(`/${page}`)) issues.push(`sitemap.xml: retired route must not be indexed: /${page}`);
}
if (!sitemap.includes('https://dranxx.github.io/')) issues.push('sitemap.xml: expected GitHub Pages origin is missing');
if (/\.html/.test(sitemap)) issues.push('sitemap.xml: URLs must use extensionless routes');

const robots = fs.readFileSync(path.join(root, 'robots.txt'), 'utf8');
if (!robots.includes('https://dranxx.github.io/sitemap.xml')) issues.push('robots.txt: sitemap origin is stale');

const config = fs.readFileSync(path.join(root, 'assets/js/site.config.js'), 'utf8');
for (const route of ['./', 'projects', 'resources', 'services', 'profile']) {
  if (!config.includes(`href: '${route}'`)) issues.push(`site.config.js: public navigation route is missing: ${route}`);
}
for (const page of compatibilityPageNames) {
  if (config.includes(`'${cleanRoute(page)}'`) || config.includes(page)) issues.push(`site.config.js: retired route must not appear in navigation: ${page}`);
}

if (!/const locale = document\.documentElement\.lang/.test(config)
  || !/alternateLocale/.test(config)
  || !/bahasa Indonesia/i.test(config)) {
  issues.push('assets/js/site.config.js: locale detection or bilingual navigation copy is missing');
}
if (!/projectBentengan:\s*'Project\/Bentengan\/'/.test(config)
  || !/projects\/bentengan\/icon\.webp/.test(config)
  || !/projects\/bentengan\/banner\.webp/.test(config)
  || !/play:\s*''/.test(config)
  || !/resourceSources/.test(config)
  || !/MyRobloxAssets/.test(config)
  || !/icon:\s*`\$\{assetBase\}\/brands\/roblox-studio\.svg`/.test(config)) {
  issues.push('assets/js/site.config.js: modular Bentengan media/link or resource source configuration is incomplete');
}
if (!/'Project\/Bentengan'/.test(shellSource)
  || !/window\.location\.search/.test(shellSource)
  || !/window\.location\.hash/.test(shellSource)) {
  issues.push('assets/js/shell.js: localized case-study routing must preserve the current query and hash');
}
if (!/<html lang="id"/.test(indonesianHomeSource)
  || !/Hai, saya DranxX<\/h1>/.test(indonesianHomeSource)
  || !/Currently on Roblox/.test(indonesianHomeSource)
  || /View projects|How I think/.test(indonesianHomeSource)) {
  issues.push('id/index.html: Indonesian homepage copy is incomplete or stale English copy remains');
}

const legacyClaims = [
  'hello@dranxx.studio',
  'DranxX Creative',
  'MarketHub',
  'NexDash',
  'Voltex Energy',
  'Full-Stack Engineer & Product Builder',
  'Projects Completed',
  'Client Retention',
  'Founder / DranxX Creative'
];
const rejectedPortfolioCopy = [
  'This comes from my corrected portfolio README',
  'I build systems.',
  'Roblox developer / systems, security, optimization',
  'Distrust the boundary',
  'Treat the client as input',
  'not the right fit',
  'pretending every request',
  'specialist may be the better fit',
  'No complete spec required',
  'without pretending every interest'
];
const contentSources = [
  ...pages.map(page => [page, fs.readFileSync(path.join(root, page), 'utf8')]),
  ...projectScripts.map(script => [script, fs.readFileSync(path.join(root, script), 'utf8')])
];
for (const [file, source] of contentSources) {
  for (const legacyClaim of legacyClaims) {
    if (source.includes(legacyClaim)) issues.push(`${file}: removed fictional or stale claim remains: ${legacyClaim}`);
  }
  for (const rejectedCopy of rejectedPortfolioCopy) {
    if (source.includes(rejectedCopy)) issues.push(`${file}: rejected literal or internal-facing portfolio copy remains: ${rejectedCopy}`);
  }
}

if (issues.length) {
  console.error(`Validation failed with ${issues.length} issue${issues.length === 1 ? '' : 's'}:`);
  issues.forEach(issue => console.error(`- ${issue}`));
  process.exit(1);
}

console.log('Validation passed.');
console.log(`- ${publicPages.length} public pages and ${compatibilityPages.length} noindex compatibility pages`);
console.log(`- ${projectStyles.length} portfolio CSS layers plus the DRX full entrypoint`);
console.log(`- ${ownedScripts.length} site-owned scripts plus the DRX runtime`);
console.log(`- ${manifest.components.length} DRX components verified from the vendored manifest`);
console.log(`- ${projectCount} projects in the unified catalog and 2 identity assets verified`);
console.log(`- ${caseStudyCount} detailed case study and ${resourceCount} stable downloadable resources verified`);
console.log(`- ${technologyCount} technology icons and ${languageCount} local language flags verified`);
console.log('- Desktop, tablet, and mobile layout contracts verified');
console.log(`- ${idCount} unique static page IDs checked`);
console.log('- Local targets, JavaScript syntax, CSS structure, sitemap, and content guardrails passed');
