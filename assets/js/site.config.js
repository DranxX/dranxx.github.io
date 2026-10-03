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
      ? 'Membangun game dan tools selama 5 tahun, sekarang paling banyak di Roblox.'
      : 'Building games and tools for 5 years, now mostly on Roblox.',
    // Nav labels stay the same in both locales: the mixed Resources/Proyek state read as unfinished.
    nav: [
      { key: 'home', label: 'Home', href: './' },
      { key: 'projects', label: 'Projects', href: 'projects' },
      { key: 'resources', label: 'Resources', href: 'resources' },
      { key: 'services', label: 'Services', href: 'services' },
      { key: 'profile', label: 'Profile', href: 'profile' }
    ],
    routes: Object.freeze({
      projectBentengan: 'Project_Bentengan',
      projects: 'projects',
      resources: 'resources'
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
      homeLabel: 'Home DranxX',
      contact: 'Contact',
      navContact: 'Contact',
      toggleTheme: 'Ganti tema warna',
      toggleNavigation: 'Buka atau tutup navigasi',
      navigate: 'Navigate',
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
