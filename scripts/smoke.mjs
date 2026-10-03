import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const host = '127.0.0.1';
const pause = duration => new Promise(resolve => setTimeout(resolve, duration));
const findAvailablePort = () => new Promise((resolve, reject) => {
  const probe = http.createServer();
  probe.once('error', reject);
  probe.listen(0, host, () => {
    const address = probe.address();
    const availablePort = typeof address === 'object' && address ? address.port : 0;
    probe.close(error => {
      if (error) reject(error);
      else resolve(availablePort);
    });
  });
});
const port = await findAvailablePort();

const get = route => new Promise((resolve, reject) => {
  const request = http.get({ host, port, path: route }, response => {
    const chunks = [];
    response.on('data', chunk => chunks.push(chunk));
    response.on('end', () => resolve({
      body: Buffer.concat(chunks).toString('utf8'),
      contentType: response.headers['content-type'] || '',
      status: response.statusCode
    }));
  });
  request.on('error', reject);
  request.setTimeout(2500, () => request.destroy(new Error(`Timeout loading ${route}`)));
});

const server = spawn(process.execPath, [path.join(root, 'scripts/serve.mjs')], {
  cwd: root,
  env: { ...process.env, HOST: host, PORT: String(port) },
  stdio: ['ignore', 'ignore', 'pipe'],
  windowsHide: true
});

let serverError = '';
server.stderr.on('data', chunk => { serverError += chunk.toString(); });

const localeTests = ['en', 'id'].flatMap(locale => [
  { route: `/${locale}/`, status: 200, type: 'text/html', kind: 'public', locale },
  { route: `/${locale}/projects`, status: 200, type: 'text/html', kind: 'public', locale },
  { route: `/${locale}/Project_Bentengan`, status: 200, type: 'text/html', kind: 'public', locale },
  { route: `/${locale}/resources`, status: 200, type: 'text/html', kind: 'public', locale },
  { route: `/${locale}/services`, status: 200, type: 'text/html', kind: 'public', locale },
  { route: `/${locale}/profile`, status: 200, type: 'text/html', kind: 'public', locale },
  { route: `/${locale}/contact`, status: 200, type: 'text/html', kind: 'public', locale },
  { route: `/${locale}/contact.html`, status: 200, type: 'text/html', kind: 'public', locale },
  { route: `/${locale}/platform`, status: 200, type: 'text/html', kind: 'compatibility', locale },
  { route: `/${locale}/products`, status: 200, type: 'text/html', kind: 'compatibility', locale },
  { route: `/${locale}/partners`, status: 200, type: 'text/html', kind: 'compatibility', locale }
]);

const tests = [
  { route: '/', status: 200, type: 'text/html', kind: 'gateway' },
  ...localeTests,
  { route: '/assets/vendor/drx/drx-framework.css', status: 200, type: 'text/css' },
  { route: '/assets/vendor/drx/js/drx.js', status: 200, type: 'text/javascript' },
  { route: '/assets/vendor/drx/framework.manifest.json', status: 200, type: 'application/json' },
  { route: '/assets/css/pages.css', status: 200, type: 'text/css' },
  { route: '/assets/js/data.js', status: 200, type: 'text/javascript' },
  { route: '/assets/js/collections.js', status: 200, type: 'text/javascript' },
  { route: '/assets/js/projects.data.js', status: 200, type: 'text/javascript' },
  { route: '/assets/js/projects.js', status: 200, type: 'text/javascript' },
  { route: '/assets/js/resources.data.js', status: 200, type: 'text/javascript' },
  { route: '/assets/js/resources.js', status: 200, type: 'text/javascript' },
  { route: '/assets/js/app.js', status: 200, type: 'text/javascript' },
  { route: '/assets/profile.webp', status: 200, type: 'image/webp' },
  { route: '/assets/profile_nobg.webp', status: 200, type: 'image/webp' },
  { route: '/assets/icons/flags/id.svg', status: 200, type: 'image/svg+xml' },
  { route: '/assets/icons/flags/gb.svg', status: 200, type: 'image/svg+xml' },
  { route: '/assets/icons/flags/jp.svg', status: 200, type: 'image/svg+xml' },
  { route: '/assets/icons/flags/cn.svg', status: 200, type: 'image/svg+xml' },
  { route: '/assets/icons/flags/fr.svg', status: 200, type: 'image/svg+xml' },
  { route: '/en/route-that-does-not-exist', status: 404, type: 'text/html', kind: 'error', locale: 'en' },
  { route: '/id/route-that-does-not-exist', status: 404, type: 'text/html', kind: 'error', locale: 'id' }
];

try {
  let ready = false;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await get('/');
      if (response.status === 200) {
        ready = true;
        break;
      }
    } catch {
      await pause(100);
    }
  }
  if (!ready) throw new Error(`Static server did not become ready. ${serverError}`.trim());

  for (const test of tests) {
    const response = await get(test.route);
    if (response.status !== test.status) throw new Error(`${test.route}: expected HTTP ${test.status}, received ${response.status}`);
    if (!response.contentType.includes(test.type)) throw new Error(`${test.route}: expected ${test.type}, received ${response.contentType}`);
    if (!response.body.trim()) throw new Error(`${test.route}: empty response body`);

    if (test.type === 'text/html' && test.kind !== 'gateway') {
      if (!response.body.includes('id="main-content"')) throw new Error(`${test.route}: main content landmark is missing`);
      if (!response.body.includes('../assets/vendor/drx/drx-framework.css')) throw new Error(`${test.route}: DRX CSS entrypoint is missing`);
      if (!response.body.includes('../assets/vendor/drx/js/drx.js')) throw new Error(`${test.route}: DRX JavaScript entrypoint is missing`);
      if (!response.body.includes(`<html lang="${test.locale}"`)) throw new Error(`${test.route}: document language does not match route locale`);
      if (response.body.includes('DranxX Creative')) throw new Error(`${test.route}: stale studio identity remains`);
    }
    if (test.kind === 'public' && /name="robots"[^>]*noindex/i.test(response.body)) {
      throw new Error(`${test.route}: public route is unexpectedly noindex`);
    }
    if (['compatibility', 'error'].includes(test.kind) && !/name="robots"[^>]*noindex/i.test(response.body)) {
      throw new Error(`${test.route}: retired/error route is missing noindex`);
    }

    console.log(`PASS ${response.status} ${test.route}`);
  }

  const home = await get('/en/');
  if (!home.body.includes('Game &amp; software developer')) throw new Error('/en/: expected hero role label is missing');
  if (!home.body.includes('class="scope-divider"') || !home.body.includes('drx-marquee-track')) throw new Error('/en/: expected cross-discipline section divider is missing');
  if (home.body.includes('class="hero-identity') || !home.body.includes('data-collection="project-showcase"')) throw new Error('/en/: rejected identity visual returned or the project showcase is missing');
  const indonesianHome = await get('/id/');
  if (!indonesianHome.body.includes('Hai, saya DranxX</h1>') || indonesianHome.body.includes('Currently on Roblox')) {
    throw new Error('/id/: Indonesian homepage copy is missing or stale English copy remains');
  }
  const projectsPage = await get('/en/projects');
  for (const marker of ['data-project-search', 'data-project-filter="all"', 'data-project-empty', 'data-project-clear']) {
    if (!projectsPage.body.includes(marker)) throw new Error(`/en/projects: missing discovery marker ${marker}`);
  }
  const caseStudyPage = await get('/en/Project_Bentengan');
  if (!caseStudyPage.body.includes('data-project-case-study="bentengan"') || !caseStudyPage.body.includes('href="../id/Project_Bentengan"')) {
    throw new Error('/en/Project_Bentengan: detailed Bentengan renderer or localized route is missing');
  }
  const resourcesPage = await get('/en/resources');
  for (const marker of ['data-resource-catalog', 'data-resource-filters', 'data-resource-list', 'data-resource-modal-root']) {
    if (!resourcesPage.body.includes(marker)) throw new Error(`/en/resources: missing catalog marker ${marker}`);
  }
  const profilePage = await get('/en/profile');
  if (!profilePage.body.includes('class="profile-link-grid"') || !profilePage.body.includes('class="profile-interest-grid"')) {
    throw new Error('/en/profile: expanded social or interest layout is missing');
  }
  const manifest = JSON.parse((await get('/assets/vendor/drx/framework.manifest.json')).body);
  if (manifest.components?.length !== 64) throw new Error('DRX manifest component count changed unexpectedly');

  console.log(`Smoke test passed for ${tests.length} HTTP routes and assets.`);
} finally {
  if (server.exitCode === null) {
    server.kill();
    await Promise.race([once(server, 'exit'), pause(1000)]);
  }
}
