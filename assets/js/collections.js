(() => {
  const data = window.DRANXX_DATA;
  const config = window.DRANXX_CONFIG || {};
  const assetBase = config.assetBase || '../assets';
  const isIndonesian = config.locale === 'id';
  const copy = isIndonesian ? {
    ask: 'Tanyakan tentang bidang ini',
    openRepository: 'Buka repositori',
    openRepositoryLabel: name => `Buka repositori ${name} di GitHub`,
    publicRepository: 'Source code',
    openCase: 'Lihat proyek'
  } : {
    ask: 'Ask about this work',
    openRepository: 'Open repository',
    openRepositoryLabel: name => `Open ${name} repository on GitHub`,
    publicRepository: 'Source code',
    openCase: 'View project'
  };

  const create = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const setAttributes = (node, attributes) => {
    Object.entries(attributes).forEach(([name, value]) => node.setAttribute(name, value));
    return node;
  };

  const normalizeFilterText = value => String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9+#.]+/g, ' ')
    .trim();

  const createTags = values => {
    const list = create('div', 'tag-list');
    values.forEach(value => list.append(create('span', 'tag drx-badge drx-badge-outline', value)));
    return list;
  };

  const createTechnologyFallback = item => create('span', 'technology-monogram', item.short || item.name.slice(0, 3));

  const createTechnologyMark = item => {
    const mark = setAttributes(create('span', 'technology-mark'), { 'aria-hidden': 'true' });
    if (item.iconSurface) mark.classList.add(`brand-surface-${item.iconSurface}`);
    if (item.iconSrc) {
      const sources = item.iconDarkSrc ? [item.iconSrc, item.iconDarkSrc] : [item.iconSrc];
      sources.forEach((source, index) => {
        const image = setAttributes(create('img', item.iconDarkSrc ? `brand-logo brand-logo-${index ? 'dark' : 'light'}` : 'brand-logo'), {
          src: source,
          alt: '',
          width: '38',
          height: '38',
          loading: 'lazy',
          decoding: 'async'
        });
        image.addEventListener('error', () => mark.replaceChildren(createTechnologyFallback(item)), { once: true });
        mark.append(image);
      });
    } else {
      mark.append(createTechnologyFallback(item));
    }
    return mark;
  };

  const createTechnologyList = values => {
    const list = create('ul', 'technology-list');
    values.forEach(value => {
      const item = typeof value === 'string' ? { name: value, short: value.slice(0, 3) } : value;
      const row = create('li', 'technology-item');
      row.append(createTechnologyMark(item), create('span', 'technology-name', item.name));
      list.append(row);
    });
    return list;
  };

  const createLanguageFlag = language => {
    const mark = setAttributes(create('span', 'language-flag'), { 'aria-hidden': 'true' });
    const fallback = () => setAttributes(create('i', 'bi bi-translate'), { 'aria-hidden': 'true' });
    if (!language.flag) {
      mark.append(fallback());
      return mark;
    }
    const image = setAttributes(create('img'), {
      src: language.flag,
      alt: '',
      width: '42',
      height: '28',
      loading: 'lazy',
      decoding: 'async'
    });
    image.addEventListener('error', () => mark.replaceChildren(fallback()), { once: true });
    mark.append(image);
    return mark;
  };

  const createAccentedTitle = item => {
    const heading = create('h2', 'service-title');
    const title = String(item.title);
    const accent = String(item.accent || '');
    const index = title.toLowerCase().indexOf(accent.toLowerCase());
    if (!accent || index < 0) {
      heading.textContent = title;
      return heading;
    }
    heading.append(title.slice(0, index), create('em', '', title.slice(index, index + accent.length)), title.slice(index + accent.length));
    return heading;
  };

  const createExternalLink = (label, href, className = 'text-link') => {
    const link = create('a', className);
    link.href = href;
    link.target = '_blank';
    link.rel = 'noreferrer noopener';
    link.append(label, setAttributes(create('i', 'bi bi-arrow-up-right'), { 'aria-hidden': 'true' }));
    return link;
  };

  const renderPrinciples = (element, limit) => {
    const items = Number.isFinite(limit) ? data.principles.slice(0, limit) : data.principles;
    const fragment = document.createDocumentFragment();
    items.forEach(item => {
      const article = create('article', 'principle-card drx-card drx-reveal');
      article.dataset.index = item.number;
      article.append(
        create('div', 'principle-index', `${item.number}: ${item.label}`),
        create('h3', 'principle-title', item.title),
        create('p', 'principle-copy', item.description)
      );
      fragment.append(article);
    });
    element.replaceChildren(fragment);
  };

  const renderServices = (element, limit) => {
    const items = Number.isFinite(limit) ? data.services.slice(0, limit) : data.services;
    const fragment = document.createDocumentFragment();
    items.forEach(item => {
      if (element.dataset.layout === 'detailed') {
        const offer = create('article', `service-offer service-offer-${item.id} drx-reveal`);
        offer.id = `service-${item.id}`;
        const intro = create('div', 'service-offer-intro');
        intro.append(create('span', 'service-number', item.number), createAccentedTitle(item), create('p', 'service-description', item.description));
        const list = create('ul', 'service-deliverables');
        item.deliverables.forEach(value => list.append(create('li', '', value)));
        intro.append(list, createTags(item.tags));
        const links = create('div', 'service-offer-links');
        const contact = create('a', 'text-link', isIndonesian ? 'Bahas kebutuhanmu' : 'Discuss your needs');
        contact.href = `contact.html?topic=${encodeURIComponent(item.id)}`;
        links.append(contact);
        const proof = create('a', 'service-proof-link', item.proof.label);
        proof.href = item.proof.url;
        if (/^https?:\/\//.test(item.proof.url)) {
          proof.target = '_blank';
          proof.rel = 'noreferrer noopener';
        }
        links.append(proof);
        intro.append(links);
        offer.append(intro);
        if (item.proof.image) {
          const figure = create('figure', 'service-proof');
          const media = setAttributes(create('div', 'service-proof-media media-pending'), { 'aria-busy': 'true' });
          const image = setAttributes(create('img'), { src: item.proof.image, alt: 'Bentengan', width: '1200', height: '675', loading: 'lazy', decoding: 'async' });
          const finish = () => {
            media.classList.remove('media-pending');
            media.setAttribute('aria-busy', 'false');
          };
          image.addEventListener('load', finish, { once: true });
          image.addEventListener('error', () => {
            finish();
            media.replaceChildren(create('span', 'service-proof-fallback', 'Bentengan'));
          }, { once: true });
          media.append(image);
          if (image.complete && image.naturalWidth > 0) finish();
          figure.append(media, create('figcaption', '', isIndonesian ? 'Bentengan · PvP tim, tiga place, satu alur pertandingan.' : 'Bentengan · Team PvP across three connected places.'));
          offer.append(figure);
        }
        fragment.append(offer);
        return;
      }
      const article = create('article', 'service-card drx-card drx-reveal');
      article.id = `service-${item.id}`;
      const body = create('div', 'service-body');
      body.append(create('p', 'service-description', item.description), createTags(item.tags));
      article.append(
        setAttributes(create('span', 'service-number', item.number), { 'aria-hidden': 'true' }),
        createAccentedTitle(item),
        body
      );
      const link = create('a', 'text-link');
      link.href = `contact.html?topic=${encodeURIComponent(item.id)}`;
      link.append(copy.ask, setAttributes(create('i', 'bi bi-arrow-right'), { 'aria-hidden': 'true' }));
      article.append(link);
      fragment.append(article);
    });
    element.replaceChildren(fragment);
  };

  const getGitHubRepository = rawUrl => {
    try {
      const url = new URL(rawUrl);
      if (url.hostname.toLowerCase() !== 'github.com') return null;
      const [owner, repository] = url.pathname.split('/').filter(Boolean);
      if (!owner || !repository) return null;
      return { owner, repository: repository.replace(/\.git$/i, '') };
    } catch {
      return null;
    }
  };

  const getGitHubPreview = item => {
    const repository = getGitHubRepository(item.url);
    if (!repository) return '';
    const cacheKey = `dranxx-portfolio-${item.id}`;
    return `https://opengraph.githubassets.com/${encodeURIComponent(cacheKey)}/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.repository)}`;
  };

  const getLocalPreview = item => item.preview || `${assetBase}/previews/${encodeURIComponent(item.id)}.webp`;

  const getOrderedProjects = () => {
    return data.projects;
  };

  const createProject = (item, index = 0) => {
    const article = create('a', 'project-card drx-card drx-reveal');
    article.href = item.url;
    const external = /^https?:\/\//.test(item.url);
    const repository = item.kind === 'repository' || (!item.kind && Boolean(getGitHubRepository(item.url)));
    if (external) {
      article.target = '_blank';
      article.rel = 'noreferrer noopener';
    }
    article.setAttribute('aria-label', repository ? copy.openRepositoryLabel(item.name) : `${copy.openCase}: ${item.name}`);
    article.id = `project-${item.id}`;
    article.dataset.projectCard = '';
    article.dataset.scopes = Array.isArray(item.scopes) ? item.scopes.join(' ') : '';
    article.dataset.projectSearch = normalizeFilterText([
      item.name,
      item.code,
      item.categoryLabel,
      item.description,
      ...(item.tags || [])
    ].join(' '));
    const cover = create('div', 'project-cover');
    const localPreviewUrl = getLocalPreview(item);
    const gitHubPreviewUrl = getGitHubPreview(item);
    const previewUrl = localPreviewUrl || gitHubPreviewUrl;
    if (previewUrl) {
      cover.classList.add('media-pending');
      cover.setAttribute('aria-busy', 'true');
      const preview = setAttributes(create('img', 'project-preview'), {
        alt: '',
        width: '1280',
        height: '640',
        loading: index < 3 ? 'eager' : 'lazy',
        decoding: 'async'
      });
      const finishPreview = () => {
        cover.classList.remove('media-pending');
        cover.setAttribute('aria-busy', 'false');
      };
      const markLoaded = () => {
        finishPreview();
        cover.classList.add('has-preview');
      };
      preview.addEventListener('load', markLoaded, { once: true });
      preview.addEventListener('error', () => {
        if (gitHubPreviewUrl && preview.src !== gitHubPreviewUrl) {
          preview.src = gitHubPreviewUrl;
          return;
        }
        cover.classList.add('preview-failed');
        finishPreview();
        preview.remove();
      });
      preview.src = previewUrl;
      if (preview.complete && preview.naturalWidth > 0) markLoaded();
      cover.append(preview);
    }
    const previewAction = create('span', 'project-view');
    previewAction.append(repository ? copy.openRepository : copy.openCase, setAttributes(create('i', external ? 'bi bi-arrow-up-right' : 'bi bi-arrow-right'), { 'aria-hidden': 'true' }));
    cover.append(
      setAttributes(create('span', 'project-code', item.code), { 'aria-hidden': 'true' }),
      previewAction
    );

    const content = create('div', 'project-content');
    const eyebrow = create('div', 'project-eyebrow');
    const repositoryMeta = create('div', 'project-repository-meta');
    repositoryMeta.append(create('span', 'status status-public', repository ? copy.publicRepository : (isIndonesian ? 'Detail proyek' : 'Project detail')));
    eyebrow.append(repositoryMeta, create('span', 'project-category', item.categoryLabel));
    const heading = create('h2', 'project-title-link', item.name);
    content.append(eyebrow, heading, create('p', 'project-description', item.description), createTags(item.tags));
    article.append(cover, content);
    return article;
  };

  const renderProjects = (element, limit) => {
    let candidates = getOrderedProjects();
    if (element.dataset.selection === 'home-featured') {
      const byId = new Map(data.projects.map(item => [item.id, item]));
      candidates = (data.homeProjectIds || []).map(id => byId.get(id)).filter(Boolean);
    }
    const items = Number.isFinite(limit) ? candidates.slice(0, limit) : candidates;
    const fragment = document.createDocumentFragment();
    items.forEach((item, index) => fragment.append(createProject(item, index)));
    element.replaceChildren(fragment);
  };

  const renderTechnology = element => {
    const fragment = document.createDocumentFragment();
    data.technologyGroups.forEach((group, index) => {
      const article = create('article', 'technology-group drx-card drx-reveal');
      const header = create('div', 'technology-head');
      header.append(create('span', 'technology-index', String(index + 1).padStart(2, '0')), create('h2', '', group.title));
      article.append(header, create('p', 'technology-note', group.note), createTechnologyList(group.items));
      fragment.append(article);
    });
    element.replaceChildren(fragment);
  };

  const renderLanguages = element => {
    const fragment = document.createDocumentFragment();
    data.languages.forEach(language => {
      const item = create('article', 'language-item drx-item drx-reveal');
      item.dataset.proficiency = language.proficiency;
      const status = create('span', 'language-proficiency', language.proficiencyLabel);
      item.append(
        createLanguageFlag(language),
        status,
        create('h3', '', language.name),
        create('p', '', language.level)
      );
      fragment.append(item);
    });
    element.replaceChildren(fragment);
  };

  const renderers = {
    principles: renderPrinciples,
    services: renderServices,
    projects: renderProjects,
    technology: renderTechnology,
    languages: renderLanguages
  };

  document.querySelectorAll('[data-collection]').forEach(element => {
    const renderer = renderers[element.dataset.collection];
    if (!renderer) return;
    const parsedLimit = Number.parseInt(element.dataset.limit || '', 10);
    renderer(element, Number.isFinite(parsedLimit) ? parsedLimit : undefined);
  });
})();
