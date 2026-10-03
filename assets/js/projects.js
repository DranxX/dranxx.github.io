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
        overview: 'Overview',
        architecture: 'Architecture',
        systems: 'Core systems',
        contribution: 'Role & credits',
        overviewLabel: 'Project overview',
        overviewTitle: 'Dari mencari match sampai merebut benteng',
        architectureLabel: 'Match flow',
        architectureTitle: 'Satu match, tiga place',
        systemsLabel: 'Engineering scope',
        systemsTitle: 'Lihat sistemnya lebih dekat',
        contributionLabel: 'Role & credits',
        contributionTitle: 'Gameplay dan backend scripting',
        challengeLabel: 'Engineering decisions',
        challengeTitle: 'Saat alur normal tidak cukup',
        details: 'Buka detail teknis',
        credits: 'Kredit aset & dependency',
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
        overviewTitle: 'From finding a match to capturing a fort',
        architectureLabel: 'Match flow',
        architectureTitle: 'One match, three places',
        systemsLabel: 'Engineering scope',
        systemsTitle: 'Take a closer look at the systems',
        contributionLabel: 'Role & credits',
        contributionTitle: 'Gameplay and backend scripting',
        challengeLabel: 'Engineering decisions',
        challengeTitle: 'When the normal flow is not enough',
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
      cta.append(ctaText, this.createAction(this.copy.contact, 'contact?topic=games', true));
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
        ['decisions', 'Decisions'],
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

  document.querySelectorAll('[data-project-case-study]').forEach(root => {
    const project = data.items.find(item => item.id === root.dataset.projectCaseStudy);
    if (project) new ProjectCaseStudy(root, project, config).mount();
  });
})();
