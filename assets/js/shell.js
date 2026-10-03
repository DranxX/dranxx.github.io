(() => {
  const config = window.DRANXX_CONFIG;
  const ui = config.ui;

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

  const createBrand = className => {
    const brand = create('span', className);
    brand.append('Dra');
    brand.append(create('em', '', 'nxX'));
    return brand;
  };

  const createLink = (label, href, className = '') => {
    const link = create('a', className, label);
    link.href = href;
    if (/^https?:/i.test(href)) {
      link.target = '_blank';
      link.rel = 'noreferrer noopener';
    }
    return link;
  };

  class SiteHeader extends HTMLElement {
    connectedCallback() {
      const currentPage = document.body.dataset.page || 'home';
      const nav = setAttributes(create('nav', 'site-nav drx-navbar'), {
        id: 'siteNav',
        'aria-label': ui.primaryNavigation
      });

      const logo = setAttributes(create('a', 'nav-logo drx-navbar-logo'), {
        href: 'index.html',
        'aria-label': ui.homeLabel
      });
      logo.append(createBrand(''));

      const navRight = create('div', 'nav-right drx-navbar-right');
      const navLinks = setAttributes(create('ul', 'nav-links drx-navbar-links'), { id: 'primaryNavLinks' });

      config.nav.forEach(item => {
        const listItem = create('li');
        const link = createLink(item.label, item.href);
        if (item.key === currentPage) {
          link.classList.add('active');
          link.setAttribute('aria-current', 'page');
        }
        listItem.append(link);
        navLinks.append(listItem);
      });

      const mobileContact = create('li', 'mobile-only drx-mobile-only');
      mobileContact.append(createLink(ui.navContact || 'Contact', 'contact.html', 'drx-navbar-cta-mobile'));
      navLinks.append(mobileContact);

      const contact = createLink(ui.navContact || 'Contact', 'contact.html', 'drx-btn drx-btn-solid-primary portfolio-cta drx-navbar-cta');
      if (currentPage === 'contact') contact.setAttribute('aria-current', 'page');

      const routeTail = window.location.pathname.endsWith('/')
        ? 'index.html'
        : window.location.pathname.split('/').filter(Boolean).at(-1) || 'index.html';
      const currentFile = routeTail.includes('.') ? routeTail : `${routeTail}.html`;
      const knownPages = new Set(['index.html', 'projects.html', 'Project_Bentengan.html', 'services.html', 'profile.html', 'contact.html', 'platform.html', 'products.html', 'resources.html', 'partners.html', '404.html']);
      const alternateFile = knownPages.has(currentFile) ? currentFile : 'index.html';
      const alternateHref = `../${ui.alternateLocale}/${alternateFile}${window.location.search}${window.location.hash}`;
      const languageSwitch = setAttributes(createLink(ui.languageCode, alternateHref, 'language-switch'), {
        'aria-label': ui.languageLabel,
        lang: ui.alternateLocale
      });

      const themeToggle = setAttributes(create('button', 'theme-toggle drx-theme-toggle'), {
        type: 'button',
        'aria-label': ui.toggleTheme,
        'aria-pressed': 'false'
      });
      themeToggle.append(setAttributes(create('i', 'bi bi-moon'), { 'aria-hidden': 'true' }));

      const menuToggle = setAttributes(create('button', 'nav-toggle drx-navbar-toggle'), {
        type: 'button',
        'aria-label': ui.toggleNavigation,
        'aria-expanded': 'false',
        'aria-controls': 'primaryNavLinks'
      });
      for (let index = 0; index < 3; index += 1) menuToggle.append(create('span'));

      navRight.append(navLinks, contact, languageSwitch, themeToggle, menuToggle);
      nav.append(logo, navRight);
      this.replaceChildren(nav);
    }
  }

  class SiteFooter extends HTMLElement {
    connectedCallback() {
      this.id = 'site-footer';
      const footer = create('footer', 'site-footer drx-footer');
      const wrap = create('div', 'wrap');
      const grid = create('div', 'footer-grid');

      const about = create('div', 'footer-about');
      about.append(createBrand('footer-brand'));
      about.append(create('p', 'footer-description', config.tagline));

      const navigate = create('div', 'footer-column');
      navigate.append(create('h2', '', ui.navigate));
      const navList = create('ul');
      config.nav.forEach(item => {
        const listItem = create('li');
        listItem.append(createLink(item.label, item.href));
        navList.append(listItem);
      });
      const contactItem = create('li');
      contactItem.append(createLink(ui.contact, 'contact.html'));
      navList.append(contactItem);
      navigate.append(navList);

      const elsewhere = create('div', 'footer-column');
      elsewhere.append(create('h2', '', ui.elsewhere));
      const socialList = create('ul');
      config.social.forEach(item => {
        const listItem = create('li');
        listItem.append(createLink(item.label, item.href));
        socialList.append(listItem);
      });
      elsewhere.append(socialList);

      const contact = create('div', 'footer-column footer-contact');
      contact.append(create('h2', '', ui.contact));
      const contactList = create('ul');
      const emailItem = create('li');
      emailItem.append(createLink(ui.sendMessage, `mailto:${config.email}`));
      contactList.append(emailItem);
      contact.append(contactList);

      grid.append(about, navigate, elsewhere, contact);

      const bottom = create('div', 'footer-bottom');
      const copyright = create('span');
      copyright.append(`© ${new Date().getFullYear()} `, create('em', '', 'DranxX'), `. ${ui.portfolio}`);
      bottom.append(copyright);

      wrap.append(grid, bottom);
      footer.append(wrap);
      this.replaceChildren(footer);
    }
  }

  class SiteUi extends HTMLElement {
    connectedCallback() {
      const grain = setAttributes(create('div', 'site-grain'), {
        'aria-hidden': 'true'
      });

      const progress = setAttributes(create('div', 'scroll-progress'), {
        id: 'scrollProgress',
        'aria-hidden': 'true'
      });
      const cursorLight = setAttributes(create('div', 'cursor-light'), {
        id: 'cursorLight',
        'aria-hidden': 'true'
      });
      const cursorDot = setAttributes(create('div', 'cursor-dot'), {
        id: 'cursorDot',
        'aria-hidden': 'true'
      });
      const backToTop = setAttributes(create('button', 'back-to-top'), {
        id: 'backToTop',
        type: 'button',
        'aria-label': ui.backToTop
      });
      backToTop.append(setAttributes(create('i', 'bi bi-arrow-up'), { 'aria-hidden': 'true' }));
      this.replaceChildren(grain, progress, cursorLight, cursorDot, backToTop);
    }
  }

  if (!customElements.get('site-header')) customElements.define('site-header', SiteHeader);
  if (!customElements.get('site-footer')) customElements.define('site-footer', SiteFooter);
  if (!customElements.get('site-ui')) customElements.define('site-ui', SiteUi);
})();
