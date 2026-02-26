(() => {
  const preloader = document.getElementById('preloader');

  const hidePreloader = () => {
    if (!preloader) return;
    setTimeout(() => {
      preloader.classList.add('fade-out');
      setTimeout(() => {
        document.body.classList.remove('loading');
        document.body.classList.remove('page-transitioning');
      }, 600);
    }, 300);
  };

  if (document.readyState === 'complete') hidePreloader();
  else window.addEventListener('load', hidePreloader);

  const nav = document.getElementById('nav');
  const navLinks = document.querySelectorAll('.nav-links a:not(.nav-cta)');
  const sections = document.querySelectorAll('section[id]');
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-links');
  const themeToggle = document.querySelector('.theme-toggle');
  const currentTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.classList.toggle('light', currentTheme === 'light');
  const themeIcon = document.querySelector('.theme-toggle i');
  if (themeIcon) {
    themeIcon.className = currentTheme === 'dark' ? 'bi bi-moon' : 'bi bi-sun';
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isLight = document.documentElement.classList.toggle('light');
      const newTheme = isLight ? 'light' : 'dark';
      localStorage.setItem('theme', newTheme);
      const themeIcon = document.querySelector('.theme-toggle i');
      if (themeIcon) {
        themeIcon.className = newTheme === 'dark' ? 'bi bi-moon' : 'bi bi-sun';
      }
    });
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      navToggle.classList.toggle('open');
    });
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        navToggle.classList.remove('open');
      });
    });
  }
  document.querySelectorAll('a[href]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      const currentURL = window.location.pathname.split('/').pop() || 'index';
      if (href.startsWith('#')) return;
      if (href === currentURL || href === `${currentURL}.html` || (href === 'index' && currentURL === '')) return;
      if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

      e.preventDefault();

      if (preloader) preloader.classList.remove('fade-out');
      document.body.classList.add('page-transitioning');

      setTimeout(() => {
        window.location.href = href;
      }, 600);
    });
  });

  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      if (preloader) preloader.classList.add('fade-out');
      document.body.classList.remove('loading');
      document.body.classList.remove('page-transitioning');
    }
  });

  window.addEventListener('scroll', () => {
    if (!nav) return;
    nav.classList.toggle('scrolled', window.scrollY > 40);

    let current = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 80) current = s.id;
    });

    navLinks.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === `#${current}`);
    });
  }, { passive: true });

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  document.querySelectorAll('.h1-word').forEach(el => io.observe(el));

  const heroTag = document.querySelector('.hero-tag');
  if (heroTag) setTimeout(() => heroTag.classList.add('visible'), 100);

  document.querySelectorAll('.h1-word').forEach((el, i) => {
    setTimeout(() => el.classList.add('visible'), 150 + i * 80);
  });
})();


