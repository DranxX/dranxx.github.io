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
    openCase: 'Lihat proyek',
    primary: 'Utama',
    archived: 'Diarsipkan',
    repository: 'Repositori',
    showcase: 'Preview proyek',
    showcaseSteps: 'Pilih proyek'
  } : {
    ask: 'Ask about this work',
    openRepository: 'Open repository',
    openRepositoryLabel: name => `Open ${name} repository on GitHub`,
    publicRepository: 'Source code',
    openCase: 'View project',
    primary: 'Main',
    archived: 'Archived',
    repository: 'Repository',
    showcase: 'Project previews',
    showcaseSteps: 'Choose a project'
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
      const row = create('li', item.primary ? 'technology-item is-primary' : 'technology-item');
      row.append(createTechnologyMark(item), create('span', 'technology-name', item.name));
      if (item.primary) row.append(create('span', 'technology-badge', copy.primary));
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

  const getLocalPreview = item => item.preview || '';

  const github = config.github || {};
  const repositoryCacheKey = `dranxx:repositories:${github.user}`;
  const repositoryCacheAge = 60 * 60 * 1000;
  const topicScopes = { game: 'game', roblox: 'game', minecraft: 'game', software: 'software', tool: 'software', bot: 'automation', automation: 'automation', ai: 'ai', 'machine-learning': 'ai' };
  const getRepositoryKey = item => getGitHubRepository(item.url)?.repository.toLowerCase() || '';

  const readRepositoryCache = () => {
    try {
      return JSON.parse(localStorage.getItem(repositoryCacheKey));
    } catch {
      return null;
    }
  };

  const fetchRepositories = async () => {
    const response = await fetch(`https://api.github.com/users/${encodeURIComponent(github.user)}/repos?type=owner&sort=pushed&per_page=100`, {
      headers: { Accept: 'application/vnd.github+json' }
    });
    if (!response.ok) throw new Error(`GitHub API responded with ${response.status}`);
    const repositories = (await response.json())
      .filter(repo => !repo.fork)
      .map(repo => ({
        name: repo.name,
        url: repo.html_url,
        description: repo.description || '',
        language: repo.language || '',
        topics: repo.topics || [],
        archived: repo.archived
      }));
    if (!repositories.length) throw new Error('GitHub API returned no repositories');
    try {
      localStorage.setItem(repositoryCacheKey, JSON.stringify({ savedAt: Date.now(), repositories }));
    } catch {}
    return repositories;
  };

  const createRepositoryProject = repo => {
    const item = {
      id: `repo-${repo.name.toLowerCase()}`,
      code: repo.name.replace(/[^a-z0-9]/gi, '').slice(0, 3).toUpperCase(),
      name: repo.name,
      kind: 'repository',
      scopes: [...new Set(repo.topics.map(topic => topicScopes[topic]).filter(Boolean))],
      categoryLabel: repo.language || copy.repository,
      description: repo.description,
      tags: [repo.language, ...repo.topics].filter(Boolean).slice(0, 4),
      url: repo.url,
      archived: repo.archived
    };
    item.preview = getGitHubPreview(item);
    return item;
  };

  // Curated entries keep their copy. GitHub decides which of them still exist and adds every other non-fork repository.
  const mergeRepositories = repositories => {
    const ignored = new Set((github.ignore || []).map(name => name.toLowerCase()));
    const live = new Map(repositories.filter(repo => !ignored.has(repo.name.toLowerCase())).map(repo => [repo.name.toLowerCase(), repo]));
    const curatedKeys = new Set(data.projects.map(getRepositoryKey).filter(Boolean));
    const curated = data.projects
      .filter(item => !getRepositoryKey(item) || live.has(getRepositoryKey(item)))
      .map(item => (live.get(getRepositoryKey(item))?.archived ? { ...item, archived: true } : item));
    const discovered = [...live.values()]
      .filter(repo => !curatedKeys.has(repo.name.toLowerCase()))
      .map(createRepositoryProject);
    return [...curated, ...discovered];
  };

  const repositoryCache = github.user ? readRepositoryCache() : null;
  let projects = Array.isArray(repositoryCache?.repositories) ? mergeRepositories(repositoryCache.repositories) : data.projects;

  const getOrderedProjects = () => projects;

  const attachPreview = (container, item, className, eager) => {
    const localPreviewUrl = getLocalPreview(item);
    const gitHubPreviewUrl = getGitHubPreview(item);
    const previewUrl = localPreviewUrl || gitHubPreviewUrl;
    if (!previewUrl) return;
    container.classList.add('media-pending');
    container.setAttribute('aria-busy', 'true');
    const preview = setAttributes(create('img', className), {
      alt: '',
      width: '1280',
      height: '640',
      loading: eager ? 'eager' : 'lazy',
      decoding: 'async'
    });
    const finishPreview = () => {
      container.classList.remove('media-pending');
      container.setAttribute('aria-busy', 'false');
    };
    const markLoaded = () => {
      finishPreview();
      container.classList.add('has-preview');
    };
    preview.addEventListener('load', markLoaded, { once: true });
    preview.addEventListener('error', () => {
      if (gitHubPreviewUrl && preview.src !== gitHubPreviewUrl) {
        preview.src = gitHubPreviewUrl;
        return;
      }
      container.classList.add('preview-failed');
      finishPreview();
      preview.remove();
    });
    preview.src = previewUrl;
    if (preview.complete && preview.naturalWidth > 0) markLoaded();
    container.append(preview);
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
    attachPreview(cover, item, 'project-preview', index < 3);
    const previewAction = create('span', 'project-view');
    previewAction.append(repository ? copy.openRepository : copy.openCase, setAttributes(create('i', external ? 'bi bi-arrow-up-right' : 'bi bi-arrow-right'), { 'aria-hidden': 'true' }));
    cover.append(
      setAttributes(create('span', 'project-code', item.code), { 'aria-hidden': 'true' }),
      previewAction
    );

    const content = create('div', 'project-content');
    const eyebrow = create('div', 'project-eyebrow');
    const repositoryMeta = create('div', 'project-repository-meta');
    repositoryMeta.append(item.archived
      ? create('span', 'status status-archive', copy.archived)
      : create('span', 'status status-public', repository ? copy.publicRepository : (isIndonesian ? 'Detail proyek' : 'Project detail')));
    eyebrow.append(repositoryMeta, create('span', 'project-category', item.categoryLabel));
    const heading = create('h2', 'project-title-link', item.name);
    content.append(eyebrow, heading, create('p', 'project-description', item.description), createTags(item.tags));
    article.append(cover, content);
    return article;
  };

  const renderProjects = (element, limit) => {
    const candidates = getOrderedProjects();
    const items = Number.isFinite(limit) ? candidates.slice(0, limit) : candidates;
    const fragment = document.createDocumentFragment();
    items.forEach((item, index) => fragment.append(createProject(item, index)));
    element.replaceChildren(fragment);
  };

  const formatStep = (index, total) => `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;

  const createShowcaseSlide = (item, index, total) => {
    const slide = setAttributes(create('article', 'showcase-slide'), {
      role: 'group',
      'aria-roledescription': 'slide',
      'aria-label': `${formatStep(index, total)}: ${item.name}`
    });
    const external = /^https?:\/\//.test(item.url);
    const repository = item.kind === 'repository' || (!item.kind && Boolean(getGitHubRepository(item.url)));
    const media = setAttributes(create('a', 'showcase-media'), {
      href: item.url,
      'aria-label': repository ? copy.openRepositoryLabel(item.name) : `${copy.openCase}: ${item.name}`
    });
    const action = create('a', 'text-link', repository ? copy.openRepository : copy.openCase);
    action.href = item.url;
    if (external) {
      [media, action].forEach(link => {
        link.target = '_blank';
        link.rel = 'noreferrer noopener';
      });
    }
    if (repository) media.classList.add('is-repository');
    const placeholder = create('div', 'project-media-placeholder');
    placeholder.append(create('span', '', item.categoryLabel), create('strong', '', item.code));
    media.append(placeholder);
    attachPreview(media, item, 'showcase-image', true);
    action.append(setAttributes(create('i', external ? 'bi bi-arrow-up-right' : 'bi bi-arrow-right'), { 'aria-hidden': 'true' }));

    const content = create('div', 'showcase-content');
    const eyebrow = create('div', 'showcase-eyebrow');
    eyebrow.append(create('span', '', item.categoryLabel), setAttributes(create('span', '', formatStep(index, total)), { 'aria-hidden': 'true' }));
    content.append(eyebrow, create('h3', '', item.name), create('p', '', item.description), createTags(item.tags), action);
    slide.append(media, content);
    return slide;
  };

  const showcaseTeardowns = new WeakMap();

  const renderShowcase = element => {
    showcaseTeardowns.get(element)?.();
    const listeners = new AbortController();
    const { signal } = listeners;
    const items = getOrderedProjects().filter(item => !item.archived);
    const total = items.length;
    if (!total) return;
    element.classList.add('showcase', 'drx-reveal');
    setAttributes(element, { role: 'region', 'aria-roledescription': 'carousel', 'aria-label': copy.showcase });
    const status = setAttributes(create('span', 'sr-only'), { 'aria-live': 'off', 'aria-atomic': 'true' });
    const slides = items.map((item, index) => createShowcaseSlide(item, index, total));
    const clone = index => {
      const slide = createShowcaseSlide(items[index], index, total);
      slide.setAttribute('aria-hidden', 'true');
      slide.inert = true;
      return slide;
    };
    const viewport = create('div', 'showcase-viewport');
    const track = create('div', 'showcase-track');
    track.append(clone(total - 1), ...slides, clone(0));
    viewport.append(track);
    const progress = setAttributes(create('div', 'showcase-progress'), { role: 'group', 'aria-label': copy.showcaseSteps });
    const steps = items.map((item, index) => {
      const step = setAttributes(create('button', 'showcase-step'), { type: 'button', title: item.name, 'aria-label': item.name, 'aria-current': 'false' });
      step.append(create('span', 'showcase-step-fill'));
      step.addEventListener('click', () => show(index));
      progress.append(step);
      return step;
    });

    const slideDuration = 6000;
    let active = 0;
    let position = 1;
    let countdown = null;
    let wrapTimer;
    let hovered = false;
    let focused = false;
    let touching = false;
    let offscreen = 'IntersectionObserver' in window;
    let swipeStart = null;

    // The countdown animation is the slide timer: pausing it holds the slide, finishing it advances.
    const sync = () => {
      status.setAttribute('aria-live', hovered || focused || touching ? 'polite' : 'off');
      if (!countdown) return;
      if (hovered || focused || touching || offscreen || document.hidden) countdown.pause();
      else countdown.play();
    };
    const startCountdown = () => {
      countdown?.cancel();
      countdown = null;
      if (total < 2) return;
      countdown = steps[active].firstChild.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: slideDuration, easing: 'linear' });
      countdown.onfinish = () => show(active + 1);
      sync();
    };
    const placeTrack = (value, instant = false) => {
      track.style.transition = instant ? 'none' : '';
      track.style.transform = `translateX(${-value * 100}%)`;
      if (instant) {
        void track.offsetWidth;
        track.style.transition = '';
      }
    };
    const finishWrap = () => {
      clearTimeout(wrapTimer);
      if (position === active + 1) return;
      position = active + 1;
      placeTrack(position, true);
    };
    const show = index => {
      finishWrap();
      active = (index + total) % total;
      position = index < 0 ? 0 : index >= total ? total + 1 : active + 1;
      placeTrack(position);
      slides.forEach((slide, slideIndex) => {
        slide.inert = slideIndex !== active;
        slide.setAttribute('aria-hidden', String(slideIndex !== active));
      });
      steps.forEach((step, stepIndex) => {
        step.setAttribute('aria-current', String(stepIndex === active));
        step.classList.toggle('is-done', stepIndex < active);
      });
      status.textContent = `${formatStep(active, total)} · ${items[active].name}`;
      wrapTimer = setTimeout(finishWrap, 700);
      startCountdown();
    };

    track.addEventListener('transitionend', event => {
      if (event.target === track && event.propertyName === 'transform') finishWrap();
    });
    element.addEventListener('pointerenter', event => {
      if (event.pointerType === 'touch') return;
      hovered = true;
      sync();
    }, { signal });
    element.addEventListener('pointerleave', event => {
      if (event.pointerType === 'touch') return;
      hovered = false;
      sync();
    }, { signal });
    element.addEventListener('focusin', event => {
      focused = event.target.matches(':focus-visible');
      sync();
    }, { signal });
    element.addEventListener('focusout', event => {
      if (element.contains(event.relatedTarget)) return;
      focused = false;
      sync();
    }, { signal });
    viewport.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'touch') return;
      touching = true;
      swipeStart = { x: event.clientX, y: event.clientY };
      sync();
    });
    const release = event => {
      if (!touching) return;
      touching = false;
      const deltaX = event.clientX - swipeStart.x;
      const deltaY = event.clientY - swipeStart.y;
      swipeStart = null;
      if (event.type === 'pointerup' && Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) show(active + (deltaX < 0 ? 1 : -1));
      else sync();
    };
    viewport.addEventListener('pointerup', release);
    viewport.addEventListener('pointercancel', release);
    progress.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      show(event.key === 'Home' ? 0 : event.key === 'End' ? total - 1 : active + (event.key === 'ArrowRight' ? 1 : -1));
      steps[active].focus();
    });
    document.addEventListener('visibilitychange', sync, { signal });
    const observer = offscreen ? new IntersectionObserver(([entry]) => {
      offscreen = !entry.isIntersecting;
      sync();
    }, { threshold: .25 }) : null;
    observer?.observe(element);
    showcaseTeardowns.set(element, () => {
      listeners.abort();
      observer?.disconnect();
      countdown?.cancel();
      clearTimeout(wrapTimer);
    });

    element.replaceChildren(status, viewport, progress);
    placeTrack(1, true);
    show(0);
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
    'project-showcase': renderShowcase,
    technology: renderTechnology,
    languages: renderLanguages
  };

  const renderCollection = element => {
    const renderer = renderers[element.dataset.collection];
    if (!renderer) return;
    const parsedLimit = Number.parseInt(element.dataset.limit || '', 10);
    renderer(element, Number.isFinite(parsedLimit) ? parsedLimit : undefined);
  };

  document.querySelectorAll('[data-collection]').forEach(renderCollection);

  const projectCollections = [...document.querySelectorAll('[data-collection="projects"], [data-collection="project-showcase"]')];
  const repositoryCacheIsFresh = Date.now() - (repositoryCache?.savedAt || 0) < repositoryCacheAge;
  if (github.user && projectCollections.length && !repositoryCacheIsFresh) {
    fetchRepositories()
      .then(repositories => {
        const next = mergeRepositories(repositories);
        if (JSON.stringify(next) === JSON.stringify(projects)) return;
        projects = next;
        projectCollections.forEach(renderCollection);
        document.dispatchEvent(new CustomEvent('dranxx:content-ready'));
      })
      .catch(error => console.warn('GitHub repositories could not be loaded; showing the saved project list.', error));
  }
})();
