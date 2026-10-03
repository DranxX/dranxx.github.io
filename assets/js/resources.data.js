(() => {
  const isIndonesian = window.DRANXX_CONFIG?.locale === 'id';
  const t = (english, indonesian) => isIndonesian ? indonesian : english;
  const stableRef = 'dd788cef25dc74e1971e251fd028f6479673dd55';

  const currentVersion = (releasedAt, note) => ({
    id: 'current',
    version: `Stable ${stableRef.slice(0, 7)}`,
    channel: 'stable',
    ref: stableRef,
    releasedAt,
    note,
    published: true
  });

  // Shared by every MyRobloxAssets package: RBXM setup steps, usage terms, and card mark.
  const robloxPackage = {
    sourceId: 'myRobloxAssets',
    mark: 'RBLX',
    installation: t(
      ['Download the RBXM file.', 'Open Roblox Studio and choose Insert from File in Explorer.', 'Move the included instances into the appropriate services.', 'Review configuration and scripts before using the package in a live game.'],
      ['Download file RBXM.', 'Buka Roblox Studio, lalu pilih Insert from File di Explorer.', 'Pindahkan instance ke service yang sesuai.', 'Periksa pengaturan dan script sebelum digunakan dalam game yang sudah dirilis.']
    ),
    terms: t(
      'Free for personal and commercial projects. You may modify the package, but must credit @TheDranxX. Do not resell it as your own work.',
      'Gratis untuk proyek pribadi maupun komersial dan boleh dimodifikasi. Cantumkan kredit @TheDranxX. Paket ini tidak boleh dijual ulang sebagai aset buatanmu sendiri.'
    )
  };

  window.DRANXX_RESOURCES = Object.freeze({
    categories: [
      { id: 'all', label: 'All resources' },
      { id: 'systems', label: 'Systems' },
      { id: 'tools', label: 'Tools' },
      { id: 'utilities', label: 'Utilities' }
    ],
    items: [
      {
        id: 'adjustable-coil',
        name: 'Adjustable Coil',
        category: 'tools',
        categoryLabel: t('Roblox tool', 'Tool Roblox'),
        description: t('A coil model with configurable settings, ready to import into Roblox Studio.', 'Model coil dengan pengaturan yang bisa disesuaikan, siap diimpor ke Roblox Studio.'),
        detail: t('Start with the included model and scripts, then adjust the coil settings for your game.', 'Gunakan model dan script yang tersedia, lalu sesuaikan pengaturan coil dengan kebutuhan game kamu.'),
        tags: ['Roblox Studio', 'RBXM', 'Tool'],
        ...robloxPackage,
        sourcePath: 'AdjustableCoilByTheDranxX.rbxm',
        fileName: 'AdjustableCoilByTheDranxX.rbxm',
        icon: null,
        published: true,
        latestVersionId: 'current',
        versions: [currentVersion('2026-01-23', t('Public build from the repository.', 'Build publik dari repositori.'))]
      },
      {
        id: 'blind-box',
        name: 'Blind Box',
        category: 'systems',
        categoryLabel: t('Reward system', 'Sistem reward'),
        description: t('A compact blind-box system to study and adapt in Roblox Studio.', 'Sistem blind box ringkas untuk dipelajari dan disesuaikan di Roblox Studio.'),
        detail: t('This package is learning material. Review its structure and settings before adding it to the economy of a live game.', 'Paket ini ditujukan untuk belajar. Periksa struktur dan pengaturannya sebelum dipakai dalam sistem ekonomi game yang sudah dirilis.'),
        tags: ['Roblox Studio', 'RBXM', t('Learning', 'Untuk belajar')],
        ...robloxPackage,
        sourcePath: 'BlindBoxByTheDranxX[ForLearningUse!].rbxm',
        fileName: 'BlindBoxByTheDranxX[ForLearningUse!].rbxm',
        icon: null,
        published: true,
        latestVersionId: 'current',
        versions: [currentVersion('2026-01-23', t('Learning build from the repository.', 'Build untuk belajar dari repositori.'))]
      },
      {
        id: 'chat-system',
        name: 'Chat System',
        category: 'systems',
        categoryLabel: t('Communication system', 'Sistem komunikasi'),
        description: t('A chat-system model to inspect and adapt for your Roblox game.', 'Model sistem chat yang bisa dipelajari dan disesuaikan untuk game Roblox kamu.'),
        detail: t('Import the model, review its instances and scripts, then configure it for how players communicate in your game.', 'Impor modelnya, periksa instance dan script yang tersedia, lalu sesuaikan pengaturannya dengan cara pemain berkomunikasi di game kamu.'),
        tags: ['Roblox Studio', 'RBXM', 'Chat'],
        ...robloxPackage,
        sourcePath: 'ChatSystemByTheDranxX.rbxm',
        fileName: 'ChatSystemByTheDranxX.rbxm',
        icon: null,
        published: true,
        latestVersionId: 'current',
        versions: [currentVersion('2026-02-03', t('Public build restored in the repository.', 'Build publik yang dipulihkan di repositori.'))]
      },
      {
        id: 'global-message',
        name: 'Global Message',
        category: 'systems',
        categoryLabel: t('Messaging system', 'Sistem pesan'),
        description: t('A reusable global-message system for Roblox games.', 'Sistem global message yang bisa dipakai ulang di game Roblox.'),
        detail: t('Check who can send messages, how text is filtered, and how messages are delivered before using the package in a live game.', 'Periksa siapa yang boleh mengirim pesan, penyaringan teks, dan alur pengirimannya sebelum paket ini dipakai dalam game yang sudah dirilis.'),
        tags: ['Roblox Studio', 'RBXM', 'Messaging'],
        ...robloxPackage,
        sourcePath: 'GlobalMessageByTheDranxX.rbxm',
        fileName: 'GlobalMessageByTheDranxX.rbxm',
        icon: null,
        published: true,
        latestVersionId: 'current',
        versions: [currentVersion('2026-02-02', t('Public build from the repository.', 'Build publik dari repositori.'))]
      },
      {
        id: 'obfuscation-system',
        name: 'Obfuscation System',
        category: 'utilities',
        categoryLabel: 'Developer utility',
        description: t('A Luau obfuscation experiment in an RBXM package, with readable source code included.', 'Eksperimen obfuscation Luau dalam paket RBXM, dilengkapi source code yang bisa dibaca.'),
        detail: t('Use it as a developer tool and learning reference. Server authority and input validation are still needed.', 'Gunakan sebagai tool developer dan bahan belajar. Otoritas di server dan validasi input tetap diperlukan.'),
        tags: ['Roblox Studio', 'Luau', 'RBXM'],
        ...robloxPackage,
        sourcePath: 'ObfuscationSystemByTheDranxX.rbxm',
        fileName: 'ObfuscationSystemByTheDranxX.rbxm',
        icon: null,
        published: true,
        latestVersionId: 'current',
        versions: [currentVersion('2026-01-24', t('Public build with source code included.', 'Build publik yang dilengkapi source code.'))]
      },
      {
        id: 'unlimited-title-giver',
        name: 'Unlimited Tumpuk Title Giver',
        category: 'systems',
        categoryLabel: t('Player title system', 'Sistem title pemain'),
        description: t('A Roblox title-giver system that displays multiple player titles in a stack.', 'Sistem title giver Roblox untuk menampilkan beberapa title pemain secara bertumpuk.'),
        detail: t('Adapt the title rules, permissions, and layout to your game.', 'Sesuaikan aturan pemberian title, izin pengguna, dan tata letaknya dengan game kamu.'),
        tags: ['Roblox Studio', 'RBXM', 'Titles'],
        ...robloxPackage,
        sourcePath: 'UnlimitedTumpukTitleGiverByTheDranxX.rbxm',
        fileName: 'UnlimitedTumpukTitleGiverByTheDranxX.rbxm',
        icon: null,
        published: true,
        latestVersionId: 'current',
        versions: [currentVersion('2026-01-26', t('Public build from the repository.', 'Build publik dari repositori.'))]
      }
    ]
  });
})();
