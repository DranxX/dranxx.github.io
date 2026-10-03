(() => {
  const locale = document.documentElement.lang.toLowerCase().startsWith('id') ? 'id' : 'en';
  const isIndonesian = locale === 'id';
  const assetBase = '../assets';

  window.DRANXX_CONFIG = Object.freeze({
    locale,
    assetBase,
    siteName: 'DranxX',
    ownerName: 'Bramadya Fiqri Kurniawan Sinaga',
    titleSuffix: isIndonesian ? 'DranxX - Portofolio Developer' : 'DranxX - Developer Portfolio',
    email: 'dranxx.contact@gmail.com',
    tagline: isIndonesian
      ? '5 tahun mengerjakan proyek di bidang game development, software, AI/ML, dan keamanan.'
      : '5 years of projects across game development, software, AI/ML, and security.',
    // Nav labels stay the same in both locales: the mixed Resources/Proyek state read as unfinished.
    nav: [
      { key: 'home', label: 'Home', href: 'index.html' },
      { key: 'projects', label: 'Projects', href: 'projects.html' },
      { key: 'resources', label: 'Resources', href: 'resources.html' },
      { key: 'services', label: 'Services', href: 'services.html' },
      { key: 'profile', label: 'Profile', href: 'profile.html' }
    ],
    routes: Object.freeze({
      projectBentengan: 'Project_Bentengan.html',
      projects: 'projects.html',
      resources: 'resources.html'
    }),
    projectMedia: Object.freeze({
      bentengan: Object.freeze({
        logo: `${assetBase}/projects/bentengan/icon.webp`,
        card: `${assetBase}/projects/bentengan/card.webp`,
        banner: `${assetBase}/projects/bentengan/banner.webp`,
        iconNoBg: `${assetBase}/projects/bentengan/icon_nobg.webp`
      })
    }),
    projectLinks: Object.freeze({
      bentengan: Object.freeze({
        play: ''
      })
    }),
    resourceSources: Object.freeze({
      myRobloxAssets: Object.freeze({
        owner: 'DranxX',
        repository: 'MyRobloxAssets',
        repositoryUrl: 'https://github.com/DranxX/MyRobloxAssets',
        rawBase: 'https://raw.githubusercontent.com/DranxX/MyRobloxAssets',
        defaultRef: 'main'
      })
    }),
    resourceFallbackIcon: `${assetBase}/brands/roblox-studio.svg`,
    github: Object.freeze({
      user: 'DranxX',
      // The profile README and this site's own repo are not projects.
      ignore: Object.freeze(['DranxX', 'dranxx.github.io'])
    }),
    social: [
      { label: 'GitHub', href: 'https://github.com/DranxX' },
      { label: 'Discord', href: 'https://dsc.gg/dranxx' },
      { label: 'YouTube', href: 'https://youtube.com/@TheDranxX' },
      { label: 'Instagram', href: 'https://instagram.com/the_dranxx' },
      { label: 'TikTok', href: 'https://tiktok.com/@thedranxx' }
    ],
    ui: Object.freeze(isIndonesian ? {
      primaryNavigation: 'Navigasi utama',
      homeLabel: 'Beranda DranxX',
      contact: 'Kontak',
      navContact: 'Contact',
      toggleTheme: 'Ganti tema warna',
      toggleNavigation: 'Buka atau tutup navigasi',
      navigate: 'Navigasi',
      elsewhere: 'Links',
      backToTop: 'Kembali ke atas',
      languageLabel: 'Buka versi bahasa Inggris',
      languageCode: 'EN',
      alternateLocale: 'en'
    } : {
      primaryNavigation: 'Primary navigation',
      homeLabel: 'DranxX home',
      contact: 'Contact',
      navContact: 'Contact',
      toggleTheme: 'Toggle color theme',
      toggleNavigation: 'Toggle navigation',
      navigate: 'Navigate',
      elsewhere: 'Links',
      backToTop: 'Back to top',
      languageLabel: 'Buka versi bahasa Indonesia',
      languageCode: 'ID',
      alternateLocale: 'id'
    })
  });
})();
