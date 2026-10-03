(() => {
  const create = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const setAttributes = (node, attributes) => {
    Object.entries(attributes).forEach(([name, value]) => {
      if (value !== undefined && value !== null && (value !== '' || name.startsWith('data-'))) node.setAttribute(name, value);
    });
    return node;
  };

  const createTags = values => {
    const list = create('div', 'tag-list');
    values.forEach(value => list.append(create('span', 'tag drx-badge drx-badge-outline', value)));
    return list;
  };

  const createOptionalImage = (container, source, alt, className) => {
    if (!source) return null;
    container.classList.add('media-pending');
    container.setAttribute('aria-busy', 'true');
    const image = setAttributes(create('img', className), {
      alt,
      loading: 'eager',
      decoding: 'async'
    });
    const finishImage = () => {
      container.classList.remove('media-pending');
      container.setAttribute('aria-busy', 'false');
    };
    const markLoaded = () => {
      finishImage();
      container.classList.add('has-project-image');
    };
    image.addEventListener('load', markLoaded, { once: true });
    image.addEventListener('error', () => {
      finishImage();
      image.remove();
    }, { once: true });
    image.src = source;
    container.append(image);
    if (image.complete && image.naturalWidth > 0) markLoaded();
    return image;
  };

  class ProjectCollection {
    constructor(root, config) {
      this.root = root;
      this.config = config;
      this.isIndonesian = config.locale === 'id';
    }

    createCard(project, index, total) {
      const article = setAttributes(create('article', 'case-study-card'), {
        role: 'group',
        'aria-roledescription': 'slide',
        'aria-label': `${index + 1} / ${total}: ${project.name}`
      });
      const external = /^https?:\/\//.test(project.url);
      const mediaLink = setAttributes(create('a', 'case-study-card-media'), {
        href: project.url,
        'aria-label': this.isIndonesian ? `Buka ${project.name}` : `Open ${project.name}`,
        target: external ? '_blank' : null,
        rel: external ? 'noreferrer noopener' : null
      });
      const placeholder = create('div', 'project-media-placeholder');
      placeholder.append(create('span', '', project.categoryLabel), create('strong', '', project.code));
      mediaLink.append(placeholder);
      if (external) mediaLink.classList.add('repository-preview');
      createOptionalImage(mediaLink, project.preview || `${this.config.assetBase}/previews/${project.id}.webp`, '', 'case-study-card-banner');

      const content = create('div', 'case-study-card-content');
      const eyebrow = create('div', 'case-study-card-eyebrow');
      eyebrow.append(create('span', '', project.categoryLabel));
      const heading = create('h3', '', project.name);
      content.append(eyebrow, heading, create('p', '', project.description), createTags(project.tags));
      const action = create('a', 'text-link', external ? (this.isIndonesian ? 'Buka repo & dokumentasi' : 'Open repo & documentation') : (this.isIndonesian ? 'Lihat cara kerjanya' : 'See how it works'));
      action.href = project.url;
      if (external) {
        action.target = '_blank';
        action.rel = 'noreferrer noopener';
      }
      action.append(setAttributes(create('i', external ? 'bi bi-arrow-up-right' : 'bi bi-arrow-right'), { 'aria-hidden': 'true' }));
      content.append(action);
      article.append(mediaLink, content);
      return article;
    }

    mount() {
      const portfolio = window.DRANXX_DATA;
      const byId = new Map(portfolio.projects.map(item => [item.id, item]));
      const items = portfolio.featuredProjectIds.map(id => byId.get(id)).filter(Boolean);
      if (!items.length) return;
      this.root.classList.add('project-carousel', 'drx-reveal');
      setAttributes(this.root, {
        role: 'region',
        'aria-roledescription': 'carousel',
        'aria-label': this.isIndonesian ? 'Preview proyek pilihan' : 'Selected project previews'
      });
      const toolbar = create('div', 'carousel-toolbar');
      const status = setAttributes(create('span', 'carousel-status'), { 'aria-live': 'polite', 'aria-atomic': 'true' });
      const controls = create('div', 'carousel-arrows');
      const previous = setAttributes(create('button', 'carousel-arrow'), { type: 'button', 'aria-label': this.isIndonesian ? 'Proyek sebelumnya' : 'Previous project' });
      const next = setAttributes(create('button', 'carousel-arrow'), { type: 'button', 'aria-label': this.isIndonesian ? 'Proyek berikutnya' : 'Next project' });
      const playback = setAttributes(create('button', 'carousel-arrow carousel-playback'), { type: 'button' });
      const playbackIcon = setAttributes(create('i'), { 'aria-hidden': 'true' });
      playback.append(playbackIcon);
      previous.append(setAttributes(create('i', 'bi bi-arrow-left'), { 'aria-hidden': 'true' }));
      next.append(setAttributes(create('i', 'bi bi-arrow-right'), { 'aria-hidden': 'true' }));
      controls.append(playback, previous, next);
      toolbar.append(status, controls);
      const slides = items.map((item, index) => this.createCard(item, index, items.length));
      const viewport = create('div', 'carousel-viewport');
      const track = create('div', 'carousel-track');
      const clone = index => {
        const slide = this.createCard(items[index], index, items.length);
        slide.classList.add('carousel-clone');
        slide.setAttribute('aria-hidden', 'true');
        slide.inert = true;
        return slide;
      };
      track.append(clone(items.length - 1), ...slides, clone(0));
      viewport.append(track);
      const navigation = setAttributes(create('div', 'carousel-choices'), { role: 'group', 'aria-label': this.isIndonesian ? 'Pilih preview proyek' : 'Choose a project preview' });
      let active = 0;
      let position = 1;
      let timer;
      let wrapTimer;
      let hovered = false;
      let keyboardFocus = false;
      const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
      let paused = reducedMotion.matches;
      const schedule = () => {
        clearTimeout(timer);
        status.setAttribute('aria-live', paused || hovered || keyboardFocus ? 'polite' : 'off');
        if (!paused && !hovered && !keyboardFocus && !document.hidden && items.length > 1) {
          timer = setTimeout(() => show(active + 1), 6000);
        }
      };
      const setPlayback = () => {
        const label = paused ? (this.isIndonesian ? 'Putar slideshow' : 'Play slideshow') : (this.isIndonesian ? 'Jeda slideshow' : 'Pause slideshow');
        playback.setAttribute('aria-label', label);
        playback.title = label;
        playbackIcon.className = paused ? 'bi bi-play-fill' : 'bi bi-pause-fill';
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
      const buttons = items.map((item, index) => {
        const button = setAttributes(create('button', 'carousel-choice'), { type: 'button', 'aria-pressed': String(index === 0) });
        const thumbnail = setAttributes(create('img', 'carousel-choice-preview'), {
          src: item.preview || `${this.config.assetBase}/previews/${item.id}.webp`,
          alt: '',
          decoding: 'async'
        });
        thumbnail.addEventListener('error', () => { thumbnail.hidden = true; }, { once: true });
        button.append(thumbnail, create('span', '', item.name));
        button.addEventListener('click', () => show(index));
        navigation.append(button);
        return button;
      });
      const show = index => {
        finishWrap();
        active = (index + items.length) % items.length;
        position = index < 0 ? 0 : index >= items.length ? items.length + 1 : active + 1;
        placeTrack(position, reducedMotion.matches);
        slides.forEach((slide, index) => {
          slide.inert = index !== active;
          slide.setAttribute('aria-hidden', String(index !== active));
        });
        buttons.forEach((button, position) => button.setAttribute('aria-pressed', String(position === active)));
        status.textContent = `${String(active + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')} · ${items[active].name}`;
        wrapTimer = setTimeout(finishWrap, reducedMotion.matches ? 0 : 500);
        schedule();
      };
      track.addEventListener('transitionend', event => {
        if (event.target === track && event.propertyName === 'transform') finishWrap();
      });
      playback.addEventListener('click', () => {
        paused = !paused;
        setPlayback();
        schedule();
      });
      this.root.addEventListener('pointerenter', event => {
        if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
        hovered = true;
        schedule();
      });
      this.root.addEventListener('pointerleave', () => {
        hovered = false;
        schedule();
      });
      this.root.addEventListener('focusin', event => {
        keyboardFocus = event.target.matches(':focus-visible');
        schedule();
      });
      this.root.addEventListener('focusout', event => {
        if (this.root.contains(event.relatedTarget)) return;
        keyboardFocus = false;
        schedule();
      });
      document.addEventListener('visibilitychange', schedule);
      reducedMotion.addEventListener('change', () => {
        paused = reducedMotion.matches;
        setPlayback();
        schedule();
      });
      previous.addEventListener('click', () => show(active - 1));
      next.addEventListener('click', () => show(active + 1));
      navigation.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        show(event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : active + (event.key === 'ArrowRight' ? 1 : -1));
        buttons[active].focus();
      });
      this.root.replaceChildren(toolbar, viewport, navigation);
      placeTrack(1, true);
      setPlayback();
      show(0);
    }
  }

  class ProjectCaseStudy {
    constructor(root, project, config) {
      this.root = root;
      this.project = project;
      this.config = config;
      this.isIndonesian = config.locale === 'id';
      this.copy = this.isIndonesian ? {
        caseStudy: 'Project / Roblox',
        play: 'Mainkan sekarang',
        back: 'Kembali ke proyek',
        overview: 'Ringkasan',
        architecture: 'Arsitektur',
        systems: 'Sistem utama',
        contribution: 'Role & kredit',
        overviewLabel: 'Tentang proyek',
        overviewTitle: 'Dari cari match sampai rebut benteng.',
        architectureLabel: 'Alur pertandingan',
        architectureTitle: 'Satu match, tiga place.',
        systemsLabel: 'Detail teknis',
        systemsTitle: 'Lihat sistemnya lebih dekat.',
        contributionLabel: 'Role & kredit',
        contributionTitle: 'Gameplay dan backend scripting.',
        challengeLabel: 'Keputusan teknis',
        challengeTitle: 'Saat alur normal tidak cukup.',
        details: 'Buka detail teknis',
        credits: 'Kredit aset & dependensi',
        contact: 'Diskusikan proyek serupa',
        endTitle: 'Punya sistem Roblox yang ingin dibahas?'
      } : {
        caseStudy: 'Project / Roblox',
        play: 'Play now',
        back: 'Back to projects',
        overview: 'Overview',
        architecture: 'Architecture',
        systems: 'Core systems',
        contribution: 'Role & credits',
        overviewLabel: 'Project overview',
        overviewTitle: 'From finding a match to capturing a fort.',
        architectureLabel: 'Match flow',
        architectureTitle: 'One match, three places.',
        systemsLabel: 'Engineering scope',
        systemsTitle: 'Take a closer look at the systems.',
        contributionLabel: 'Role & credits',
        contributionTitle: 'Gameplay and backend scripting.',
        challengeLabel: 'Engineering decisions',
        challengeTitle: 'Beyond the happy path.',
        details: 'Explore technical details',
        credits: 'Asset & dependency credits',
        contact: 'Discuss a similar project',
        endTitle: 'Have a Roblox system you’d like to discuss?'
      };
    }

    createAction(label, href, primary, external = false) {
      const link = create('a', primary ? 'drx-btn drx-btn-solid-primary' : 'drx-btn drx-btn-outline', label);
      link.href = href;
      if (external) {
        link.target = '_blank';
        link.rel = 'noreferrer noopener';
        link.append(setAttributes(create('i', 'bi bi-arrow-up-right'), { 'aria-hidden': 'true' }));
      } else {
        const icon = href === this.config.routes.projects ? 'bi bi-arrow-left' : 'bi bi-arrow-right';
        link.append(setAttributes(create('i', icon), { 'aria-hidden': 'true' }));
      }
      return link;
    }

    createHeader() {
      const hero = setAttributes(create('header', 'project-case-hero'), { id: 'overview', 'data-case-section': '' });
      const wrap = create('div', 'wrap');
      const banner = create('div', 'project-case-banner drx-reveal');
      const placeholder = create('div', 'project-media-placeholder project-banner-placeholder');
      placeholder.append(create('span', '', 'PROJECT / BENTENGAN'), create('strong', '', this.project.code));
      banner.append(placeholder);
      createOptionalImage(banner, this.project.media.banner, '', 'project-banner-image');

      const identity = create('div', 'project-case-identity');
      const logo = create('div', 'project-case-logo drx-reveal');
      logo.append(create('span', 'project-logo-placeholder', this.project.code));
      createOptionalImage(logo, this.project.media.logo, `${this.project.name} logo`, 'project-logo-image');

      const titleBlock = create('div', 'project-case-title drx-reveal');
      titleBlock.append(create('span', 'section-label', this.copy.caseStudy), create('h1', '', this.project.name), create('p', 'project-case-role', this.project.role));
      const state = create('div', 'project-case-state');
      state.append(create('span', 'status status-public', this.project.status), create('span', '', this.project.platform));
      titleBlock.append(state);

      const actions = create('div', 'project-case-actions drx-reveal');
      if (this.project.links.play) actions.append(this.createAction(this.copy.play, this.project.links.play, true, true));
      actions.append(this.createAction(this.copy.back, this.config.routes.projects, false));
      identity.append(logo, titleBlock, actions);
      wrap.append(banner, identity);
      hero.append(wrap);
      return hero;
    }

    createSnapshot() {
      const list = create('dl', 'project-snapshot drx-reveal');
      this.project.snapshot.forEach(item => {
        const group = create('div');
        group.append(create('dt', '', item.label), create('dd', '', item.value));
        list.append(group);
      });
      return list;
    }

    createSectionHead(label, title) {
      const head = create('div', 'section-head drx-reveal');
      const titleBlock = create('div');
      titleBlock.append(create('span', 'section-label', label), create('h2', 'display-heading', title));
      head.append(titleBlock);
      return head;
    }

    createOverview() {
      const section = setAttributes(create('section', 'section project-overview'), { 'aria-labelledby': 'project-overview-title' });
      const wrap = create('div', 'wrap');
      const layout = create('div', 'project-overview-layout');
      const copy = create('div', 'project-overview-copy drx-reveal');
      const heading = setAttributes(create('h2', '', this.copy.overviewTitle), { id: 'project-overview-title' });
      copy.append(create('span', 'section-label', this.copy.overviewLabel), heading, create('p', '', this.project.intro), createTags(this.project.tags));
      layout.append(copy, this.createSnapshot());
      wrap.append(layout);
      section.append(wrap);
      return section;
    }

    createArchitecture() {
      const section = setAttributes(create('section', 'section section-alt project-architecture'), { id: 'architecture', 'data-case-section': '', 'aria-labelledby': 'project-architecture-title' });
      const wrap = create('div', 'wrap');
      const head = this.createSectionHead(this.copy.architectureLabel, this.copy.architectureTitle);
      head.querySelector('h2').id = 'project-architecture-title';
      const flow = create('ol', 'project-flow');
      this.project.flow.forEach((stage, index) => {
        const item = create('li', 'project-flow-stage drx-reveal');
        item.append(create('span', 'project-flow-index', stage.code), create('h3', '', stage.title), create('p', '', stage.description));
        if (index < this.project.flow.length - 1) item.append(setAttributes(create('i', 'bi bi-arrow-right project-flow-arrow'), { 'aria-hidden': 'true' }));
        flow.append(item);
      });
      wrap.append(head, flow);
      section.append(wrap);
      return section;
    }

    createSystems() {
      const section = setAttributes(create('section', 'section project-systems'), { id: 'systems', 'data-case-section': '', 'aria-labelledby': 'project-systems-title' });
      const wrap = create('div', 'wrap');
      const head = this.createSectionHead(this.copy.systemsLabel, this.copy.systemsTitle);
      head.querySelector('h2').id = 'project-systems-title';
      head.append(create('p', 'section-copy', this.isIndonesian ? 'Ringkasan menunjukkan fungsi tiap sistem. Buka detail untuk melihat aturan, alur data, dan penanganan kegagalannya.' : 'Each summary explains what a system does. Open the details for its rules, data flow, and failure handling.'));
      const grid = create('div', 'project-system-list');
      this.project.systems.forEach(system => {
        const card = setAttributes(create('article', 'system-row drx-reveal'), { id: `system-${system.id}` });
        const index = setAttributes(create('span', 'project-system-index', system.number), { 'aria-hidden': 'true' });
        const intro = create('div', 'system-intro');
        intro.append(create('h3', '', system.title), create('p', '', system.description));
        const details = create('details', 'system-details');
        details.append(setAttributes(create('summary', '', this.copy.details), { 'aria-label': `${this.copy.details}: ${system.title}` }));
        const list = create('ul');
        system.points.forEach(point => list.append(create('li', '', point)));
        details.append(list);
        card.append(index, intro, details);
        grid.append(card);
      });
      wrap.append(head, grid);
      section.append(wrap);
      return section;
    }

    createChallenges() {
      const section = setAttributes(create('section', 'section project-challenges'), { id: 'decisions', 'data-case-section': '', 'aria-labelledby': 'project-decisions-title' });
      const wrap = create('div', 'wrap');
      const head = this.createSectionHead(this.copy.challengeLabel, this.copy.challengeTitle);
      head.querySelector('h2').id = 'project-decisions-title';
      const layout = create('div', 'decision-list');
      this.project.challenges.forEach(challenge => {
        const article = create('article', 'decision-panel drx-reveal');
        const problem = create('div', 'decision-problem');
        problem.append(create('h3', '', challenge.title), create('p', '', challenge.problem));
        const implementation = create('div', 'decision-implementation');
        const flow = create('ol', 'decision-flow');
        challenge.steps.forEach(step => flow.append(create('li', '', step)));
        implementation.append(flow, create('p', '', challenge.solution));
        article.append(problem, implementation);
        layout.append(article);
      });
      wrap.append(head, layout);
      section.append(wrap);
      return section;
    }

    createContribution() {
      const section = setAttributes(create('section', 'section section-alt project-contribution'), { id: 'contribution', 'data-case-section': '', 'aria-labelledby': 'project-contribution-title' });
      const wrap = create('div', 'wrap');
      const head = this.createSectionHead(this.copy.contributionLabel, this.copy.contributionTitle);
      head.querySelector('h2').id = 'project-contribution-title';
      const role = create('p', 'case-role-summary drx-reveal', this.project.roleSummary);
      const credits = create('details', 'case-credits drx-reveal');
      credits.append(create('summary', '', this.copy.credits));
      const list = create('ul');
      [...this.project.ownership.integrated, ...this.project.ownership.excluded].forEach(item => list.append(create('li', '', item)));
      credits.append(list);
      const cta = create('div', 'cta-panel project-case-cta drx-card drx-reveal');
      const ctaText = create('div');
      ctaText.append(create('span', 'section-label', this.copy.contact), create('h2', '', this.copy.endTitle));
      cta.append(ctaText, this.createAction(this.copy.contact, 'contact.html?topic=games', true));
      wrap.append(head, role, credits, cta);
      section.append(wrap);
      return section;
    }

    createSectionNav() {
      const nav = setAttributes(create('nav', 'project-section-nav'), { 'aria-label': this.isIndonesian ? 'Navigasi bedah teknis' : 'Technical breakdown navigation' });
      const wrap = create('div', 'wrap project-section-nav-inner');
      [
        ['overview', this.copy.overview],
        ['architecture', this.copy.architecture],
        ['decisions', this.isIndonesian ? 'Keputusan teknis' : 'Decisions'],
        ['systems', this.copy.systems],
        ['contribution', this.copy.contribution]
      ].forEach(([id, label], index) => {
        const link = create('a', index === 0 ? 'active' : '', label);
        link.href = `#${id}`;
        link.dataset.caseNav = id;
        wrap.append(link);
      });
      nav.append(wrap);
      return nav;
    }

    bindSectionNavigation() {
      const links = [...this.root.querySelectorAll('[data-case-nav]')];
      const sections = [...this.root.querySelectorAll('[data-case-section]')];
      const activate = id => links.forEach(link => link.classList.toggle('active', link.dataset.caseNav === id));
      links.forEach(link => link.addEventListener('click', () => activate(link.dataset.caseNav)));
      if (!('IntersectionObserver' in window)) return;
      const observer = new IntersectionObserver(entries => {
        const visible = entries.filter(entry => entry.isIntersecting).sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
        if (visible?.target.id) activate(visible.target.id);
      }, { rootMargin: '-24% 0px -62% 0px', threshold: [0, .2, .5] });
      sections.forEach(section => observer.observe(section));
    }

    mount() {
      this.root.replaceChildren(
        this.createHeader(),
        this.createSectionNav(),
        this.createOverview(),
        this.createArchitecture(),
        this.createChallenges(),
        this.createSystems(),
        this.createContribution()
      );
      this.bindSectionNavigation();
    }
  }

  const data = window.DRANXX_CASE_STUDIES;
  const config = window.DRANXX_CONFIG;
  if (!data || !config) return;

  document.querySelectorAll('[data-case-study-list]').forEach(root => new ProjectCollection(root, config).mount());
  document.querySelectorAll('[data-project-case-study]').forEach(root => {
    const project = data.items.find(item => item.id === root.dataset.projectCaseStudy);
    if (project) new ProjectCaseStudy(root, project, config).mount();
  });
})();
