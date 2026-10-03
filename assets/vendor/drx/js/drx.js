globalThis.DRX = (() => {

  const version = '2.0.0';
  const runtimeState = {
    version,
    runs: 0,
    lastRun: null,
    history: []
  };

  const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  function claim(el, name) {
    const attr = `data-drx-${name}-ready`;
    if (el.hasAttribute(attr)) return false;
    el.setAttribute(attr, 'true');
    return true;
  }

  function resolveTarget(trigger, attribute) {
    const selector = trigger.getAttribute(attribute);
    if (!selector) return null;
    try { return document.querySelector(selector); }
    catch (_) { return null; }
  }

  function emit(el, name, detail = {}) {
    el.dispatchEvent(new CustomEvent(`drx:${name}`, { bubbles: true, detail }));
  }

  function getDiagnostics() {
    return {
      version: runtimeState.version,
      runs: runtimeState.runs,
      lastRun: runtimeState.lastRun ? {
        ...runtimeState.lastRun,
        initialized: [...runtimeState.lastRun.initialized],
        errors: runtimeState.lastRun.errors.map(error => ({ ...error }))
      } : null,
      history: runtimeState.history.map(run => ({
        ...run,
        initialized: [...run.initialized],
        errors: run.errors.map(error => ({ ...error }))
      }))
    };
  }

  function runInitializer(run, name, initializer) {
    try {
      initializer();
      run.initialized.push(name);
    } catch (error) {
      const entry = {
        initializer: name,
        message: error instanceof Error ? error.message : String(error)
      };
      run.errors.push(entry);
      if (typeof console !== 'undefined' && console.error) console.error(`[DRX] ${name} failed`, error);
      try { emit(document.documentElement, 'init-error', entry); } catch (_) { /* Diagnostics must never stop the remaining initializers. */ }
    }
  }

  function focusFirst(container) {
    const target = container.querySelector('[autofocus], ' + focusableSelector);
    if (target) target.focus();
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(() => true, () => false);
    }
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    field.style.pointerEvents = 'none';
    document.body.appendChild(field);
    field.select();
    let copied = false;
    try { copied = document.execCommand('copy'); } catch (_) { copied = false; }
    field.remove();
    return Promise.resolve(copied);
  }

  function setCopyState(button, copied) {
    if (!button._drxCopyLabel) button._drxCopyLabel = button.textContent.trim() || 'Copy';
    button.dataset.copyState = copied ? 'success' : 'error';
    button.textContent = copied ? 'Copied' : 'Copy failed';
    window.setTimeout(() => {
      button.removeAttribute('data-copy-state');
      button.textContent = button._drxCopyLabel;
    }, 1600);
  }

  function restoreBodyScroll() {
    if (!document.querySelector('.drx-modal-overlay.drx-active, .drx-drawer.drx-active, .drx-sheet.drx-active, .drx-command-overlay.drx-active')) {
      document.body.style.overflow = '';
    }
  }

  function initPreloader(selector = '.drx-preloader') {
    const el = document.querySelector(selector);
    if (!el || !claim(el, 'preloader')) return;
    const hide = () => {
      setTimeout(() => {
        el.classList.add('fade-out');
        setTimeout(() => {
          document.body.classList.remove('loading');
          document.body.classList.remove('page-transitioning');
        }, 600);
      }, 300);
    };
    if (document.readyState === 'complete') hide();
    else window.addEventListener('load', hide);
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) {
        el.classList.add('fade-out');
        document.body.classList.remove('loading');
        document.body.classList.remove('page-transitioning');
      }
    });
  }

  function initTheme(selector = '.drx-theme-toggle') {
    const toggles = document.querySelectorAll(selector || '.drx-theme-toggle');
    let stored = 'dark';
    try { stored = localStorage.getItem('drx-theme') || 'dark'; } catch (_) { /* Storage may be unavailable on local files. */ }
    document.documentElement.classList.toggle('light', stored === 'light');
    document.documentElement.setAttribute('data-theme', stored);
    toggles.forEach(toggle => {
      if (!claim(toggle, 'theme')) return;
      const icon = toggle.querySelector('i');
      if (icon) icon.className = stored === 'dark' ? 'bi bi-moon' : 'bi bi-sun';
      toggle.setAttribute('aria-pressed', String(stored === 'light'));
      toggle.addEventListener('click', () => {
        const isLight = document.documentElement.classList.toggle('light');
        const theme = isLight ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', theme);
        try { localStorage.setItem('drx-theme', theme); } catch (_) { /* Theme still works for this page. */ }
        toggles.forEach(item => {
          const itemIcon = item.querySelector('i');
          if (itemIcon) itemIcon.className = theme === 'dark' ? 'bi bi-moon' : 'bi bi-sun';
          item.setAttribute('aria-pressed', String(theme === 'light'));
        });
        emit(document.documentElement, 'theme-change', { theme });
      });
    });
  }

  function initNavbar(opts = {}) {
    const nav = document.querySelector(opts.nav || '.drx-navbar');
    const toggle = document.querySelector(opts.toggle || '.drx-navbar-toggle');
    const menu = document.querySelector(opts.menu || '.drx-navbar-links');
    if (toggle && menu && claim(toggle, 'navbar')) {
      toggle.setAttribute('aria-expanded', String(menu.classList.contains('open')));
      toggle.addEventListener('click', () => {
        menu.classList.toggle('open');
        toggle.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(menu.classList.contains('open')));
      });
      menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          menu.classList.remove('open');
          toggle.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
    }
    if (nav && claim(nav, 'navbar-scroll')) {
      window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 40);
      }, { passive: true });
    }
  }

  function initPageTransitions(preloaderSelector = '.drx-preloader') {
    const preloader = document.querySelector(preloaderSelector);
    document.querySelectorAll('a[href]').forEach(link => {
      if (!claim(link, 'transition')) return;
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        const current = window.location.pathname.split('/').pop() || 'index';
        if (!href || link.hasAttribute('download') || link.target === '_blank') return;
        if (href.startsWith('#') || href.startsWith('http') || href.startsWith('//') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
        if (href === current || href === `${current}.html`) return;
        e.preventDefault();
        if (preloader) preloader.classList.remove('fade-out');
        document.body.classList.add('page-transitioning');
        setTimeout(() => { window.location.href = href; }, 600);
      });
    });
  }

  function initReveal(selector = '.drx-reveal') {
    const elements = [...document.querySelectorAll(selector)];
    const showWithoutObserver = () => {
      elements.forEach(el => {
        if (!claim(el, 'reveal')) return;
        el.classList.add('visible');
      });
    };

    if (typeof IntersectionObserver !== 'function') {
      showWithoutObserver();
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    elements.forEach(el => { if (claim(el, 'reveal')) io.observe(el); });
  }

  function initHeroWords(selector = '.drx-h1-word') {
    const words = document.querySelectorAll(selector);
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.1 });
    words.forEach((el, i) => {
      if (!claim(el, 'hero-word')) return;
      io.observe(el);
      setTimeout(() => el.classList.add('visible'), 150 + i * 80);
    });
  }

  function initTabs(container = '.drx-tabs') {
    document.querySelectorAll(container).forEach((tabBar, tabBarIndex) => {
      if (!claim(tabBar, 'tabs')) return;
      const tabs = Array.from(tabBar.querySelectorAll('.drx-tab'));
      const parent = tabBar.parentElement;
      if (!tabs.length || !parent) return;
      tabBar.setAttribute('role', 'tablist');

      const activate = (tab, focus = false) => {
        tabs.forEach((item, index) => {
          const selected = item === tab;
          const target = item.getAttribute('data-tab');
          const content = target ? parent.querySelector(`[data-tab-content="${target}"]`) : null;
          item.classList.toggle('active', selected);
          item.setAttribute('aria-selected', String(selected));
          item.tabIndex = selected ? 0 : -1;
          if (!item.id) item.id = `drx-tab-${tabBarIndex + 1}-${index + 1}`;
          if (content) {
            if (!content.id) content.id = `drx-tab-panel-${tabBarIndex + 1}-${index + 1}`;
            item.setAttribute('aria-controls', content.id);
            content.setAttribute('role', 'tabpanel');
            content.setAttribute('aria-labelledby', item.id);
            content.classList.toggle('active', selected);
            content.hidden = !selected;
          }
        });
        if (focus) tab.focus();
        emit(tabBar, 'tab-change', { value: tab.getAttribute('data-tab'), tab });
      };

      tabs.forEach((tab, index) => {
        tab.setAttribute('role', 'tab');
        tab.addEventListener('click', () => activate(tab));
        tab.addEventListener('keydown', event => {
          let nextIndex = null;
          if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % tabs.length;
          if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + tabs.length) % tabs.length;
          if (event.key === 'Home') nextIndex = 0;
          if (event.key === 'End') nextIndex = tabs.length - 1;
          if (nextIndex !== null) { event.preventDefault(); activate(tabs[nextIndex], true); }
        });
      });
      activate(tabs.find(tab => tab.classList.contains('active')) || tabs[0]);
    });
  }

  function initAccordion(selector = '.drx-accordion') {
    document.querySelectorAll(selector).forEach((acc, accIndex) => {
      if (!claim(acc, 'accordion')) return;
      const items = Array.from(acc.querySelectorAll('.drx-accordion-item'));
      const multiple = acc.hasAttribute('data-multiple');
      const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const setOpen = (item, open, itemIndex, animate = true) => {
        const trigger = item.querySelector('.drx-accordion-trigger');
        const content = item.querySelector('.drx-accordion-content');
        if (trigger) trigger.setAttribute('aria-expanded', String(open));
        if (content) {
          if (!content.id) content.id = `drx-accordion-${accIndex + 1}-${itemIndex + 1}`;
          content.setAttribute('aria-hidden', String(!open));
          if ('inert' in content) content.inert = !open;
          if (trigger) trigger.setAttribute('aria-controls', content.id);
          const currentHeight = content.getBoundingClientRect().height;
          content.style.height = `${currentHeight}px`;
          item.classList.toggle('active', open);

          if (!animate || reducedMotion) {
            content.style.height = open ? 'auto' : '0px';
          } else {
            content.getBoundingClientRect();
            requestAnimationFrame(() => {
              content.style.height = open ? `${content.scrollHeight}px` : '0px';
            });
          }
        }
      };
      items.forEach((item, itemIndex) => {
        const trigger = item.querySelector('.drx-accordion-trigger');
        if (!trigger) return;
        const content = item.querySelector('.drx-accordion-content');
        setOpen(item, item.classList.contains('active'), itemIndex, false);
        if (content) {
          content.addEventListener('transitionend', event => {
            if (event.propertyName === 'height' && item.classList.contains('active')) content.style.height = 'auto';
          });
        }
        trigger.addEventListener('click', () => {
          const isActive = item.classList.contains('active');
          if (!multiple) items.forEach((other, otherIndex) => { if (other !== item && other.classList.contains('active')) setOpen(other, false, otherIndex); });
          setOpen(item, !isActive, itemIndex);
          emit(acc, 'accordion-change', { index: itemIndex, open: !isActive, item });
        });
      });
    });
  }

  function initModals() {
    document.querySelectorAll('[data-modal-open]').forEach(btn => {
      if (!claim(btn, 'modal-open')) return;
      btn.addEventListener('click', () => {
        const target = resolveTarget(btn, 'data-modal-open');
        if (!target) return;
        target._drxReturnFocus = btn;
        target.classList.add('drx-active');
        target.setAttribute('aria-hidden', 'false');
        const dialog = target.querySelector('.drx-modal');
        if (dialog) {
          if (!dialog.hasAttribute('role')) dialog.setAttribute('role', target.hasAttribute('data-alert-dialog') ? 'alertdialog' : 'dialog');
          dialog.setAttribute('aria-modal', 'true');
        }
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => focusFirst(target));
        emit(target, 'modal-open');
      });
    });

    const closeModal = (overlay) => {
      if (!overlay) return;
      overlay.classList.remove('drx-active');
      overlay.setAttribute('aria-hidden', 'true');
      const returnFocus = overlay._drxReturnFocus;
      restoreBodyScroll();
      if (returnFocus && document.contains(returnFocus)) returnFocus.focus();
      emit(overlay, 'modal-close');
    };

    document.querySelectorAll('[data-modal-close]').forEach(btn => {
      if (!claim(btn, 'modal-close')) return;
      btn.addEventListener('click', () => closeModal(btn.closest('.drx-modal-overlay')));
    });
    document.querySelectorAll('.drx-modal-overlay').forEach(overlay => {
      if (!overlay.classList.contains('drx-active')) overlay.setAttribute('aria-hidden', 'true');
      if (!claim(overlay, 'modal-overlay')) return;
      overlay.addEventListener('click', (e) => {
        const locked = overlay.hasAttribute('data-alert-dialog') || overlay.getAttribute('data-dismiss-backdrop') === 'false';
        if (e.target === overlay && !locked) closeModal(overlay);
      });
    });

    if (!claim(document.documentElement, 'modal-keyboard')) return;
    document.addEventListener('keydown', (e) => {
      const active = document.querySelector('.drx-modal-overlay.drx-active');
      if (!active) return;
      if (e.key === 'Escape') {
        if (active.getAttribute('data-escape-close') !== 'false') closeModal(active);
        return;
      }
      if (e.key === 'Tab') {
        const focusable = Array.from(active.querySelectorAll(focusableSelector));
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  function initDrawers() {
    const closeDrawer = drawer => {
      if (!drawer) return;
      drawer.classList.remove('drx-active');
      drawer.setAttribute('aria-hidden', 'true');
      document.querySelectorAll('.drx-drawer-overlay.drx-active').forEach(overlay => overlay.classList.remove('drx-active'));
      restoreBodyScroll();
      if (drawer._drxReturnFocus && document.contains(drawer._drxReturnFocus)) drawer._drxReturnFocus.focus();
      emit(drawer, 'drawer-close');
    };

    document.querySelectorAll('[data-drawer-open]').forEach(btn => {
      if (!claim(btn, 'drawer-open')) return;
      btn.addEventListener('click', () => {
        const target = resolveTarget(btn, 'data-drawer-open');
        const overlaySelector = btn.getAttribute('data-drawer-overlay') || '.drx-drawer-overlay';
        let overlay = null;
        try { overlay = document.querySelector(overlaySelector); } catch (_) { /* Keep drawer usable without an overlay. */ }
        if (!target) return;
        target._drxReturnFocus = btn;
        target.classList.add('drx-active');
        target.setAttribute('aria-hidden', 'false');
        if (overlay) overlay.classList.add('drx-active');
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => focusFirst(target));
        emit(target, 'drawer-open');
      });
    });
    document.querySelectorAll('[data-drawer-close]').forEach(btn => {
      if (!claim(btn, 'drawer-close')) return;
      btn.addEventListener('click', () => closeDrawer(btn.closest('.drx-drawer')));
    });
    document.querySelectorAll('.drx-drawer-overlay').forEach(overlay => {
      if (!claim(overlay, 'drawer-overlay')) return;
      overlay.addEventListener('click', () => closeDrawer(document.querySelector('.drx-drawer.drx-active')));
    });
    document.querySelectorAll('.drx-drawer').forEach(drawer => { if (!drawer.classList.contains('drx-active')) drawer.setAttribute('aria-hidden', 'true'); });

    if (claim(document.documentElement, 'drawer-keyboard')) {
      document.addEventListener('keydown', event => {
        const active = document.querySelector('.drx-drawer.drx-active');
        if (!active) return;
        if (event.key === 'Escape') closeDrawer(active);
        if (event.key === 'Tab') {
          const focusable = Array.from(active.querySelectorAll(focusableSelector));
          if (!focusable.length) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
      });
    }
  }

  function toast(opts = {}) {
    const { title = '', message = '', type = 'info', duration = 4000, position = 'tr' } = opts;
    let container = document.querySelector(`.drx-toast-container-${position}`);
    if (!container) {
      container = document.createElement('div');
      container.className = `drx-toast-container drx-toast-container-${position}`;
      document.body.appendChild(container);
    }
    const el = document.createElement('div');
    el.className = `drx-toast drx-toast-${type}`;
    el.setAttribute('role', type === 'danger' ? 'alert' : 'status');
    const content = document.createElement('div');
    if (title) {
      const titleEl = document.createElement('div');
      titleEl.className = 'drx-toast-title';
      titleEl.textContent = title;
      content.appendChild(titleEl);
    }
    if (message) {
      const messageEl = document.createElement('div');
      messageEl.className = 'drx-toast-msg';
      messageEl.textContent = message;
      content.appendChild(messageEl);
    }
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'drx-toast-close';
    close.setAttribute('aria-label', 'Dismiss notification');
    close.textContent = '×';
    el.append(content, close);
    container.appendChild(el);
    close.addEventListener('click', () => removeToast(el));
    if (duration > 0) setTimeout(() => removeToast(el), duration);
    return el;
  }

  function removeToast(el) {
    el.classList.add('drx-toast-exit');
    setTimeout(() => el.remove(), 200);
  }

  function initTooltips() {
    document.querySelectorAll('[data-tooltip]').forEach((el, index) => {
      if (!claim(el, 'tooltip')) return;
      let tip = null;
      const show = () => {
        if (tip) return;
        tip = document.createElement('div');
        tip.className = 'drx-tooltip';
        tip.id = `drx-tooltip-${index + 1}`;
        tip.setAttribute('role', 'tooltip');
        tip.textContent = el.getAttribute('data-tooltip');
        document.body.appendChild(tip);
        const rect = el.getBoundingClientRect();
        tip.style.position = 'fixed';
        tip.style.left = `${Math.max(4, Math.min(rect.left + rect.width / 2 - tip.offsetWidth / 2, window.innerWidth - tip.offsetWidth - 4))}px`;
        tip.style.top = `${rect.top > tip.offsetHeight + 12 ? rect.top - tip.offsetHeight - 8 : rect.bottom + 8}px`;
        el.setAttribute('aria-describedby', tip.id);
        requestAnimationFrame(() => tip.classList.add('drx-active'));
      };
      const hide = () => {
        if (tip) { tip.remove(); tip = null; el.removeAttribute('aria-describedby'); }
      };
      el.addEventListener('mouseenter', show);
      el.addEventListener('mouseleave', hide);
      el.addEventListener('focus', show);
      el.addEventListener('blur', hide);
    });
  }

  function initScrollSpy(opts = {}) {
    const links = document.querySelectorAll(opts.links || '.drx-navbar-links a');
    const sections = document.querySelectorAll(opts.sections || 'section[id]');
    if (!links.length || !sections.length || !claim(document.documentElement, 'scroll-spy')) return;
    window.addEventListener('scroll', () => {
      let current = '';
      sections.forEach(s => { if (window.scrollY >= s.offsetTop - 80) current = s.id; });
      links.forEach(a => { a.classList.toggle('active', a.getAttribute('href') === `#${current}`); });
    }, { passive: true });
  }

  function init(opts = {}) {
    const run = {
      id: runtimeState.runs + 1,
      startedAt: new Date().toISOString(),
      initialized: [],
      errors: []
    };
    runtimeState.runs = run.id;
    const initializers = [
      ['preloader', () => { if (opts.preloader !== false) initPreloader(opts.preloader); }],
      ['theme', () => initTheme(opts.themeToggle)],
      ['navbar', () => initNavbar(opts)],
      ['page-transitions', () => { if (opts.pageTransitions !== false) initPageTransitions(opts.preloader); }],
      ['reveal', () => initReveal(opts.reveal)],
      ['hero-words', () => initHeroWords(opts.heroWords)],
      ['tabs', () => initTabs(opts.tabs)],
      ['accordion', () => initAccordion(opts.accordion)],
      ['modals', initModals],
      ['drawers', initDrawers],
      ['tooltips', initTooltips],
      ['scroll-spy', () => initScrollSpy(opts)],
      ['dropdowns', initDropdowns],
      ['file-upload', initFileUpload],
      ['count-up', initCountUp],
      ['scroll-reveal', initScrollReveal],
      ['collapsibles', initCollapsibles],
      ['toggles', initToggles],
      ['sliders', initSliders],
      ['input-otp', initOtp],
      ['comboboxes', initComboboxes],
      ['selects', initSelects],
      ['sheets', initSheets],
      ['hover-cards', initHoverCards],
      ['calendars', initCalendars],
      ['carousels', initCarousels],
      ['data-tables', initDataTables],
      ['commands', initCommands],
      ['context-menus', initContextMenus],
      ['menubars', initMenubars],
      ['resizable', initResizable],
      ['message-scrollers', initMessageScrollers],
      ['code-blocks', initCodeBlocks],
      ['json-views', initJsonViews],
      ['questionnaires', initQuestionnaires]
    ];
    initializers.forEach(([name, initializer]) => runInitializer(run, name, initializer));
    run.finishedAt = new Date().toISOString();
    runtimeState.lastRun = run;
    runtimeState.history.push(run);
    runtimeState.history = runtimeState.history.slice(-10);
    return getDiagnostics();
  }

  function refresh(opts = {}) {
    return init(opts);
  }

  function initDropdowns() {
    document.querySelectorAll('[data-dropdown]').forEach(trigger => {
      const controlled = resolveTarget(trigger, 'data-dropdown');
      if (!controlled) {
        trigger.setAttribute('aria-disabled', 'true');
        return;
      }
      if (!claim(trigger, 'dropdown')) return;
      trigger.removeAttribute('aria-disabled');
      trigger.setAttribute('aria-haspopup', 'menu');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('aria-haspopup', controlled.classList.contains('drx-popover') ? 'dialog' : 'menu');
      prepareDropdown(trigger, controlled);
      trigger.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        toggleDropdown(trigger);
      });
      trigger.addEventListener('keydown', event => {
        if (event.key !== 'ArrowDown') return;
        event.preventDefault();
        openDropdown(trigger, { focusFirstItem: true });
      });
    });
    if (claim(document.documentElement, 'dropdown-global')) {
      document.addEventListener('click', event => {
        const clicked = event.target instanceof Element ? event.target : null;
        const floating = clicked ? clicked.closest('.drx-menu-floating') : null;
        if (!floating || (clicked && clicked.closest('.drx-menu-item'))) closeAllDropdowns();
      });
      document.addEventListener('keydown', event => {
        if (event.key === 'Escape') closeAllDropdowns({ restoreFocus: true });
      });
      window.addEventListener('resize', positionOpenDropdowns, { passive: true });
      document.addEventListener('scroll', positionOpenDropdowns, { passive: true, capture: true });
    }
  }

  function prepareDropdown(trigger, target) {
    target.classList.add('drx-menu-floating');
    target.style.position = 'fixed';
    target.setAttribute('aria-hidden', 'true');
    if (target.classList.contains('drx-menu') && !target.hasAttribute('role')) target.setAttribute('role', 'menu');
    if (target.classList.contains('drx-popover') && !target.hasAttribute('role')) target.setAttribute('role', 'dialog');
    if (!target.id) target.id = `drx-dropdown-${Math.random().toString(36).slice(2, 9)}`;
    trigger.setAttribute('aria-controls', target.id);
    target._drxTrigger = trigger;
  }

  function positionDropdown(trigger, target) {
    if (!trigger || !target || !target.classList.contains('drx-active')) return;
    const viewportGap = 8;
    const triggerGap = 6;
    target.style.top = '0px';
    target.style.left = '0px';
    const triggerRect = trigger.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const availableBelow = window.innerHeight - triggerRect.bottom - viewportGap;
    const availableAbove = triggerRect.top - viewportGap;
    const openAbove = targetRect.height > availableBelow && availableAbove > availableBelow;
    const top = openAbove
      ? triggerRect.top - targetRect.height - triggerGap
      : triggerRect.bottom + triggerGap;
    const inlineStart = document.documentElement.dir === 'rtl'
      ? triggerRect.right - targetRect.width
      : triggerRect.left;
    target.style.top = `${Math.max(viewportGap, Math.min(top, window.innerHeight - targetRect.height - viewportGap))}px`;
    target.style.left = `${Math.max(viewportGap, Math.min(inlineStart, window.innerWidth - targetRect.width - viewportGap))}px`;
  }

  function positionOpenDropdowns() {
    document.querySelectorAll('.drx-menu-floating.drx-active').forEach(target => positionDropdown(target._drxTrigger, target));
  }

  function openDropdown(trigger, options = {}) {
    const target = trigger && typeof trigger !== 'string' ? resolveTarget(trigger, 'data-dropdown') : null;
    if (!trigger || typeof trigger === 'string' || !target) return false;
    if (!target.classList.contains('drx-menu-floating')) prepareDropdown(trigger, target);
    closeAllDropdowns({ except: target });
    target.classList.add('drx-active');
    target.setAttribute('aria-hidden', 'false');
    trigger.setAttribute('aria-expanded', 'true');
    positionDropdown(trigger, target);
    if (options.focusFirstItem) {
      requestAnimationFrame(() => {
        const first = target.querySelector('.drx-menu-item:not([disabled]), [role="menuitem"]:not([disabled]), button:not([disabled]), a[href]');
        if (first) first.focus();
      });
    }
    emit(target, 'dropdown-open', { trigger });
    return true;
  }

  function closeDropdown(target, options = {}) {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (!element) return false;
    const trigger = element._drxTrigger;
    element.classList.remove('drx-active');
    element.setAttribute('aria-hidden', 'true');
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
      if (options.restoreFocus) trigger.focus();
    }
    emit(element, 'dropdown-close', { trigger });
    return true;
  }

  function toggleDropdown(trigger) {
    const target = resolveTarget(trigger, 'data-dropdown');
    if (!target) return false;
    return target.classList.contains('drx-active') ? closeDropdown(target) : openDropdown(trigger);
  }

  function closeAllDropdowns(options = {}) {
    const except = options && options.except ? options.except : null;
    document.querySelectorAll('.drx-menu-floating.drx-active').forEach(target => {
      if (target !== except) closeDropdown(target, options);
    });
  }

  function initFileUpload() {
    document.querySelectorAll('.drx-file-upload').forEach(zone => {
      if (!claim(zone, 'file-upload')) return;
      const input = zone.querySelector('input[type="file"]');
      if (!input) return;
      if (!['LABEL', 'BUTTON'].includes(zone.tagName)) {
        zone.setAttribute('role', 'button');
        zone.tabIndex = zone.hasAttribute('tabindex') ? zone.tabIndex : 0;
      }
      zone.addEventListener('click', event => { if (event.target !== input) input.click(); });
      zone.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); input.click(); }
      });
      zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drx-file-dragover'); });
      zone.addEventListener('dragleave', () => zone.classList.remove('drx-file-dragover'));
      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('drx-file-dragover');
        if (e.dataTransfer.files.length) {
          input.files = e.dataTransfer.files;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    });
  }

  function initCountUp() {
    const counters = document.querySelectorAll('.drx-count-up');
    if (!counters.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.getAttribute('data-count') || el.textContent, 10);
          const duration = parseInt(el.getAttribute('data-duration') || '2000', 10);
          const start = 0;
          const startTime = performance.now();
          const step = (now) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.floor(start + (target - start) * eased);
            if (progress < 1) requestAnimationFrame(step);
            else el.textContent = target;
          };
          requestAnimationFrame(step);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.3 });
    counters.forEach(el => { if (claim(el, 'count-up')) io.observe(el); });
  }

  function initScrollReveal() {
    const els = document.querySelectorAll('.drx-scroll-reveal, .drx-scroll-reveal-left, .drx-scroll-reveal-right, .drx-scroll-reveal-scale');
    if (!els.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    els.forEach(el => { if (claim(el, 'scroll-reveal')) io.observe(el); });
  }

  function initCollapsibles() {
    document.querySelectorAll('[data-collapsible]').forEach((root, index) => {
      if (!claim(root, 'collapsible')) return;
      const trigger = root.querySelector('[data-collapsible-trigger]');
      const content = root.querySelector('[data-collapsible-content]');
      if (!trigger || !content) return;
      if (!content.id) content.id = `drx-collapsible-${index + 1}`;
      const setOpen = (open) => {
        root.classList.toggle('drx-active', open);
        trigger.setAttribute('aria-expanded', String(open));
        trigger.setAttribute('aria-controls', content.id);
        content.setAttribute('aria-hidden', String(!open));
        emit(root, 'collapsible-change', { open });
      };
      setOpen(root.classList.contains('drx-active') || root.hasAttribute('data-default-open'));
      trigger.addEventListener('click', () => setOpen(!root.classList.contains('drx-active')));
    });
  }

  function initToggles() {
    document.querySelectorAll('[data-toggle-group]').forEach(group => {
      if (!claim(group, 'toggle-group')) return;
      const toggles = Array.from(group.querySelectorAll('[data-toggle]'));
      const type = group.getAttribute('data-type') || 'single';
      const required = group.hasAttribute('data-required');

      const setPressed = (toggle, pressed) => {
        toggle.setAttribute('aria-pressed', String(pressed));
        toggle.classList.toggle('is-active', pressed);
      };

      toggles.forEach((toggle, index) => {
        setPressed(toggle, toggle.getAttribute('aria-pressed') === 'true' || toggle.classList.contains('is-active'));
        toggle.addEventListener('click', () => {
          const pressed = toggle.getAttribute('aria-pressed') === 'true';
          if (type === 'single') {
            if (pressed && required) return;
            toggles.forEach(item => setPressed(item, item === toggle ? !pressed : false));
          } else {
            setPressed(toggle, !pressed);
          }
          const values = toggles.filter(item => item.getAttribute('aria-pressed') === 'true').map(item => item.value || item.getAttribute('data-value') || item.textContent.trim());
          emit(group, 'toggle-change', { values, value: values[0] || null });
        });
        toggle.addEventListener('keydown', (event) => {
          if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
          event.preventDefault();
          const direction = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
          toggles[(index + direction + toggles.length) % toggles.length].focus();
        });
      });
    });

    document.querySelectorAll('[data-toggle]').forEach(toggle => {
      if (toggle.closest('[data-toggle-group]') || !claim(toggle, 'toggle')) return;
      const initial = toggle.getAttribute('aria-pressed') === 'true' || toggle.classList.contains('is-active');
      toggle.setAttribute('aria-pressed', String(initial));
      toggle.classList.toggle('is-active', initial);
      toggle.addEventListener('click', () => {
        const pressed = toggle.getAttribute('aria-pressed') !== 'true';
        toggle.setAttribute('aria-pressed', String(pressed));
        toggle.classList.toggle('is-active', pressed);
        emit(toggle, 'toggle-change', { pressed });
      });
    });
  }

  function initSliders() {
    document.querySelectorAll('[data-slider]').forEach(root => {
      if (!claim(root, 'slider')) return;
      const input = root.querySelector('input[type="range"]');
      const output = root.querySelector('[data-slider-value]');
      if (!input) return;
      const render = () => {
        const min = Number(input.min || 0);
        const max = Number(input.max || 100);
        const value = Number(input.value);
        const fill = max === min ? 0 : ((value - min) / (max - min)) * 100;
        input.style.setProperty('--drx-range-fill', `${Math.max(0, Math.min(100, fill))}%`);
        if (output) output.textContent = `${root.getAttribute('data-prefix') || ''}${input.value}${root.getAttribute('data-suffix') || ''}`;
        input.setAttribute('aria-valuetext', output ? output.textContent : input.value);
      };
      render();
      input.addEventListener('input', () => { render(); emit(root, 'slider-change', { value: Number(input.value) }); });
    });
  }

  function initOtp() {
    document.querySelectorAll('[data-otp]').forEach(root => {
      if (!claim(root, 'otp')) return;
      const inputs = Array.from(root.querySelectorAll('.drx-otp-input, input[data-otp-slot]'));
      const hidden = root.querySelector('[data-otp-value]');
      const mode = root.getAttribute('data-otp-mode') || 'numeric';
      const clean = value => mode === 'numeric' ? value.replace(/\D/g, '') : value.replace(/[^a-z0-9]/gi, '');
      const update = () => {
        const value = inputs.map(input => input.value).join('');
        if (hidden) hidden.value = value;
        emit(root, 'otp-change', { value, complete: inputs.length > 0 && value.length === inputs.length });
      };

      inputs.forEach((input, index) => {
        input.maxLength = 1;
        input.autocomplete = index === 0 ? 'one-time-code' : 'off';
        input.inputMode = mode === 'numeric' ? 'numeric' : 'text';
        input.addEventListener('input', () => {
          input.value = clean(input.value).slice(-1);
          if (input.value && inputs[index + 1]) inputs[index + 1].focus();
          update();
        });
        input.addEventListener('keydown', event => {
          if (event.key === 'Backspace' && !input.value && inputs[index - 1]) {
            inputs[index - 1].focus();
            inputs[index - 1].value = '';
            update();
          }
          if (event.key === 'ArrowLeft' && inputs[index - 1]) { event.preventDefault(); inputs[index - 1].focus(); }
          if (event.key === 'ArrowRight' && inputs[index + 1]) { event.preventDefault(); inputs[index + 1].focus(); }
        });
        input.addEventListener('focus', () => input.select());
      });

      root.addEventListener('paste', event => {
        const value = clean(event.clipboardData.getData('text')).slice(0, inputs.length);
        if (!value) return;
        event.preventDefault();
        inputs.forEach((input, index) => { input.value = value[index] || ''; });
        inputs[Math.min(value.length, inputs.length) - 1].focus();
        update();
      });
      update();
    });
  }

  function initComboboxes() {
    document.querySelectorAll('[data-combobox]').forEach((root, rootIndex) => {
      if (!claim(root, 'combobox')) return;
      const input = root.querySelector('[data-combobox-input]');
      const panel = root.querySelector('.drx-combobox-panel, [data-combobox-panel]');
      const toggle = root.querySelector('[data-combobox-toggle]');
      const options = panel ? Array.from(panel.querySelectorAll('[role="option"], .drx-combobox-option')) : [];
      const empty = panel ? panel.querySelector('.drx-combobox-empty') : null;
      if (!input || !panel) return;
      if (!panel.id) panel.id = `drx-combobox-list-${rootIndex + 1}`;
      input.setAttribute('role', 'combobox');
      input.setAttribute('aria-controls', panel.id);
      input.setAttribute('aria-autocomplete', 'list');
      panel.setAttribute('role', 'listbox');
      let activeIndex = -1;

      const open = () => {
        root.classList.add('drx-active');
        input.setAttribute('aria-expanded', 'true');
      };
      const close = () => {
        root.classList.remove('drx-active');
        input.setAttribute('aria-expanded', 'false');
        input.removeAttribute('aria-activedescendant');
        activeIndex = -1;
        options.forEach(option => option.classList.remove('is-active'));
      };
      const visible = () => options.filter(option => !option.hidden && option.getAttribute('aria-disabled') !== 'true');
      const setActive = index => {
        const items = visible();
        if (!items.length) return;
        activeIndex = (index + items.length) % items.length;
        items.forEach((option, i) => option.classList.toggle('is-active', i === activeIndex));
        const active = items[activeIndex];
        if (!active.id) active.id = `${panel.id}-option-${options.indexOf(active) + 1}`;
        input.setAttribute('aria-activedescendant', active.id);
        active.scrollIntoView({ block: 'nearest' });
      };
      const choose = option => {
        const value = option.getAttribute('data-value') || option.textContent.trim();
        input.value = option.getAttribute('data-label') || option.textContent.trim();
        root.setAttribute('data-value', value);
        options.forEach(item => item.setAttribute('aria-selected', String(item === option)));
        close();
        emit(root, 'select', { value, label: input.value, option });
      };
      const filter = () => {
        const query = input.value.trim().toLocaleLowerCase();
        let count = 0;
        options.forEach(option => {
          const match = !query || option.textContent.toLocaleLowerCase().includes(query) || (option.getAttribute('data-value') || '').toLocaleLowerCase().includes(query);
          option.hidden = !match;
          if (match) count += 1;
        });
        if (empty) empty.classList.toggle('is-visible', count === 0);
        activeIndex = -1;
        open();
      };

      input.setAttribute('aria-expanded', 'false');
      input.addEventListener('input', filter);
      input.addEventListener('focus', open);
      input.addEventListener('keydown', event => {
        if (event.key === 'ArrowDown') { event.preventDefault(); open(); setActive(activeIndex + 1); }
        else if (event.key === 'ArrowUp') { event.preventDefault(); open(); setActive(activeIndex - 1); }
        else if (event.key === 'Enter' && activeIndex >= 0) { event.preventDefault(); choose(visible()[activeIndex]); }
        else if (event.key === 'Escape') { event.preventDefault(); close(); }
      });
      if (toggle) toggle.addEventListener('click', event => { event.preventDefault(); root.classList.contains('drx-active') ? close() : (open(), input.focus()); });
      options.forEach(option => {
        option.setAttribute('role', 'option');
        option.addEventListener('pointerdown', event => event.preventDefault());
        option.addEventListener('click', () => choose(option));
      });
      document.addEventListener('pointerdown', event => { if (!root.contains(event.target)) close(); });
    });
  }

  function initSelects() {
    document.querySelectorAll('[data-select]').forEach((root, rootIndex) => {
      if (!claim(root, 'select')) return;
      const button = root.querySelector('[data-select-trigger]');
      const valueNode = root.querySelector('[data-select-value]');
      const panel = root.querySelector('.drx-select-panel, [data-select-panel]');
      const hidden = root.querySelector('input[type="hidden"]');
      const options = panel ? Array.from(panel.querySelectorAll('[role="option"], .drx-select-option')) : [];
      if (!button || !panel) return;
      if (!panel.id) panel.id = `drx-select-list-${rootIndex + 1}`;
      button.setAttribute('aria-haspopup', 'listbox');
      button.setAttribute('aria-controls', panel.id);
      panel.setAttribute('role', 'listbox');
      let activeIndex = Math.max(0, options.findIndex(option => option.getAttribute('aria-selected') === 'true'));

      const setOpen = open => {
        root.classList.toggle('drx-active', open);
        button.setAttribute('aria-expanded', String(open));
        if (open && options[activeIndex]) {
          options.forEach((option, i) => option.classList.toggle('is-active', i === activeIndex));
          options[activeIndex].focus({ preventScroll: true });
        }
      };
      const choose = option => {
        const value = option.getAttribute('data-value') || option.textContent.trim();
        const label = option.getAttribute('data-label') || option.textContent.trim();
        options.forEach(item => item.setAttribute('aria-selected', String(item === option)));
        activeIndex = options.indexOf(option);
        if (valueNode) valueNode.textContent = label;
        if (hidden) { hidden.value = value; hidden.dispatchEvent(new Event('change', { bubbles: true })); }
        root.setAttribute('data-value', value);
        setOpen(false);
        button.focus();
        emit(root, 'select', { value, label, option });
      };

      button.setAttribute('aria-expanded', 'false');
      button.addEventListener('click', () => setOpen(!root.classList.contains('drx-active')));
      button.addEventListener('keydown', event => {
        if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); setOpen(true); }
      });
      options.forEach((option, index) => {
        option.setAttribute('role', 'option');
        option.tabIndex = -1;
        option.addEventListener('click', () => choose(option));
        option.addEventListener('keydown', event => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            activeIndex = (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
            options[activeIndex].focus();
          } else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(option); }
          else if (event.key === 'Escape') { setOpen(false); button.focus(); }
          else if (event.key === 'Home') { event.preventDefault(); options[0].focus(); }
          else if (event.key === 'End') { event.preventDefault(); options[options.length - 1].focus(); }
        });
      });
      document.addEventListener('pointerdown', event => { if (!root.contains(event.target)) setOpen(false); });
    });
  }

  function initSheets() {
    const closeSheet = sheet => {
      if (!sheet) return;
      sheet.classList.remove('drx-active');
      sheet.setAttribute('aria-hidden', 'true');
      document.querySelectorAll('.drx-sheet-overlay.drx-active').forEach(overlay => overlay.classList.remove('drx-active'));
      restoreBodyScroll();
      if (sheet._drxReturnFocus && document.contains(sheet._drxReturnFocus)) sheet._drxReturnFocus.focus();
      emit(sheet, 'sheet-close');
    };

    document.querySelectorAll('[data-sheet-open]').forEach(button => {
      if (!claim(button, 'sheet-open')) return;
      button.addEventListener('click', () => {
        const sheet = resolveTarget(button, 'data-sheet-open');
        if (!sheet) return;
        sheet._drxReturnFocus = button;
        sheet.classList.add('drx-active');
        sheet.setAttribute('aria-hidden', 'false');
        const overlaySelector = button.getAttribute('data-sheet-overlay');
        const overlay = overlaySelector ? document.querySelector(overlaySelector) : document.querySelector('.drx-sheet-overlay');
        if (overlay) overlay.classList.add('drx-active');
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => focusFirst(sheet));
        emit(sheet, 'sheet-open');
      });
    });
    document.querySelectorAll('[data-sheet-close]').forEach(button => {
      if (!claim(button, 'sheet-close')) return;
      button.addEventListener('click', () => closeSheet(button.closest('.drx-sheet')));
    });
    document.querySelectorAll('.drx-sheet-overlay').forEach(overlay => {
      if (!claim(overlay, 'sheet-overlay')) return;
      overlay.addEventListener('click', () => closeSheet(document.querySelector('.drx-sheet.drx-active')));
    });
    document.querySelectorAll('.drx-sheet').forEach(sheet => { if (!sheet.classList.contains('drx-active')) sheet.setAttribute('aria-hidden', 'true'); });

    if (claim(document.documentElement, 'sheet-keyboard')) {
      document.addEventListener('keydown', event => {
        const active = document.querySelector('.drx-sheet.drx-active');
        if (!active) return;
        if (event.key === 'Escape') closeSheet(active);
        if (event.key === 'Tab') {
          const focusable = Array.from(active.querySelectorAll(focusableSelector));
          if (!focusable.length) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
      });
    }
  }

  function initHoverCards() {
    document.querySelectorAll('[data-hover-card]').forEach(trigger => {
      if (!claim(trigger, 'hover-card')) return;
      const card = resolveTarget(trigger, 'data-hover-card') || trigger.parentElement.querySelector('.drx-hover-card');
      if (!card) return;
      const root = trigger.closest('.drx-hover-card-wrap') || card;
      let timer;
      const open = () => {
        clearTimeout(timer);
        timer = setTimeout(() => { root.classList.add('drx-active'); trigger.setAttribute('aria-expanded', 'true'); }, Number(trigger.getAttribute('data-open-delay') || 120));
      };
      const close = () => {
        clearTimeout(timer);
        timer = setTimeout(() => { root.classList.remove('drx-active'); trigger.setAttribute('aria-expanded', 'false'); }, Number(trigger.getAttribute('data-close-delay') || 120));
      };
      trigger.setAttribute('aria-haspopup', 'dialog');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.addEventListener('mouseenter', open);
      trigger.addEventListener('mouseleave', close);
      trigger.addEventListener('focus', open);
      trigger.addEventListener('blur', close);
      card.addEventListener('mouseenter', () => clearTimeout(timer));
      card.addEventListener('mouseleave', close);
      card.addEventListener('focusin', () => clearTimeout(timer));
      card.addEventListener('focusout', event => { if (!card.contains(event.relatedTarget)) close(); });
    });
  }

  function initCalendars() {
    const parseDate = value => {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
      if (!match) return null;
      const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
      return Number.isNaN(date.getTime()) ? null : date;
    };
    const toValue = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const sameDay = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

    document.querySelectorAll('[data-calendar]').forEach((root, rootIndex) => {
      if (!claim(root, 'calendar')) return;
      const grid = root.querySelector('[data-calendar-grid]') || root.querySelector('.drx-calendar-grid');
      const title = root.querySelector('[data-calendar-title]');
      const previous = root.querySelector('[data-calendar-prev]');
      const next = root.querySelector('[data-calendar-next]');
      if (!grid) return;
      const locale = root.getAttribute('data-locale') || document.documentElement.lang || 'en-US';
      let selected = parseDate(root.getAttribute('data-value'));
      let view = selected ? new Date(selected) : new Date();
      view = new Date(view.getFullYear(), view.getMonth(), 1);
      const min = parseDate(root.getAttribute('data-min'));
      const max = parseDate(root.getAttribute('data-max'));
      if (!grid.id) grid.id = `drx-calendar-grid-${rootIndex + 1}`;
      grid.setAttribute('role', 'grid');

      const render = () => {
        if (title) title.textContent = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(view);
        grid.replaceChildren();
        const first = new Date(view.getFullYear(), view.getMonth(), 1);
        const start = new Date(first);
        start.setDate(1 - first.getDay());
        const today = new Date();
        for (let index = 0; index < 42; index += 1) {
          const date = new Date(start);
          date.setDate(start.getDate() + index);
          const value = toValue(date);
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'drx-calendar-day';
          button.textContent = String(date.getDate());
          button.setAttribute('role', 'gridcell');
          button.setAttribute('data-date', value);
          button.setAttribute('aria-label', new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(date));
          button.classList.toggle('is-outside', date.getMonth() !== view.getMonth());
          button.classList.toggle('is-today', sameDay(date, today));
          button.classList.toggle('is-selected', sameDay(date, selected));
          button.setAttribute('aria-selected', String(sameDay(date, selected)));
          if ((min && date < min) || (max && date > max)) button.disabled = true;
          button.addEventListener('click', () => {
            selected = date;
            view = new Date(date.getFullYear(), date.getMonth(), 1);
            root.setAttribute('data-value', value);
            const targetSelector = root.getAttribute('data-target');
            if (targetSelector) {
              try {
                const input = document.querySelector(targetSelector);
                if (input) { input.value = value; input.dispatchEvent(new Event('change', { bubbles: true })); }
              } catch (_) { /* Invalid selector: leave the calendar usable. */ }
            }
            render();
            const picker = root.closest('[data-date-picker]');
            if (picker) {
              picker.classList.remove('drx-active');
              const trigger = picker.querySelector('[data-date-picker-trigger]');
              if (trigger) trigger.setAttribute('aria-expanded', 'false');
            }
            emit(root, 'date-change', { value, date: new Date(date) });
          });
          grid.appendChild(button);
        }
      };

      if (previous) previous.addEventListener('click', () => { view.setMonth(view.getMonth() - 1); view = new Date(view); render(); });
      if (next) next.addEventListener('click', () => { view.setMonth(view.getMonth() + 1); view = new Date(view); render(); });
      render();
    });

    document.querySelectorAll('[data-date-picker]').forEach(root => {
      if (!claim(root, 'date-picker')) return;
      const trigger = root.querySelector('[data-date-picker-trigger]');
      const calendar = root.querySelector('[data-calendar]');
      if (!trigger || !calendar) return;
      if (!calendar.id) calendar.id = `drx-date-picker-calendar-${Math.random().toString(36).slice(2, 8)}`;
      trigger.setAttribute('aria-controls', calendar.id);
      trigger.setAttribute('aria-expanded', 'false');
      const setOpen = open => { root.classList.toggle('drx-active', open); trigger.setAttribute('aria-expanded', String(open)); };
      trigger.addEventListener('click', () => setOpen(!root.classList.contains('drx-active')));
      trigger.addEventListener('keydown', event => { if (event.key === 'Escape') setOpen(false); });
      document.addEventListener('pointerdown', event => { if (!root.contains(event.target)) setOpen(false); });
    });
  }

  function initCarousels() {
    document.querySelectorAll('[data-carousel]').forEach((root, rootIndex) => {
      if (!claim(root, 'carousel')) return;
      const viewport = root.querySelector('.drx-carousel-viewport');
      const track = root.querySelector('.drx-carousel-track');
      const slides = track ? Array.from(track.querySelectorAll('.drx-carousel-slide')) : [];
      const previous = root.querySelector('[data-carousel-prev]');
      const next = root.querySelector('[data-carousel-next]');
      const dots = root.querySelector('[data-carousel-dots]');
      const status = root.querySelector('[data-carousel-status]');
      const loop = root.hasAttribute('data-loop');
      if (!viewport || !track || !slides.length) return;
      let index = Math.max(0, Math.min(slides.length - 1, Number(root.getAttribute('data-start') || 0)));
      if (!viewport.id) viewport.id = `drx-carousel-${rootIndex + 1}`;
      viewport.setAttribute('aria-roledescription', 'carousel');
      viewport.tabIndex = viewport.hasAttribute('tabindex') ? viewport.tabIndex : 0;

      if (dots && !dots.children.length) {
        slides.forEach((_, dotIndex) => {
          const dot = document.createElement('button');
          dot.type = 'button';
          dot.className = 'drx-carousel-dot';
          dot.setAttribute('aria-label', `Go to slide ${dotIndex + 1}`);
          dot.addEventListener('click', () => goTo(dotIndex));
          dots.appendChild(dot);
        });
      }

      const render = () => {
        const offset = slides[index].offsetLeft - track.offsetLeft;
        track.style.transform = `translateX(${-offset}px)`;
        slides.forEach((slide, slideIndex) => {
          slide.setAttribute('aria-hidden', String(slideIndex !== index));
          slide.setAttribute('aria-label', `${slideIndex + 1} of ${slides.length}`);
          slide.setAttribute('aria-roledescription', 'slide');
        });
        if (previous) previous.disabled = !loop && index === 0;
        if (next) next.disabled = !loop && index === slides.length - 1;
        if (dots) Array.from(dots.children).forEach((dot, dotIndex) => {
          dot.classList.toggle('is-active', dotIndex === index);
          dot.setAttribute('aria-current', dotIndex === index ? 'true' : 'false');
        });
        if (status) status.textContent = `${String(index + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
        root.setAttribute('data-index', String(index));
      };
      function goTo(nextIndex) {
        if (loop) index = (nextIndex + slides.length) % slides.length;
        else index = Math.max(0, Math.min(slides.length - 1, nextIndex));
        render();
        emit(root, 'carousel-change', { index, slide: slides[index] });
      }

      if (previous) previous.addEventListener('click', () => goTo(index - 1));
      if (next) next.addEventListener('click', () => goTo(index + 1));
      viewport.addEventListener('keydown', event => {
        if (event.key === 'ArrowLeft') { event.preventDefault(); goTo(index - 1); }
        if (event.key === 'ArrowRight') { event.preventDefault(); goTo(index + 1); }
        if (event.key === 'Home') { event.preventDefault(); goTo(0); }
        if (event.key === 'End') { event.preventDefault(); goTo(slides.length - 1); }
      });
      window.addEventListener('resize', render, { passive: true });
      render();
    });
  }

  function initDataTables() {
    document.querySelectorAll('[data-data-table]').forEach(root => {
      if (!claim(root, 'data-table')) return;
      const table = root.querySelector('table');
      const body = table ? table.tBodies[0] : null;
      if (!table || !body) return;
      const rows = Array.from(body.rows);
      const search = root.querySelector('[data-table-search]');
      const previous = root.querySelector('[data-table-prev]');
      const next = root.querySelector('[data-table-next]');
      const pageNode = root.querySelector('[data-table-page]');
      const countNode = root.querySelector('[data-table-count]');
      const empty = root.querySelector('.drx-data-table-empty');
      const pageSize = Math.max(1, Number(root.getAttribute('data-page-size') || rows.length || 1));
      let query = '';
      let page = 0;
      let sortIndex = -1;
      let sortDirection = 1;

      const cellValue = (row, index) => {
        const cell = row.cells[index];
        return cell ? (cell.getAttribute('data-sort-value') || cell.textContent.trim()) : '';
      };
      const compare = (a, b) => {
        const first = cellValue(a, sortIndex);
        const second = cellValue(b, sortIndex);
        const firstNumber = Number(first.replace(/[^0-9.-]/g, ''));
        const secondNumber = Number(second.replace(/[^0-9.-]/g, ''));
        if (first !== '' && second !== '' && Number.isFinite(firstNumber) && Number.isFinite(secondNumber)) return (firstNumber - secondNumber) * sortDirection;
        return first.localeCompare(second, undefined, { numeric: true, sensitivity: 'base' }) * sortDirection;
      };
      const render = () => {
        const filtered = rows.filter(row => !query || row.textContent.toLocaleLowerCase().includes(query));
        if (sortIndex >= 0) filtered.sort(compare);
        filtered.forEach(row => body.appendChild(row));
        rows.filter(row => !filtered.includes(row)).forEach(row => body.appendChild(row));
        const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
        page = Math.max(0, Math.min(page, pages - 1));
        const start = page * pageSize;
        rows.forEach(row => { row.hidden = true; });
        filtered.slice(start, start + pageSize).forEach(row => { row.hidden = false; });
        if (previous) previous.disabled = page === 0;
        if (next) next.disabled = page >= pages - 1;
        if (pageNode) pageNode.textContent = `${page + 1} / ${pages}`;
        if (countNode) countNode.textContent = `${filtered.length} item${filtered.length === 1 ? '' : 's'}`;
        if (empty) empty.classList.toggle('is-visible', filtered.length === 0);
        table.hidden = filtered.length === 0;
        emit(root, 'table-change', { page, pages, count: filtered.length, query, sortIndex, sortDirection });
      };

      table.querySelectorAll('th[data-sort]').forEach(header => {
        header.tabIndex = 0;
        header.setAttribute('aria-sort', 'none');
        const sort = () => {
          const index = header.cellIndex;
          sortDirection = sortIndex === index ? sortDirection * -1 : 1;
          sortIndex = index;
          table.querySelectorAll('th[data-sort]').forEach(item => item.setAttribute('aria-sort', item === header ? (sortDirection === 1 ? 'ascending' : 'descending') : 'none'));
          page = 0;
          render();
        };
        header.addEventListener('click', sort);
        header.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); sort(); } });
      });
      if (search) search.addEventListener('input', () => { query = search.value.trim().toLocaleLowerCase(); page = 0; render(); });
      if (previous) previous.addEventListener('click', () => { page -= 1; render(); });
      if (next) next.addEventListener('click', () => { page += 1; render(); });
      render();
    });
  }

  function initCommands() {
    const openCommand = (root, trigger) => {
      if (!root) return;
      root._drxReturnFocus = trigger || document.activeElement;
      root.classList.add('drx-active');
      root.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      const input = root.querySelector('[data-command-input]');
      if (input) { input.focus(); input.select(); }
      emit(root, 'command-open');
    };
    const closeCommand = root => {
      if (!root) return;
      root.classList.remove('drx-active');
      root.setAttribute('aria-hidden', 'true');
      restoreBodyScroll();
      if (root._drxReturnFocus && document.contains(root._drxReturnFocus)) root._drxReturnFocus.focus();
      emit(root, 'command-close');
    };

    document.querySelectorAll('[data-command-open]').forEach(trigger => {
      if (!claim(trigger, 'command-open')) return;
      trigger.addEventListener('click', () => openCommand(resolveTarget(trigger, 'data-command-open'), trigger));
    });

    document.querySelectorAll('[data-command]').forEach(root => {
      if (!claim(root, 'command')) return;
      const input = root.querySelector('[data-command-input]');
      const items = Array.from(root.querySelectorAll('[data-command-item]'));
      const empty = root.querySelector('.drx-command-empty');
      let activeIndex = -1;
      root.setAttribute('aria-hidden', String(!root.classList.contains('drx-active')));

      const visible = () => items.filter(item => !item.hidden && item.getAttribute('aria-disabled') !== 'true');
      const setActive = index => {
        const candidates = visible();
        if (!candidates.length) { activeIndex = -1; return; }
        activeIndex = (index + candidates.length) % candidates.length;
        candidates.forEach((item, itemIndex) => item.classList.toggle('is-active', itemIndex === activeIndex));
        candidates[activeIndex].scrollIntoView({ block: 'nearest' });
      };
      const run = item => {
        const value = item.getAttribute('data-value') || item.textContent.trim();
        emit(root, 'command-select', { value, item });
        if (!item.hasAttribute('data-keep-open')) closeCommand(root);
      };
      const filter = () => {
        const query = input ? input.value.trim().toLocaleLowerCase() : '';
        let count = 0;
        items.forEach(item => {
          const match = !query || item.textContent.toLocaleLowerCase().includes(query) || (item.getAttribute('data-keywords') || '').toLocaleLowerCase().includes(query);
          item.hidden = !match;
          if (match) count += 1;
        });
        if (empty) empty.classList.toggle('is-visible', count === 0);
        activeIndex = -1;
      };
      if (input) {
        input.addEventListener('input', filter);
        input.addEventListener('keydown', event => {
          if (event.key === 'ArrowDown') { event.preventDefault(); setActive(activeIndex + 1); }
          else if (event.key === 'ArrowUp') { event.preventDefault(); setActive(activeIndex - 1); }
          else if (event.key === 'Enter' && activeIndex >= 0) { event.preventDefault(); run(visible()[activeIndex]); }
        });
      }
      items.forEach(item => item.addEventListener('click', () => run(item)));
      root.querySelectorAll('[data-command-close]').forEach(button => button.addEventListener('click', () => closeCommand(root)));
      root.addEventListener('pointerdown', event => { if (event.target === root) closeCommand(root); });
      filter();
    });

    if (claim(document.documentElement, 'command-keyboard')) {
      document.addEventListener('keydown', event => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === 'k') {
          const root = document.querySelector('[data-command]');
          if (root) { event.preventDefault(); root.classList.contains('drx-active') ? closeCommand(root) : openCommand(root); }
        } else if (event.key === 'Escape') {
          closeCommand(document.querySelector('[data-command].drx-active'));
        } else if (event.key === 'Tab') {
          const active = document.querySelector('[data-command].drx-active');
          if (!active) return;
          const focusable = Array.from(active.querySelectorAll(focusableSelector));
          if (!focusable.length) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
      });
    }
  }

  function initContextMenus() {
    const closeAll = () => document.querySelectorAll('.drx-context-menu.drx-active').forEach(menu => menu.classList.remove('drx-active'));
    document.querySelectorAll('[data-context-menu]').forEach(target => {
      if (target.classList.contains('drx-context-menu') || !claim(target, 'context-target')) return;
      const menu = resolveTarget(target, 'data-context-menu');
      if (!menu) return;
      if (!target.hasAttribute('tabindex')) target.tabIndex = 0;
      target.addEventListener('keydown', event => {
        if ((event.shiftKey && event.key === 'F10') || event.key === 'ContextMenu') {
          event.preventDefault();
          const rect = target.getBoundingClientRect();
          target.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: rect.left + 16, clientY: rect.top + 16 }));
        }
      });
      target.addEventListener('contextmenu', event => {
        event.preventDefault();
        closeAll();
        menu.classList.add('drx-active');
        menu.style.left = '0px';
        menu.style.top = '0px';
        const rect = menu.getBoundingClientRect();
        const left = Math.max(4, Math.min(event.clientX, window.innerWidth - rect.width - 4));
        const top = Math.max(4, Math.min(event.clientY, window.innerHeight - rect.height - 4));
        menu.style.left = `${left}px`;
        menu.style.top = `${top}px`;
        const first = menu.querySelector('.drx-menu-item:not([disabled])');
        if (first) first.focus({ preventScroll: true });
        emit(menu, 'context-open', { target, x: left, y: top });
      });
      const items = Array.from(menu.querySelectorAll('.drx-menu-item:not([disabled])'));
      items.forEach((item, index) => {
        if (!item.hasAttribute('tabindex')) item.tabIndex = -1;
        item.addEventListener('click', () => { emit(menu, 'context-select', { value: item.getAttribute('data-value') || item.textContent.trim(), item, target }); closeAll(); });
        item.addEventListener('keydown', event => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            items[(index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus();
          } else if (event.key === 'Home') { event.preventDefault(); items[0].focus(); }
          else if (event.key === 'End') { event.preventDefault(); items[items.length - 1].focus(); }
          else if (event.key === 'Escape') { event.preventDefault(); closeAll(); target.focus(); }
        });
      });
    });
    if (claim(document.documentElement, 'context-menu-global')) {
      document.addEventListener('pointerdown', event => { if (!event.target.closest('.drx-context-menu')) closeAll(); });
      document.addEventListener('keydown', event => { if (event.key === 'Escape') closeAll(); });
      window.addEventListener('blur', closeAll);
      window.addEventListener('resize', closeAll, { passive: true });
    }
  }

  function initMenubars() {
    document.querySelectorAll('[data-menubar]').forEach(root => {
      if (!claim(root, 'menubar')) return;
      const entries = Array.from(root.querySelectorAll(':scope > .drx-menubar-item'));
      const triggers = entries.map(entry => entry.querySelector('.drx-menubar-trigger')).filter(Boolean);
      const close = () => {
        entries.forEach(entry => entry.classList.remove('drx-active'));
        triggers.forEach(trigger => trigger.setAttribute('aria-expanded', 'false'));
      };
      const open = index => {
        close();
        const entry = entries[index];
        const trigger = triggers[index];
        if (!entry || !trigger) return;
        entry.classList.add('drx-active');
        trigger.setAttribute('aria-expanded', 'true');
      };

      root.setAttribute('role', 'menubar');
      triggers.forEach((trigger, index) => {
        trigger.setAttribute('role', 'menuitem');
        trigger.setAttribute('aria-haspopup', 'menu');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.addEventListener('click', () => entries[index].classList.contains('drx-active') ? close() : open(index));
        trigger.addEventListener('keydown', event => {
          if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault();
            const nextIndex = (index + (event.key === 'ArrowRight' ? 1 : -1) + triggers.length) % triggers.length;
            triggers[nextIndex].focus();
            if (entries.some(entry => entry.classList.contains('drx-active'))) open(nextIndex);
          } else if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            open(index);
            const first = entries[index].querySelector('.drx-menu-item:not([disabled])');
            if (first) first.focus();
          } else if (event.key === 'Escape') close();
        });
        const menuItems = Array.from(entries[index].querySelectorAll('.drx-menu-item:not([disabled])'));
        menuItems.forEach((item, itemIndex) => {
          item.tabIndex = -1;
          item.addEventListener('keydown', event => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault();
              menuItems[(itemIndex + (event.key === 'ArrowDown' ? 1 : -1) + menuItems.length) % menuItems.length].focus();
            } else if (event.key === 'Escape') { close(); trigger.focus(); }
          });
          item.addEventListener('click', close);
        });
      });
      document.addEventListener('pointerdown', event => { if (!root.contains(event.target)) close(); });
    });
  }

  function initResizable() {
    document.querySelectorAll('[data-resizable]').forEach(root => {
      if (!claim(root, 'resizable')) return;
      const handles = Array.from(root.querySelectorAll(':scope > .drx-resizable-handle'));
      const vertical = root.classList.contains('drx-resizable-vertical');
      handles.forEach(handle => {
        const before = handle.previousElementSibling;
        const after = handle.nextElementSibling;
        if (!before || !after) return;
        handle.tabIndex = 0;
        handle.setAttribute('role', 'separator');
        handle.setAttribute('aria-orientation', vertical ? 'horizontal' : 'vertical');
        const resizeTo = percent => {
          const minimum = Number(root.getAttribute('data-min') || 15);
          const maximum = Number(root.getAttribute('data-max') || 85);
          const value = Math.max(minimum, Math.min(maximum, percent));
          before.style.flex = `0 0 ${value}%`;
          after.style.flex = '1 1 auto';
          handle.setAttribute('aria-valuenow', String(Math.round(value)));
          emit(root, 'resize', { value, before, after });
        };
        handle.setAttribute('aria-valuemin', root.getAttribute('data-min') || '15');
        handle.setAttribute('aria-valuemax', root.getAttribute('data-max') || '85');
        handle.addEventListener('pointerdown', event => {
          event.preventDefault();
          root.classList.add('is-resizing');
          handle.setPointerCapture(event.pointerId);
        });
        handle.addEventListener('pointermove', event => {
          if (!handle.hasPointerCapture(event.pointerId)) return;
          const rect = root.getBoundingClientRect();
          resizeTo(vertical ? ((event.clientY - rect.top) / rect.height) * 100 : ((event.clientX - rect.left) / rect.width) * 100);
        });
        const stop = event => {
          if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
          root.classList.remove('is-resizing');
        };
        handle.addEventListener('pointerup', stop);
        handle.addEventListener('pointercancel', stop);
        handle.addEventListener('keydown', event => {
          const decrease = vertical ? event.key === 'ArrowUp' : event.key === 'ArrowLeft';
          const increase = vertical ? event.key === 'ArrowDown' : event.key === 'ArrowRight';
          if (!decrease && !increase) return;
          event.preventDefault();
          resizeTo(Number(handle.getAttribute('aria-valuenow') || 50) + (increase ? 5 : -5));
        });
        resizeTo(Number(root.getAttribute('data-default-size') || 50));
      });
    });
  }

  function initMessageScrollers() {
    document.querySelectorAll('[data-message-scroller]').forEach(root => {
      if (!claim(root, 'message-scroller')) return;
      const jump = root.querySelector('[data-message-jump]');
      const nearBottom = () => root.scrollHeight - root.scrollTop - root.clientHeight < 56;
      let following = true;
      const update = () => { following = nearBottom(); root.classList.toggle('has-unread', !following); };
      if (jump) jump.addEventListener('click', () => { following = true; root.scrollTo({ top: root.scrollHeight, behavior: 'smooth' }); root.classList.remove('has-unread'); });
      root.addEventListener('scroll', update, { passive: true });
      root.scrollTop = root.scrollHeight;
      const observer = new MutationObserver(() => {
        if (following) root.scrollTop = root.scrollHeight;
        else root.classList.add('has-unread');
      });
      observer.observe(root.querySelector('.drx-message-scroller-content') || root, { childList: true, subtree: true });
    });
  }

  function initCodeBlocks() {
    document.querySelectorAll('[data-code-block]').forEach(root => {
      if (!claim(root, 'code-block')) return;
      const code = root.querySelector('[data-code-source], pre code, code');
      if (!code) return;
      const source = code.textContent.replace(/^\n|\n\s*$/g, '');
      root._drxCodeSource = source;
      if (root.hasAttribute('data-line-numbers')) {
        code.replaceChildren();
        code.classList.add('drx-code-lines');
        source.split('\n').forEach(line => {
          const row = document.createElement('span');
          row.className = 'drx-code-line';
          row.textContent = line || ' ';
          code.appendChild(row);
        });
      }
      root.querySelectorAll('[data-code-copy]').forEach(button => {
        if (!claim(button, 'code-copy')) return;
        if (button.tagName === 'BUTTON') button.type = 'button';
        button.addEventListener('click', () => copyText(root._drxCodeSource).then(copied => {
          setCopyState(button, copied);
          emit(root, 'code-copy', { copied });
        }));
      });
    });
  }

  function jsonKind(value) {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }

  function createJsonNode(value, key, depth, openDepth) {
    const kind = jsonKind(value);
    if (kind === 'object' || kind === 'array') {
      const entries = kind === 'array' ? value.map((item, index) => [index, item]) : Object.entries(value);
      const details = document.createElement('details');
      details.className = 'drx-json-node';
      details.open = depth < openDepth;
      const summary = document.createElement('summary');
      if (key !== null) {
        const keyEl = document.createElement('span');
        keyEl.className = 'drx-json-key';
        keyEl.textContent = String(key);
        summary.append(keyEl, document.createTextNode(' '));
      }
      const typeEl = document.createElement('span');
      typeEl.textContent = kind === 'array' ? 'Array' : 'Object';
      const countEl = document.createElement('span');
      countEl.className = 'drx-json-count';
      countEl.textContent = `${entries.length} ${entries.length === 1 ? 'item' : 'items'}`;
      summary.append(typeEl, countEl);
      const children = document.createElement('div');
      children.className = 'drx-json-children';
      entries.forEach(([childKey, childValue]) => children.appendChild(createJsonNode(childValue, childKey, depth + 1, openDepth)));
      details.append(summary, children);
      return details;
    }

    const row = document.createElement('div');
    row.className = 'drx-json-row';
    if (key !== null) {
      const keyEl = document.createElement('span');
      keyEl.className = 'drx-json-key';
      keyEl.textContent = String(key);
      row.appendChild(keyEl);
    }
    const valueEl = document.createElement('span');
    valueEl.className = `drx-json-${kind}`;
    valueEl.textContent = kind === 'string' ? JSON.stringify(value) : String(value);
    row.appendChild(valueEl);
    return row;
  }

  function renderJsonView(view) {
    const root = typeof view === 'string' ? document.querySelector(view) : view;
    if (!root) return false;
    const sourceNode = root.querySelector('[data-json-source]');
    const source = sourceNode ? sourceNode.textContent : root.getAttribute('data-json');
    let output = root.querySelector('[data-json-output]');
    if (!output) {
      output = document.createElement('div');
      output.className = 'drx-json-body';
      output.setAttribute('data-json-output', '');
      root.appendChild(output);
    }
    try {
      const value = JSON.parse(source || 'null');
      root._drxJsonSource = source || 'null';
      root._drxJsonValue = value;
      output.className = 'drx-json-body';
      output.replaceChildren(createJsonNode(value, null, 0, Number(root.getAttribute('data-open-depth') || 2)));
      root.querySelectorAll('[data-json-copy]').forEach(button => { button.disabled = false; });
      emit(root, 'json-render', { value });
      return true;
    } catch (error) {
      root._drxJsonSource = source || '';
      root._drxJsonValue = undefined;
      const message = document.createElement('div');
      message.className = 'drx-json-error';
      message.setAttribute('role', 'alert');
      message.textContent = `Invalid JSON: ${error.message}`;
      output.className = '';
      output.replaceChildren(message);
      root.querySelectorAll('[data-json-copy]').forEach(button => { button.disabled = true; });
      emit(root, 'json-error', { message: error.message });
      return false;
    }
  }

  function initJsonViews() {
    document.querySelectorAll('[data-json-view]').forEach(root => {
      if (!claim(root, 'json-view')) return;
      renderJsonView(root);
      root.querySelectorAll('[data-json-copy]').forEach(button => {
        if (!claim(button, 'json-copy')) return;
        if (button.tagName === 'BUTTON') button.type = 'button';
        button.addEventListener('click', () => {
          const formatted = JSON.stringify(root._drxJsonValue, null, 2);
          copyText(formatted).then(copied => {
            setCopyState(button, copied);
            emit(root, 'json-copy', { copied });
          });
        });
      });
    });
  }

  function initQuestionnaires() {
    document.querySelectorAll('[data-questionnaire]').forEach(root => {
      if (!claim(root, 'questionnaire')) return;
      const questions = Array.from(root.querySelectorAll('[data-question]'));
      const previous = root.querySelector('[data-question-prev]');
      const next = root.querySelector('[data-question-next]');
      const skip = root.querySelector('[data-question-skip]');
      const step = root.querySelector('[data-question-step]');
      const progress = root.querySelector('[data-question-progress]');
      const restart = root.querySelector('[data-question-restart]');
      if (!questions.length) return;
      let index = Math.max(0, Math.min(questions.length - 1, Number(root.getAttribute('data-start') || 0)));
      const answers = {};
      root._drxAnswers = answers;

      const questionKey = question => question.getAttribute('data-question') || `question-${questions.indexOf(question) + 1}`;
      const inputsFor = question => Array.from(question.querySelectorAll('input, textarea, select'));
      const valueFor = question => {
        const inputs = inputsFor(question);
        const checkboxes = inputs.filter(input => input.type === 'checkbox');
        const radios = inputs.filter(input => input.type === 'radio');
        if (checkboxes.length) return checkboxes.filter(input => input.checked).map(input => input.value);
        if (radios.length) return (radios.find(input => input.checked) || {}).value || '';
        if (inputs.length === 1) return inputs[0].value.trim();
        return inputs.reduce((values, input) => { values[input.name || input.id] = input.value.trim(); return values; }, {});
      };
      const hasValue = value => Array.isArray(value) ? value.length > 0 : typeof value === 'object' ? Object.values(value).some(Boolean) : Boolean(value);
      const collect = question => {
        const value = valueFor(question);
        answers[questionKey(question)] = value;
        return value;
      };
      const validateQuestion = question => {
        const required = question.hasAttribute('data-required') || inputsFor(question).some(input => input.required);
        const value = collect(question);
        const valid = !required || hasValue(value);
        const error = question.querySelector('[data-question-error]');
        if (error) error.textContent = valid ? '' : (question.getAttribute('data-required-message') || 'Choose or enter an answer to continue.');
        question.setAttribute('aria-invalid', String(!valid));
        return valid;
      };
      const updateChoices = question => {
        question.querySelectorAll('.drx-question-choice').forEach(choice => {
          const input = choice.querySelector('input');
          choice.classList.toggle('is-selected', Boolean(input && input.checked));
        });
      };
      const render = () => {
        questions.forEach((question, questionIndex) => {
          const active = questionIndex === index;
          question.classList.toggle('is-active', active);
          question.setAttribute('aria-hidden', String(!active));
        });
        const current = questions[index];
        if (step) step.textContent = `${String(index + 1).padStart(2, '0')} / ${String(questions.length).padStart(2, '0')}`;
        if (progress) {
          const percent = ((index + 1) / questions.length) * 100;
          progress.style.setProperty('--drx-questionnaire-progress', `${percent}%`);
          progress.setAttribute('aria-valuenow', String(Math.round(percent)));
          progress.setAttribute('aria-valuemin', '0');
          progress.setAttribute('aria-valuemax', '100');
        }
        if (previous) previous.disabled = index === 0;
        if (skip) skip.hidden = !current.hasAttribute('data-skippable');
        if (next) next.textContent = index === questions.length - 1 ? (next.getAttribute('data-complete-label') || 'Complete') : (next.getAttribute('data-next-label') || 'Continue');
        requestAnimationFrame(() => {
          const target = current.querySelector('input:not([type="radio"]):not([type="checkbox"]), textarea, select, .drx-question-choice');
          if (target && root.getAttribute('data-autofocus') !== 'false') target.focus({ preventScroll: true });
        });
        emit(root, 'question-change', { index, question: current, key: questionKey(current), answers: { ...answers } });
      };
      const complete = () => {
        questions.forEach(collect);
        root.classList.add('is-complete');
        emit(root, 'questionnaire-complete', { answers: { ...answers } });
        const completePanel = root.querySelector('.drx-questionnaire-complete');
        if (completePanel) { completePanel.tabIndex = -1; completePanel.focus(); }
      };
      const goNext = () => {
        const current = questions[index];
        if (!validateQuestion(current)) return;
        if (index >= questions.length - 1) complete();
        else { index += 1; render(); }
      };

      questions.forEach(question => {
        inputsFor(question).forEach(input => {
          input.addEventListener('change', () => {
            updateChoices(question);
            collect(question);
            const error = question.querySelector('[data-question-error]');
            if (error) error.textContent = '';
            if (question.hasAttribute('data-auto-advance') && input.type === 'radio') setTimeout(goNext, 160);
          });
          input.addEventListener('input', () => collect(question));
        });
        question.querySelectorAll('.drx-question-choice').forEach((choice, choiceIndex) => {
          choice.tabIndex = 0;
          choice.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              const input = choice.querySelector('input');
              if (input) { input.click(); input.focus(); }
            } else if (/^[1-9]$/.test(event.key) && Number(event.key) - 1 === choiceIndex) {
              const input = choice.querySelector('input');
              if (input) input.click();
            }
          });
        });
        updateChoices(question);
      });
      if (previous) previous.addEventListener('click', () => { collect(questions[index]); if (index > 0) { index -= 1; render(); } });
      if (next) next.addEventListener('click', goNext);
      if (skip) skip.addEventListener('click', () => {
        answers[questionKey(questions[index])] = null;
        if (index >= questions.length - 1) complete();
        else { index += 1; render(); }
      });
      if (restart) restart.addEventListener('click', () => {
        Object.keys(answers).forEach(key => delete answers[key]);
        root.querySelectorAll('input').forEach(input => { if (input.type === 'checkbox' || input.type === 'radio') input.checked = false; else input.value = ''; });
        root.querySelectorAll('textarea, select').forEach(input => { input.value = ''; });
        questions.forEach(updateChoices);
        root.classList.remove('is-complete');
        index = 0;
        render();
      });
      render();
    });
  }

  function getQuestionnaireAnswers(questionnaire) {
    const root = typeof questionnaire === 'string' ? document.querySelector(questionnaire) : questionnaire;
    return root && root._drxAnswers ? { ...root._drxAnswers } : {};
  }

  function setDirection(direction = 'ltr', target = document.documentElement) {
    const value = direction === 'rtl' ? 'rtl' : 'ltr';
    target.setAttribute('dir', value);
    emit(target, 'direction-change', { direction: value });
    return value;
  }

  function validate(form, rules = {}) {
    const errors = {};
    Object.entries(rules).forEach(([name, validators]) => {
      const input = form.querySelector(`[name="${name}"]`);
      if (!input) return;
      const value = input.value.trim();
      for (const v of validators) {
        if (v.required && !value) { errors[name] = v.message || 'Required'; break; }
        if (v.minLength && value.length < v.minLength) { errors[name] = v.message || `Min ${v.minLength} chars`; break; }
        if (v.maxLength && value.length > v.maxLength) { errors[name] = v.message || `Max ${v.maxLength} chars`; break; }
        if (v.pattern && !v.pattern.test(value)) { errors[name] = v.message || 'Invalid format'; break; }
        if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) { errors[name] = v.message || 'Invalid email'; break; }
        if (v.custom && !v.custom(value)) { errors[name] = v.message || 'Invalid'; break; }
      }
    });
    form.querySelectorAll('.drx-input, .drx-textarea, .drx-select').forEach(input => {
      input.classList.remove('drx-input-error', 'drx-input-success');
      const msg = input.parentElement.querySelector('.drx-field-msg');
      if (msg) msg.remove();
    });
    Object.entries(errors).forEach(([name, message]) => {
      const input = form.querySelector(`[name="${name}"]`);
      if (input) {
        input.classList.add('drx-input-error');
        const msg = document.createElement('span');
        msg.className = 'drx-field-msg drx-field-msg-error';
        msg.textContent = message;
        input.parentElement.appendChild(msg);
      }
    });
    const valid = Object.keys(errors).length === 0;
    if (valid) {
      form.querySelectorAll('.drx-input, .drx-textarea, .drx-select').forEach(input => {
        if (input.value.trim()) input.classList.add('drx-input-success');
      });
    }
    return { valid, errors };
  }

  return {
    version,
    init,
    refresh,
    getDiagnostics,
    initPreloader,
    initTheme,
    initNavbar,
    initPageTransitions,
    initReveal,
    initHeroWords,
    initTabs,
    initAccordion,
    initModals,
    initDrawers,
    toast,
    initTooltips,
    initScrollSpy,
    initDropdowns,
    openDropdown,
    closeDropdown,
    closeAllDropdowns,
    initFileUpload,
    initCountUp,
    initScrollReveal,
    initCollapsibles,
    initToggles,
    initSliders,
    initOtp,
    initComboboxes,
    initSelects,
    initSheets,
    initHoverCards,
    initCalendars,
    initCarousels,
    initDataTables,
    initCommands,
    initContextMenus,
    initMenubars,
    initResizable,
    initMessageScrollers,
    initCodeBlocks,
    initJsonViews,
    renderJsonView,
    initQuestionnaires,
    getQuestionnaireAnswers,
    setDirection,
    validate
  };
})();
