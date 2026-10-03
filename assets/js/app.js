(() => {
  const init = () => {
    const config = window.DRANXX_CONFIG;
    const isIndonesian = config?.locale === 'id';
    const copy = isIndonesian ? {
      filteredBy: 'Hasil untuk',
      showingAll: 'Semua proyek',
      projectCount: count => `${count} proyek`,
      projectFallback: 'Proyek atau kolaborasi',
      topics: {
        project: 'Proyek atau kolaborasi',
        games: 'Sistem gameplay',
        software: 'Software atau tooling',
        'ai-ml': 'Eksperimen AI / ML',
        'security-performance': 'Keamanan atau performa'
      },
      subject: label => `Pertanyaan dari portofolio: ${label}`,
      sending: 'Mengirim…',
      sent: email => `Terkirim. Saya akan membalas ke ${email}.`,
      sendFailed: `Pesan gagal terkirim. Silakan email langsung ke ${config?.email}.`
    } : {
      filteredBy: 'Results for',
      showingAll: 'All projects',
      projectCount: count => `${count} project${count === 1 ? '' : 's'}`,
      projectFallback: 'Project or collaboration',
      topics: {
        project: 'Project or collaboration',
        games: 'Gameplay systems',
        software: 'Software or tooling',
        'ai-ml': 'AI / ML experiments',
        'security-performance': 'Security or performance'
      },
      subject: label => `Portfolio inquiry: ${label}`,
      sending: 'Sending…',
      sent: email => `Sent. I’ll reply to ${email}.`,
      sendFailed: `Couldn’t send it. Please email ${config?.email} instead.`
    };
    const progress = document.getElementById('scrollProgress');
    const backToTop = document.getElementById('backToTop');
    const cursorLight = document.getElementById('cursorLight');
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

    if (cursorLight && cursorDot && !reducedMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      document.documentElement.classList.add('has-custom-cursor');
      let targetX = window.innerWidth / 2;
      let targetY = window.innerHeight / 2;
      let glowX = targetX;
      let glowY = targetY;
      let dotX = targetX;
      let dotY = targetY;
      let cursorFrame = 0;

      const animateCursor = () => {
        glowX += (targetX - glowX) * .075;
        glowY += (targetY - glowY) * .075;
        dotX += (targetX - dotX) * .34;
        dotY += (targetY - dotY) * .34;
        cursorLight.style.transform = `translate3d(${glowX}px, ${glowY}px, 0)`;
        cursorDot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0)`;
        if (Math.abs(targetX - glowX) > .1 || Math.abs(targetY - glowY) > .1 || Math.abs(targetX - dotX) > .1 || Math.abs(targetY - dotY) > .1) {
          cursorFrame = window.requestAnimationFrame(animateCursor);
        } else {
          cursorFrame = 0;
        }
      };

      window.addEventListener('pointermove', event => {
        targetX = event.clientX;
        targetY = event.clientY;
        cursorLight.classList.add('visible');
        cursorDot.classList.add('visible');
        if (!cursorFrame) cursorFrame = window.requestAnimationFrame(animateCursor);
      }, { passive: true });
      window.addEventListener('pointerout', event => {
        if (event.relatedTarget) return;
        cursorLight.classList.remove('visible');
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

    // The site is static, so FormSubmit relays the form to config.email. The first message
    // sent to a new address triggers an activation email that has to be confirmed once.
    document.querySelectorAll('[data-contact-form]').forEach(form => {
      const requestedTopic = new URLSearchParams(window.location.search).get('topic');
      const topic = Object.hasOwn(copy.topics, requestedTopic) ? copy.topics[requestedTopic] : copy.projectFallback;
      const status = form.querySelector('[data-form-message]');
      const submit = form.querySelector('[type="submit"]');
      form.addEventListener('submit', async event => {
        event.preventDefault();
        if (!form.reportValidity()) return;

        const values = new FormData(form);
        const replyEmail = String(values.get('email') || '').trim();
        submit.disabled = true;
        status.textContent = copy.sending;
        try {
          const response = await fetch(`https://formsubmit.co/ajax/${config.email}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
              name: String(values.get('name') || '').trim(),
              email: replyEmail,
              message: String(values.get('message') || '').trim(),
              _subject: copy.subject(topic),
              _template: 'table',
              _honey: String(values.get('_honey') || '')
            })
          });
          const result = await response.json().catch(() => ({}));
          if (!response.ok || String(result.success) !== 'true') throw new Error(result.message || `FormSubmit responded with ${response.status}`);
          form.reset();
          status.textContent = copy.sent(replyEmail);
        } catch (error) {
          console.warn('The contact form could not be sent.', error);
          status.textContent = copy.sendFailed;
        } finally {
          submit.disabled = false;
        }
      });
    });

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
