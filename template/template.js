(() => {
  const nav = document.getElementById('nav');
  const navLinks = document.querySelectorAll('.nav-links a:not(.nav-cta)');
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', () => {
    nav.style.background = window.scrollY > 40
      ? 'rgba(8,8,16,0.98)'
      : 'rgba(8,8,16,0.9)';

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