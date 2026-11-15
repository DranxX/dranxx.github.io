(() => {
  const isIndonesian = window.DRANXX_CONFIG?.locale === 'id';
  const t = (english, indonesian) => isIndonesian ? indonesian : english;
  const assetBase = window.DRANXX_CONFIG?.assetBase || '../assets';

  const currentVersion = (releasedAt, note) => ({
    id: 'current',
    version: 'Stable',
    channel: 'stable',
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
      { id: 'utilities', label: 'Utilities' },
      { id: 'datasets', label: 'Datasets' }
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
      },
      {
        id: 'paper-research-mcp',
        name: 'Paper-Research-MCP',
        category: 'tools',
        categoryLabel: t('Python / MCP server', 'Server MCP Python'),
        description: t(
          'A federated MCP server for academic paper search: 31 sources behind 36 tools, installable with uv.',
          'Server MCP terfederasi untuk pencarian paper akademik: 31 sumber di balik 36 tools, dipasang dengan uv.'
        ),
        detail: t(
          'Search OpenAlex, arXiv, Semantic Scholar, GARUDA, and more from one MCP server. The federation layer fans keywords out to every source in parallel, deduplicates by DOI and title, and returns a manual fallback URL when a source blocks or rate limits. The free sources need no API key.',
          'Cari ke OpenAlex, arXiv, Semantic Scholar, GARUDA, dan sumber lain dari satu server MCP. Lapisan federasinya mengirim keyword ke semua sumber secara paralel, mendeduplikasi lewat DOI dan judul, lalu mengembalikan URL fallback manual saat ada sumber yang memblokir atau membatasi. Sumber gratisnya tidak butuh API key.'
        ),
        tags: ['Python', 'MCP', 'uv', 'PyPI'],
        preview: `${assetBase}/previews/paper-research-mcp.png`,
        action: 'install',
        externalUrl: 'https://pypi.org/project/paper-research-mcp/',
        sourceUrl: 'https://github.com/DranxX/Paper-Research-MCP',
        sourceBrand: 'github',
        icon: `${assetBase}/brands/python.svg`,
        installation: t(
          ['Install the package with uv: uv tool install paper-research-mcp', 'Add the server block to your MCP client config with command uvx and args paper-research-mcp', 'Restart the client, then call the search tools'],
          ['Pasang paketnya dengan uv: uv tool install paper-research-mcp', 'Tambahkan blok server ke config MCP client kamu dengan command uvx dan args paper-research-mcp', 'Restart client-nya, lalu panggil tools pencariannya']
        ),
        terms: t(
          'MIT licensed. Free sources work without an API key, and premium connectors activate only when their environment variables are set.',
          'Lisensi MIT. Sumber gratis bisa dipakai tanpa API key, dan konektor premium aktif hanya jika environment variable-nya diisi.'
        ),
        fileName: 'paper_research_mcp-0.1.3-py3-none-any.whl',
        published: true,
        latestVersionId: 'current',
        versions: [{
          id: 'current',
          version: '0.1.3',
          channel: 'stable',
          releasedAt: '2026-11-14',
          note: t('First public release on PyPI.', 'Rilis publik pertama di PyPI.'),
          published: true
        }]
      },
      {
        id: 'typed-decisions-v1',
        name: 'Typed Decisions v1',
        category: 'datasets',
        categoryLabel: t('Hugging Face dataset', 'Dataset Hugging Face'),
        description: t(
          '458,093 typed decisions across 17 sub-datasets in English and Indonesian. Every answer is a full probability distribution over options, categories, or score levels.',
          '458.093 typed decisions dalam 17 sub-dataset untuk bahasa Inggris dan Indonesia. Setiap jawaban berupa distribusi probabilitas penuh atas opsi, kategori, atau tingkat skor.'
        ),
        detail: t(
          'Use the distributions as soft targets when training decision or classification models. The 17 sub-datasets cover image and text tasks in two languages, and each row ships as JSONL.',
          'Distribusinya bisa dipakai sebagai soft target saat melatih model decision atau klasifikasi. 17 sub-datasetnya mencakup tugas image dan teks dalam dua bahasa, dan tiap barisnya tersimpan sebagai JSONL.'
        ),
        tags: ['JSONL', 'Classification', 'EN / ID'],
        action: 'open',
        externalUrl: 'https://huggingface.co/datasets/DranxX/typed-decisions-v1',
        sourceUrl: 'https://huggingface.co/datasets/DranxX/typed-decisions-v1',
        sourceBrand: 'huggingface',
        icon: `${assetBase}/brands/huggingface.svg`,
        fileName: 'typed-decisions-v1.jsonl',
        published: true,
        latestVersionId: 'current',
        versions: [{
          id: 'current',
          version: 'v1',
          channel: 'stable',
          releasedAt: '2026-11-02',
          note: t('Initial public release on Hugging Face.', 'Rilis publik pertama di Hugging Face.'),
          published: true
        }]
      },
      {
        id: 'corpus-cleaning-v1',
        name: 'Corpus Cleaning v1',
        category: 'datasets',
        categoryLabel: t('Hugging Face dataset', 'Dataset Hugging Face'),
        description: t(
          'A paired dirty and clean text dataset for training text-cleaning models, in Indonesian, English, and Chinese. Over a million rows in three columns: lang, raw, clean.',
          'Dataset pasangan teks kotor dan bersih untuk melatih model text-cleaning dalam bahasa Indonesia, Inggris, dan Mandarin. Lebih dari satu juta baris dengan tiga kolom: lang, raw, clean.'
        ),
        detail: t(
          'Each row pairs a raw sentence with its cleaned target, so a seq2seq model can learn the transformation. Ships as Parquet shards under the data folder.',
          'Tiap baris memasangkan teks mentah dengan target bersihnya, sehingga model seq2seq bisa mempelajari transformasinya. Tersimpan sebagai shard Parquet di folder data.'
        ),
        tags: ['Parquet', 'Text cleaning', 'ID / EN / ZH'],
        action: 'open',
        externalUrl: 'https://huggingface.co/datasets/DranxX/corpus-cleaning-v1',
        sourceUrl: 'https://huggingface.co/datasets/DranxX/corpus-cleaning-v1',
        sourceBrand: 'huggingface',
        icon: `${assetBase}/brands/huggingface.svg`,
        fileName: 'corpus-cleaning-v1.parquet',
        published: true,
        latestVersionId: 'current',
        versions: [{
          id: 'current',
          version: 'v1',
          channel: 'stable',
          releasedAt: '2026-09-26',
          note: t('Initial public release on Hugging Face.', 'Rilis publik pertama di Hugging Face.'),
          published: true
        }]
      },
      {
        id: 'corpus-indonesian-20m',
        name: 'Corpus-Indonesian-20M',
        category: 'datasets',
        categoryLabel: t('Hugging Face dataset', 'Dataset Hugging Face'),
        description: t(
          'An Indonesian-only pretraining corpus: 4.1 billion tokens and 21.9 million rows in a single text column, language-filtered and exact-deduplicated.',
          'Korpus pretraining khusus bahasa Indonesia: 4,1 miliar token dan 21,9 juta baris dalam satu kolom teks, sudah difilter bahasanya dan dideduplikasi.'
        ),
        detail: t(
          'Merged from three sources and cleaned for pretraining runs. Ships as seven Parquet shards, with the token count measured using the Qwen3 BPE tokenizer.',
          'Digabung dari tiga sumber dan dibersihkan untuk kebutuhan pretraining. Tersimpan sebagai tujuh shard Parquet, dengan jumlah token diukur memakai tokenizer Qwen3 BPE.'
        ),
        tags: ['Parquet', 'Pretraining', 'Indonesian'],
        action: 'open',
        externalUrl: 'https://huggingface.co/datasets/DranxX/Corpus-Indonesian-20M',
        sourceUrl: 'https://huggingface.co/datasets/DranxX/Corpus-Indonesian-20M',
        sourceBrand: 'huggingface',
        icon: `${assetBase}/brands/huggingface.svg`,
        fileName: 'corpus-indonesian-20m.parquet',
        published: true,
        latestVersionId: 'current',
        versions: [{
          id: 'current',
          version: 'v1',
          channel: 'stable',
          releasedAt: '2026-10-26',
          note: t('Initial public release on Hugging Face.', 'Rilis publik pertama di Hugging Face.'),
          published: true
        }]
      }
    ]
  });
})();
