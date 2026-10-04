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
    const progress = document.getElementById('scrollProgress');
    const backToTop = document.getElementById('backToTop');
    const cursorDot = document.getElementById('cursorDot');
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

    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      const menu = document.querySelector('.drx-navbar-links');
      const toggle = document.querySelector('.drx-navbar-toggle');
      menu?.classList.remove('open');
      toggle?.classList.remove('open');
      toggle?.setAttribute('aria-expanded', 'false');
    });

    const setupTilt = () => {
      if (reducedMotion || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
      document.querySelectorAll('.project-card:not([data-tilt-ready]), .profile-avatar:not([data-tilt-ready])').forEach(card => {
        card.dataset.tiltReady = 'true';
        card.addEventListener('pointermove', event => {
          const rect = card.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width - .5;
          const y = (event.clientY - rect.top) / rect.height - .5;
          card.style.transform = `perspective(900px) rotateX(${(-y * 4).toFixed(2)}deg) rotateY(${(x * 4).toFixed(2)}deg) translateY(-6px)`;
        });
        card.addEventListener('pointerleave', () => { card.style.transform = ''; });
      });
    };

    setupTilt();
    document.addEventListener('dranxx:content-ready', setupTilt);

    if (cursorDot && !reducedMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      document.documentElement.classList.add('has-custom-cursor');
      let targetX = window.innerWidth / 2;
      let targetY = window.innerHeight / 2;
      let dotX = targetX;
      let dotY = targetY;
      let cursorFrame = 0;

      const animateCursor = () => {
        dotX += (targetX - dotX) * .34;
        dotY += (targetY - dotY) * .34;
        cursorDot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0)`;
        if (Math.abs(targetX - dotX) > .1 || Math.abs(targetY - dotY) > .1) {
          cursorFrame = window.requestAnimationFrame(animateCursor);
        } else {
          cursorFrame = 0;
        }
      };

      window.addEventListener('pointermove', event => {
        targetX = event.clientX;
        targetY = event.clientY;
        cursorDot.classList.add('visible');
        if (!cursorFrame) cursorFrame = window.requestAnimationFrame(animateCursor);
      }, { passive: true });
      window.addEventListener('pointerout', event => {
        if (event.relatedTarget) return;
        cursorDot.classList.remove('visible');
      });
      document.addEventListener('pointerover', event => {
        if (event.target instanceof Element && event.target.closest('a, button, input, select, textarea, summary, [role="button"]')) cursorDot.classList.add('is-hovering');
      });
      document.addEventListener('pointerout', event => {
        if (!(event.target instanceof Element) || !event.target.closest('a, button, input, select, textarea, summary, [role="button"]')) return;
        if (event.relatedTarget instanceof Element && event.relatedTarget.closest('a, button, input, select, textarea, summary, [role="button"]')) return;
        cursorDot.classList.remove('is-hovering');
      });
    }

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
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (progress) progress.style.width = `${scrollableHeight > 0 ? (window.scrollY / scrollableHeight) * 100 : 0}%`;
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
