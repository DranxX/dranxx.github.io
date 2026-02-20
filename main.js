(() => {
  const nav = document.getElementById('nav');
  const navLinks = document.querySelectorAll('.nav-links a:not(.nav-cta)');
  const sections = document.querySelectorAll('section[id]');
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-links');
  const themeToggle = document.querySelector('.theme-toggle');

  // Theme toggle
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

  // Page transition on link click
  document.querySelectorAll('a[href]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href.startsWith('#') || href.includes('#')) return; // Skip anchor links
      e.preventDefault();
      document.body.style.opacity = '0';
      setTimeout(() => {
        window.location.href = href;
      }, 300);
    });
  });

  window.addEventListener('scroll', () => {
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
  }, { threshold: 0.08, rootMargin: '0px 0px -48px 0px' });

  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  document.querySelectorAll('.h1-word').forEach(el => io.observe(el));

  const heroTag = document.querySelector('.hero-tag');
  if (heroTag) {
    setTimeout(() => heroTag.classList.add('visible'), 100);
  }

  document.querySelectorAll('.h1-word').forEach((el, i) => {
    setTimeout(() => el.classList.add('visible'), 200 + i * 90);
  });
})();