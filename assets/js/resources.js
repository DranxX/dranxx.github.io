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

  const normalizeFilterText = value => String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9+#.]+/g, ' ').trim();

  class ResourceCatalog {
    constructor(root, data, config) {
      this.root = root;
      this.data = data;
      this.config = config;
      this.isIndonesian = config.locale === 'id';
      this.items = data.items.filter(item => item.published && this.getCurrentVersion(item));
      this.activeCategory = 'all';
      this.activeQuery = '';
      this.modal = null;
      this.copy = this.isIndonesian ? {
        resources: 'resource',
        result: count => `${count} resource tersedia`,
        resultSingle: '1 resource tersedia',
        download: version => `Download ${version}`,
        downloadLabel: (name, version) => `Download ${name}, versi ${version}`,
        details: 'Lihat detail',
        detailsLabel: name => `Lihat detail ${name}`,
        close: 'Tutup detail resource',
        currentVersion: 'Versi stabil',
        fileFormat: 'Format file',
        updated: 'Diperbarui',
        overview: 'Tentang resource',
        installation: 'Cara pasang',
        versions: 'Riwayat versi',
        source: 'Lihat source code',
        sourceLabel: name => `Lihat source code ${name} di GitHub`,
        terms: 'Ketentuan penggunaan',
        empty: 'Tidak ada resource yang cocok. Coba kata kunci atau kategori lain.',
        emptyCategory: 'Tidak ada resource pada kategori ini.',
        stable: 'Stable',
        searchLabel: 'Cari resource',
        searchPlaceholder: 'Nama atau fungsi. Misalnya: chat',
        categoryLabel: 'Kategori',
        clear: 'Reset'
      } : {
        resources: 'resources',
        result: count => `${count} resource${count === 1 ? '' : 's'} available`,
        download: version => `Download ${version}`,
        downloadLabel: (name, version) => `Download ${name}, version ${version}`,
        details: 'View details',
        detailsLabel: name => `View ${name} details`,
        close: 'Close resource details',
        currentVersion: 'Stable version',
        fileFormat: 'File format',
        updated: 'Updated',
        overview: 'About this resource',
        installation: 'Installation',
        versions: 'Version history',
        source: 'View source',
        sourceLabel: name => `View ${name} source on GitHub`,
        terms: 'Usage terms',
        empty: 'No matching resource. Try another keyword or category.',
        emptyCategory: 'No resources in this category.',
        stable: 'Stable',
        searchLabel: 'Find a resource',
        searchPlaceholder: 'Name or function. Try: chat',
        categoryLabel: 'Category',
        clear: 'Reset'
      };
    }

    getCurrentVersion(resource) {
      const versions = (resource.versions || []).filter(version => version.published && version.channel === 'stable');
      return versions.find(version => version.id === resource.latestVersionId) || versions[0] || null;
    }

    getSource(resource) {
      return this.config.resourceSources?.[resource.sourceId] || null;
    }

    getFormat(resource) {
      const extension = /\.[^./]+$/.exec(resource.fileName || '');
      return extension ? extension[0].toLowerCase() : '-';
    }

    encodePath(value) {
      return String(value).split('/').map(part => encodeURIComponent(part)).join('/');
    }

    getDownloadUrl(resource, version) {
      const source = this.getSource(resource);
      if (!source || !version) return '';
      const ref = version.ref || source.defaultRef;
      return `${source.rawBase}/${this.encodePath(ref)}/${this.encodePath(resource.sourcePath)}`;
    }

    getSourceUrl(resource, version) {
      const source = this.getSource(resource);
      if (!source) return '';
      const ref = version?.ref || source.defaultRef;
      return `${source.repositoryUrl}/blob/${this.encodePath(ref)}/${this.encodePath(resource.sourcePath)}`;
    }

    formatDate(value) {
      if (!value) return '-';
      const date = new Date(`${value}T00:00:00Z`);
      if (Number.isNaN(date.getTime())) return value;
      return new Intl.DateTimeFormat(this.config.locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date);
    }

    createTags(values) {
      const list = create('div', 'tag-list');
      values.forEach(value => list.append(create('span', 'tag drx-badge drx-badge-outline', value)));
      return list;
    }

    createIcon(resource) {
      const mark = setAttributes(create('span', 'resource-mark media-pending'), { 'aria-hidden': 'true', 'aria-busy': 'true' });
      const fallback = create('span', 'resource-mark-fallback', resource.mark || resource.name.slice(0, 3).toUpperCase());
      const image = setAttributes(create('img'), {
        alt: '',
        width: '44',
        height: '44',
        loading: 'lazy',
        decoding: 'async'
      });
      const finishIcon = () => {
        mark.classList.remove('media-pending');
        mark.setAttribute('aria-busy', 'false');
      };
      const markLoaded = () => {
        finishIcon();
        mark.classList.add('has-icon');
      };
      image.addEventListener('load', markLoaded, { once: true });
      image.addEventListener('error', () => {
        finishIcon();
        image.remove();
      }, { once: true });
      const iconUrl = resource.icon || this.getSource(resource)?.icon;
      if (!iconUrl) {
        finishIcon();
        mark.append(fallback);
        return mark;
      }
      image.src = iconUrl;
      mark.append(fallback, image);
      if (image.complete && image.naturalWidth > 0) markLoaded();
      return mark;
    }

    createDownloadLink(resource, version, className) {
      const link = setAttributes(create('a', className), {
        href: this.getDownloadUrl(resource, version),
        download: resource.fileName,
        'aria-label': this.copy.downloadLabel(resource.name, version.version)
      });
      link.append(this.copy.download(version.version), setAttributes(create('i', 'bi bi-download'), { 'aria-hidden': 'true' }));
      return link;
    }

    createCard(resource) {
      const version = this.getCurrentVersion(resource);
      const article = setAttributes(create('article', 'resource-card drx-card drx-reveal'), {
        id: resource.id,
        'data-resource-category': resource.category
      });
      article.setAttribute('data-resource-card', '');
      article.dataset.resourceSearch = normalizeFilterText([resource.name, resource.categoryLabel, resource.description, resource.detail, ...(resource.tags || [])].join(' '));

      const head = create('div', 'resource-card-head');
      const identity = create('div', 'resource-card-identity');
      identity.append(this.createIcon(resource), create('span', 'resource-category', resource.categoryLabel));
      head.append(identity, create('span', 'resource-channel', this.copy.stable));

      const title = create('h2', 'resource-title', resource.name);
      const meta = create('dl', 'resource-meta');
      const versionGroup = create('div');
      versionGroup.append(create('dt', '', this.copy.currentVersion), create('dd', '', version.version));
      const formatGroup = create('div');
      formatGroup.append(create('dt', '', this.copy.fileFormat), create('dd', '', this.getFormat(resource)));
      meta.append(versionGroup, formatGroup);

      const actions = create('div', 'resource-actions');
      const details = setAttributes(create('button', 'drx-btn drx-btn-ghost resource-details', this.copy.details), {
        type: 'button',
        'data-resource-details': resource.id,
        'data-modal-open': '#resourceDetailModal',
        'aria-label': this.copy.detailsLabel(resource.name)
      });
      actions.append(this.createDownloadLink(resource, version, 'drx-btn drx-btn-solid-primary'), details);

      article.append(head, title, create('p', 'resource-description', resource.description), this.createTags(resource.tags), meta, actions);
      details.addEventListener('click', () => this.showDetails(resource, true));
      return article;
    }

    createFilters() {
      const filters = setAttributes(create('div', 'catalog-filters'), {
        role: 'group',
        'aria-label': this.isIndonesian ? 'Filter kategori resource' : 'Filter resource categories'
      });
      this.data.categories.forEach(category => {
        const button = setAttributes(create('button', 'catalog-filter resource-filter'), {
          type: 'button',
          'data-resource-filter': category.id,
          'aria-pressed': String(category.id === 'all')
        });
        button.textContent = category.label;
        button.addEventListener('click', () => {
          const input = this.root.querySelector('[data-resource-search]');
          this.activeQuery = normalizeFilterText(input?.value || '');
          this.setCategory(category.id);
        });
        filters.append(button);
      });
      return filters;
    }

    applyFilters() {
      const tokens = this.activeQuery.split(' ').filter(Boolean);
      let visible = 0;
      this.root.querySelectorAll('[data-resource-card]').forEach(card => {
        const categoryMatch = this.activeCategory === 'all' || card.dataset.resourceCategory === this.activeCategory;
        const haystack = card.dataset.resourceSearch || '';
        const queryMatch = !tokens.length || tokens.every(token => haystack.includes(token));
        const matches = categoryMatch && queryMatch;
        card.hidden = !matches;
        if (matches) visible += 1;
      });
      this.root.querySelectorAll('[data-resource-filter]').forEach(button => {
        button.setAttribute('aria-pressed', String(button.dataset.resourceFilter === this.activeCategory));
      });
      const count = this.root.querySelector('[data-resource-count]');
      const empty = this.root.querySelector('[data-resource-empty]');
      const clear = this.root.querySelector('[data-resource-clear]');
      if (count) count.textContent = this.copy.result(visible);
      if (empty) {
        empty.hidden = visible !== 0;
        empty.textContent = tokens.length ? this.copy.empty : this.copy.emptyCategory;
      }
      const hasActive = this.activeCategory !== 'all' || tokens.length > 0;
      if (clear) clear.disabled = !hasActive;
    }

    setCategory(category) {
      this.activeCategory = category;
      this.applyFilters();
    }

    createModal() {
      const overlay = setAttributes(create('div', 'drx-modal-overlay resource-modal-overlay'), {
        id: 'resourceDetailModal',
        'aria-hidden': 'true',
        'data-resource-modal': ''
      });
      const dialog = setAttributes(create('section', 'drx-modal resource-modal'), {
        'aria-labelledby': 'resourceModalTitle',
        'aria-describedby': 'resourceModalDescription'
      });
      const header = create('header', 'drx-modal-header resource-modal-header');
      const heading = create('div');
      heading.append(create('span', 'section-label', this.copy.resources), create('h2', 'drx-modal-title', 'Resource'));
      heading.querySelector('h2').id = 'resourceModalTitle';
      const close = setAttributes(create('button', 'drx-modal-close'), {
        type: 'button',
        'data-modal-close': '',
        'aria-label': this.copy.close
      });
      close.append(setAttributes(create('i', 'bi bi-x-lg'), { 'aria-hidden': 'true' }));
      header.append(heading, close);

      const body = setAttributes(create('div', 'drx-modal-body resource-modal-body'), { 'data-resource-modal-body': '' });
      const footer = setAttributes(create('footer', 'drx-modal-footer resource-modal-footer'), { 'data-resource-modal-footer': '' });
      dialog.append(header, body, footer);
      overlay.append(dialog);
      overlay.addEventListener('drx:modal-close', () => this.clearHash());
      return overlay;
    }

    showDetails(resource, updateHash) {
      const version = this.getCurrentVersion(resource);
      const title = this.modal.querySelector('#resourceModalTitle');
      const body = this.modal.querySelector('[data-resource-modal-body]');
      const footer = this.modal.querySelector('[data-resource-modal-footer]');
      title.textContent = resource.name;

      const intro = create('div', 'resource-modal-intro');
      const description = setAttributes(create('p', 'resource-modal-description', resource.detail), { id: 'resourceModalDescription' });
      intro.append(this.createIcon(resource), description);

      const meta = create('dl', 'resource-modal-meta');
      [
        [this.copy.currentVersion, version.version],
        [this.copy.updated, this.formatDate(version.releasedAt)],
        [this.copy.fileFormat, this.getFormat(resource)]
      ].forEach(([term, value]) => {
        const group = create('div');
        group.append(create('dt', '', term), create('dd', '', value));
        meta.append(group);
      });

      let install = null;
      if (resource.installation?.length) {
        install = create('section', 'resource-modal-section');
        install.append(create('h3', '', this.copy.installation));
        const steps = create('ol', 'resource-install-steps');
        resource.installation.forEach(step => steps.append(create('li', '', step)));
        install.append(steps);
      }

      const versionHistory = create('section', 'resource-modal-section');
      versionHistory.append(create('h3', '', this.copy.versions));
      const versionList = create('div', 'resource-version-list');
      resource.versions.filter(item => item.published && item.channel === 'stable').forEach(item => {
        const row = create('article', 'resource-version');
        const info = create('div');
        info.append(create('strong', '', item.version), create('span', '', this.formatDate(item.releasedAt)), create('p', '', item.note));
        row.append(info, this.createDownloadLink(resource, item, 'text-link'));
        versionList.append(row);
      });
      versionHistory.append(versionList);

      let terms = null;
      if (resource.terms) {
        terms = create('aside', 'resource-terms');
        terms.append(create('h3', '', this.copy.terms), create('p', '', resource.terms));
      }
      body.replaceChildren(...[intro, meta, install, versionHistory, terms].filter(Boolean));

      const source = setAttributes(create('a', 'drx-btn drx-btn-outline', this.copy.source), {
        href: this.getSourceUrl(resource, version),
        target: '_blank',
        rel: 'noreferrer noopener',
        'aria-label': this.copy.sourceLabel(resource.name)
      });
      const sourceMark = setAttributes(create('span', 'brand-mark'), { 'aria-hidden': 'true' });
      for (const theme of ['light', 'dark']) {
        sourceMark.append(setAttributes(create('img', `brand-logo brand-logo-${theme}`), {
          src: `${this.config.assetBase}/brands/github${theme === 'dark' ? '-dark' : ''}.svg`,
          alt: '', width: '20', height: '20'
        }));
      }
      source.append(sourceMark);
      footer.replaceChildren(source, this.createDownloadLink(resource, version, 'drx-btn drx-btn-solid-primary'));

      if (updateHash && window.location.hash !== `#${resource.id}`) window.history.pushState({ resource: resource.id }, '', `#${resource.id}`);
    }

    clearHash() {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!this.items.some(item => item.id === id)) return;
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    }

    openFromHash() {
      const id = decodeURIComponent(window.location.hash.slice(1));
      const resource = this.items.find(item => item.id === id);
      if (!resource) return;
      const button = this.root.querySelector(`[data-resource-details="${CSS.escape(resource.id)}"]`);
      if (button && !this.modal.classList.contains('drx-active')) button.click();
    }

    mount() {
      const filtersRoot = this.root.querySelector('[data-resource-filters]');
      const list = this.root.querySelector('[data-resource-list]');
      const modalRoot = this.root.querySelector('[data-resource-modal-root]');
      const searchInput = this.root.querySelector('[data-resource-search]');
      const clearButton = this.root.querySelector('[data-resource-clear]');
      if (!list || !modalRoot) return;

      if (filtersRoot) filtersRoot.replaceChildren(this.createFilters());
      const fragment = document.createDocumentFragment();
      this.items.forEach(resource => fragment.append(this.createCard(resource)));
      list.replaceChildren(fragment);
      this.modal = this.createModal();
      modalRoot.replaceChildren(this.modal);

      if (searchInput) {
        searchInput.setAttribute('aria-label', this.copy.searchLabel);
        searchInput.placeholder = this.copy.searchPlaceholder;
        let timer = 0;
        searchInput.addEventListener('input', () => {
          window.clearTimeout(timer);
          timer = window.setTimeout(() => {
            this.activeQuery = normalizeFilterText(searchInput.value);
            this.applyFilters();
          }, 120);
        });
      }
      if (clearButton) {
        clearButton.textContent = this.copy.clear;
        clearButton.addEventListener('click', () => {
          this.activeCategory = 'all';
          this.activeQuery = '';
          if (searchInput) searchInput.value = '';
          this.applyFilters();
          searchInput?.focus();
        });
      }

      this.applyFilters();

      window.addEventListener('load', () => this.openFromHash(), { once: true });
      window.addEventListener('popstate', () => {
        const id = decodeURIComponent(window.location.hash.slice(1));
        if (this.items.some(item => item.id === id)) this.openFromHash();
        else if (this.modal.classList.contains('drx-active')) this.modal.querySelector('[data-modal-close]')?.click();
      });

    }
  }

  document.querySelectorAll('[data-resource-catalog]').forEach(root => {
    if (!window.DRANXX_RESOURCES || !window.DRANXX_CONFIG) return;
    new ResourceCatalog(root, window.DRANXX_RESOURCES, window.DRANXX_CONFIG).mount();
  });
})();
