(() => {
  const init = () => {
    const config = window.DRANXX_CONFIG;
    const isIndonesian = config?.locale === 'id';
    const copy = isIndonesian ? {
      filteredBy: 'Hasil untuk',
      showingAll: 'Semua proyek',
      projectCount: count => `${count} proyek`,
      sentFallback: 'Pesan terkirim. Saya akan segera membalas.'
    } : {
      filteredBy: 'Results for',
      showingAll: 'All projects',
      projectCount: count => `${count} project${count === 1 ? '' : 's'}`,
      sentFallback: 'Your message was sent. I’ll reply soon.'
    };
    const backToTop = document.getElementById('backToTop');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const introElements = [...document.querySelectorAll('.home-hero .drx-reveal, .page-hero .drx-reveal, .project-case-hero .drx-reveal')];
    introElements.forEach((element, index) => {
      element.style.setProperty('--enter-delay', `${index * 90}ms`);
    });
    const revealAll = () => {
      document.querySelectorAll('.drx-reveal').forEach(element => element.classList.add('visible'));
    };
    const runtime = globalThis.DRX;

    if (runtime?.init) {
      try {
        const diagnostics = runtime.init({
          preloader: false,
          pageTransitions: false,
          themeToggle: '.drx-theme-toggle',
          reveal: '.drx-reveal'
        });
        const errors = diagnostics?.lastRun?.errors || [];
        if (errors.length) console.warn('DRX initialized with errors:', errors);
        if (errors.some(error => error.initializer === 'reveal')) revealAll();
      } catch (error) {
        console.error('DRX initialization failed:', error);
        revealAll();
      }
    } else {
      console.error('DRX runtime is unavailable; revealing static content.');
      revealAll();
    }
    document.addEventListener('dranxx:content-ready', () => {
      if (runtime?.initReveal) runtime.initReveal('.drx-reveal');
      else revealAll();
    });
    // Safety net: if the observer never fires (hidden tab, suspended renderer),
    // the page must not stay invisible. Only kicks in when nothing revealed at all.
    const revealIfStuck = () => {
      if (!document.querySelector('.drx-reveal.visible')) revealAll();
    };
    window.setTimeout(revealIfStuck, 1500);
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(type => {
      window.addEventListener(type, revealIfStuck, { once: true, passive: true });
    });

    const menu = document.querySelector('.drx-navbar-links');
    const menuToggle = document.querySelector('.drx-navbar-toggle');
    const mobileNav = window.matchMedia('(max-width: 900px)');
    const closeMenu = () => {
      menu?.classList.remove('open');
      menuToggle?.classList.remove('open');
      menuToggle?.setAttribute('aria-expanded', 'false');
    };
    document.addEventListener('keydown', event => {
      if (!mobileNav.matches || !menu?.classList.contains('open')) return;
      if (event.key === 'Escape') {
        closeMenu();
        menuToggle?.focus();
      }
    });
    menuToggle?.addEventListener('click', event => {
      if (event.detail !== 0 || !mobileNav.matches) return;
      window.requestAnimationFrame(() => {
        if (menu?.classList.contains('open')) menu.querySelector('a')?.focus({ preventScroll: true });
      });
    });
    mobileNav.addEventListener('change', closeMenu);

    // Cursor spotlight: a soft accent glow follows the pointer across cards.
    const setupSpotlight = () => {
      if (reducedMotion || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
      document.querySelectorAll('.project-card:not([data-spotlight]), .resource-card:not([data-spotlight]), .principle-card:not([data-spotlight])').forEach(card => {
        card.dataset.spotlight = 'true';
        // One write per frame, zero layout reads while moving: the rect is cached on entry.
        let rect = card.getBoundingClientRect();
        let pendingFrame = 0;
        let latestX = 0;
        let latestY = 0;
        card.addEventListener('pointerenter', () => { rect = card.getBoundingClientRect(); }, { passive: true });
        card.addEventListener('pointermove', event => {
          latestX = event.clientX;
          latestY = event.clientY;
          if (pendingFrame) return;
          pendingFrame = window.requestAnimationFrame(() => {
            pendingFrame = 0;
            card.style.setProperty('--mx', `${Math.round(latestX - rect.left)}px`);
            card.style.setProperty('--my', `${Math.round(latestY - rect.top)}px`);
          });
        }, { passive: true });
      });
    };

    setupSpotlight();
    document.addEventListener('dranxx:content-ready', setupSpotlight);

    // Hero stats: the static HTML carries the current counts, this recomputes
    // them from the data files so new entries need no manual edit.
    const fillHeroStats = () => {
      const projects = window.DRANXX_DATA?.projects?.length;
      const resources = window.DRANXX_RESOURCES?.items?.filter(item => item.published)?.length;
      document.querySelectorAll('[data-stat="projects"]').forEach(node => { if (projects) node.textContent = projects; });
      document.querySelectorAll('[data-stat="resources"]').forEach(node => { if (resources) node.textContent = resources; });
    };
    fillHeroStats();

    const projectDiscovery = document.querySelector('[data-project-discovery]');
    if (projectDiscovery) {
      const normalizeFilterText = value => String(value)
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9+#.]+/g, ' ')
        .trim();
      const search = projectDiscovery.querySelector('[data-project-search]');
      const filters = [...projectDiscovery.querySelectorAll('[data-project-filter]')];
      const clearButtons = [...document.querySelectorAll('[data-project-clear]')];
      const countNodes = [...document.querySelectorAll('[data-project-count]')];
      const summary = document.querySelector('[data-project-summary]');
      const emptyState = document.querySelector('[data-project-empty]');
      const state = { query: '', category: 'all' };

      const matchesProject = card => {
        const scopes = (card.dataset.scopes || '').split(/\s+/).filter(Boolean);
        const tokens = state.query.split(' ').filter(Boolean);
        const haystack = card.dataset.projectSearch || '';
        const queryMatch = !tokens.length || tokens.every(token => haystack.includes(token));
        const scopeMatch = state.category === 'all' || scopes.includes(state.category);
        return queryMatch && scopeMatch;
      };

      const describeFilters = () => {
        const parts = [];
        if (state.query) parts.push(`“${search.value.trim()}”`);
        if (state.category !== 'all') parts.push(filters.find(button => button.dataset.projectFilter === state.category)?.textContent.trim());
        return parts.length ? `${copy.filteredBy} ${parts.join(' · ')}` : copy.showingAll;
      };

      const applyProjectFilters = () => {
        let visibleCount = 0;
        document.querySelectorAll('[data-project-card]').forEach(card => {
          const visible = matchesProject(card);
          card.hidden = !visible;
          if (visible) visibleCount += 1;
        });
        countNodes.forEach(node => { node.textContent = copy.projectCount(visibleCount); });
        if (summary) summary.textContent = describeFilters();
        if (emptyState) emptyState.hidden = visibleCount !== 0;
        filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.projectFilter === state.category)));
        const hasActiveFilters = Boolean(state.query || state.category !== 'all');
        clearButtons.forEach(button => { button.disabled = !hasActiveFilters; });
      };

      let searchTimer = 0;
      search?.addEventListener('input', () => {
        window.clearTimeout(searchTimer);
        searchTimer = window.setTimeout(() => {
          state.query = normalizeFilterText(search.value);
          applyProjectFilters();
        }, 120);
      });
      filters.forEach(button => button.addEventListener('click', () => {
        window.clearTimeout(searchTimer);
        state.query = normalizeFilterText(search.value);
        state.category = button.dataset.projectFilter;
        applyProjectFilters();
      }));
      clearButtons.forEach(button => button.addEventListener('click', () => {
        state.query = '';
        window.clearTimeout(searchTimer);
        state.category = 'all';
        if (search) search.value = '';
        applyProjectFilters();
        search?.focus();
      }));

      applyProjectFilters();
      document.addEventListener('dranxx:content-ready', applyProjectFilters);
    }

    // FormSubmit redirects back with ?sent=1 after a successful POST.
    const formSent = new URLSearchParams(window.location.search).get('sent');
    if (formSent === '1') {
      const fireAndForget = async () => {
        try {
          const status = document.querySelector('[data-form-message]');
          if (status) status.textContent = copy.sentFallback;
        } catch {}
      };
      fireAndForget();
    }

    const updateScrollState = () => {
      backToTop?.classList.toggle('visible', window.scrollY > 560);
    };
    window.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    updateScrollState();

    backToTop?.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    });

  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
