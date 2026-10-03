(() => {
  const isIndonesian = window.DRANXX_CONFIG?.locale === 'id';
  const t = (english, indonesian) => isIndonesian ? indonesian : english;
  const assetBase = window.DRANXX_CONFIG?.assetBase || '../assets';

  window.DRANXX_DATA = Object.freeze({
    principles: [
      {
        number: '01',
        title: t('Own the state', 'Kuasai alur state'),
        label: t('System design', 'Desain sistem'),
        description: t('Make authority, lifecycle, and data flow explicit so a feature stays understandable after it grows.', 'Buat otoritas, siklus hidup, dan alur data terlihat jelas agar fitur tetap mudah dipahami ketika berkembang.')
      },
      {
        number: '02',
        title: t('Secure the boundary', 'Amankan batas sistem'),
        label: t('Security', 'Keamanan'),
        description: t('Keep authority clear, validate untrusted input on the server, and consider abuse cases alongside the happy path.', 'Jaga pembagian otoritas tetap jelas, validasi input yang tidak tepercaya di server, dan pertimbangkan skenario penyalahgunaan selain alur normal.')
      },
      {
        number: '03',
        title: t('Measure performance', 'Ukur performa'),
        label: t('Optimization', 'Optimisasi'),
        description: t('Profile first, optimize the actual bottleneck, and keep frame time, memory, and network cost visible.', 'Lakukan profiling lebih dulu, optimalkan bottleneck yang nyata, dan pantau frame time, memori, serta biaya jaringan.')
      },
      {
        number: '04',
        title: t('Clarify the action', 'Perjelas interaksi'),
        label: t('UX & motion', 'UX & animasi'),
        description: t('Use interface hierarchy and restrained animation to explain state changes rather than decorating them.', 'Gunakan hierarki antarmuka dan animasi seperlunya untuk menjelaskan perubahan state, bukan menghiasinya.')
      }
    ],

    services: [
      {
        id: 'games',
        number: '01',
        title: t('Gameplay Systems', 'Sistem Gameplay'),
        accent: t('Game Systems', 'Sistem'),
        description: t('Need matchmaking, combat, or persistent player data? I build the server rules and connect the client controllers, so input, UI, and saved data follow the same game state.', 'Butuh matchmaking, combat, atau data pemain yang tersimpan? Saya bangun aturan di server dan hubungkan controller client, supaya input, UI, dan data mengikuti state game yang sama.'),
        deliverables: t(['Gameplay: rounds, combat, objectives, movement, and input', 'Backend: party queues, cross-server matchmaking, teleport, and rejoin', 'Player systems: inventory, shop, receipts, progression, and rankings'], ['Gameplay: ronde, combat, objective, movement, dan input', 'Backend: party, matchmaking lintas server, teleport, dan rejoin', 'Sistem pemain: inventory, shop, receipt, progres, dan ranking']),
        proof: { label: t('See these systems in Bentengan', 'Lihat implementasinya di Bentengan'), url: 'Project_Bentengan', image: `${assetBase}/projects/bentengan/card.webp` },
        tags: ['Roblox Studio', 'Unity', 'Luau', t('Gameplay architecture', 'Arsitektur gameplay')]
      },
      {
        id: 'software',
        number: '02',
        title: t('Software & Developer Tools', 'Software & Alat Developer'),
        accent: 'Software',
        description: t('Repeatedly moving files, copying data, or running the same commands? I build tools and integrations around the workflow you already use.', 'Sering pindah file, salin data, atau menjalankan langkah yang sama? Saya membuat tools dan integrasi untuk workflow yang kamu pakai sehari-hari.'),
        deliverables: t(['Local utilities and file-processing tools', 'API integrations and bot workflows', 'Editor and game-engine tooling'], ['Utilitas lokal dan pengolahan file', 'Integrasi API dan workflow bot', 'Tooling editor dan game engine']),
        proof: { label: t('Explore DrXporter', 'Lihat DrXporter'), url: 'https://github.com/DranxX/DrXporter' },
        tags: ['Python', 'TypeScript', t('Automation', 'Otomatisasi'), t('Developer tooling', 'Alat developer')]
      },
      {
        id: 'ai-ml',
        number: '03',
        title: t('AI / ML Experiments', 'Eksperimen AI / ML'),
        accent: 'AI / ML',
        description: t('Have a dataset or a model idea to test? We can scope a prototype for text processing, fine-tuning, or computer vision, then inspect the output and its limits.', 'Punya dataset atau ide model yang ingin dicoba? Kita bisa mulai dari prototype pengolahan teks, fine-tuning, atau computer vision, lalu cek hasil dan batasannya.'),
        deliverables: t(['Data preparation and processing scripts', 'Training and inference workflows', 'Prototype evaluation with sample outputs'], ['Script persiapan dan pengolahan data', 'Workflow training dan inference', 'Evaluasi prototype dengan contoh output']),
        proof: { label: t('Explore corpus-cleaner', 'Lihat corpus-cleaner'), url: 'https://github.com/DranxX/corpus-cleaner' },
        tags: ['Python', 'TensorFlow', 'PyTorch', 'OpenCV']
      },
      {
        id: 'security-performance',
        number: '04',
        title: t('Security & Performance', 'Keamanan & Performa'),
        accent: t('Security', 'Keamanan'),
        description: t('A feature can work normally and still fail on bad input, duplicate requests, or disconnects. I trace those paths, review server validation, and profile suspected bottlenecks.', 'Fitur bisa berjalan normal tapi bermasalah saat input salah, request ganda, atau koneksi putus. Saya telusuri alurnya, cek validasi server, dan lakukan profiling pada bottleneck yang dicurigai.'),
        deliverables: t(['Code review with findings and proposed fixes', 'Server validation, rate limits, and recovery paths', 'Profiling and focused performance changes'], ['Review kode dengan temuan dan usulan perbaikan', 'Validasi server, rate limit, dan jalur recovery', 'Profiling dan perbaikan performa sesuai bottleneck']),
        proof: { label: t('See Bentengan engineering decisions', 'Lihat keputusan teknis Bentengan'), url: 'Project_Bentengan#decisions' },
        tags: [t('Threat modeling', 'Pemodelan ancaman'), 'Pentesting', 'Profiling', t('Optimization', 'Optimisasi')]
      }
    ],

    projects: [
      {
        id: 'bentengan',
        code: 'BNT',
        name: 'Bentengan',
        kind: 'case-study',
        scopes: ['game'],
        categoryLabel: 'Roblox / Multiplayer',
        description: t('Team PvP on Roblox, from cross-server matchmaking to the final score. I built the gameplay and backend scripting: combat, party queues, rejoin, player data, and purchases.', 'PvP tim di Roblox, dari matchmaking lintas server sampai hasil pertandingan. Saya mengerjakan scripting gameplay dan backend: combat, antrean party, rejoin, data pemain, dan transaksi.'),
        tags: ['Luau', 'MemoryStore', 'ProfileStore'],
        preview: `${assetBase}/projects/bentengan/card.webp`,
        url: 'Project_Bentengan'
      },
      {
        id: 'corpus-cleaner',
        code: 'CRC',
        name: 'corpus-cleaner',
        preview: `${assetBase}/previews/corpus-cleaner.png`,
        kind: 'repository',
        scopes: ['ai'],
        categoryLabel: 'AI / Text processing',
        visibility: 'public',
        archived: false,
        fork: false,
        source: 'original',
        description: t('A LoRA fine-tuning toolkit for turning raw text into clean text in Indonesian, English, and Chinese. Includes UMT5 training, tokenization caches, environment checks, and inference scripts.', 'Toolkit fine-tuning LoRA untuk membersihkan teks mentah dalam bahasa Indonesia, Inggris, dan Mandarin. Mencakup training UMT5, cache tokenisasi, pengecekan environment, dan script inference.'),
        tags: ['Python', 'LoRA', 'Transformers', 'UMT5'],
        url: 'https://github.com/DranxX/corpus-cleaner'
      },
      {
        id: 'drxporter',
        code: 'DXP',
        name: 'DrXporter',
        preview: `${assetBase}/previews/drxporter.webp`,
        scopes: ['game', 'software'],
        categoryLabel: t('Personal developer tool', 'Alat developer pribadi'),
        visibility: 'public',
        archived: false,
        fork: false,
        source: 'original',
        description: t('Work on Roblox scripts in a local editor and keep Studio in sync. A Luau plugin and TypeScript service track scripts and instances in both directions, using UUIDs and Rojo-compatible files.', 'Edit script Roblox di editor lokal dan sinkronkan perubahan ke Studio, atau sebaliknya. Plugin Luau dan service TypeScript melacak script serta instance lewat UUID dan file yang kompatibel dengan Rojo.'),
        tags: ['Luau', 'TypeScript', 'Node.js', 'Rojo'],
        url: 'https://github.com/DranxX/DrXporter'
      },
      {
        id: 'roblox-assets',
        code: 'RBL',
        name: 'MyRobloxAssets',
        preview: `${assetBase}/previews/roblox-assets.webp`,
        scopes: ['game'],
        categoryLabel: t('Game asset collection', 'Koleksi aset game'),
        visibility: 'public',
        archived: false,
        fork: false,
        source: 'original',
        description: t('Reusable Roblox models and scripts, with RBXM packages you can import into Studio. Browse the source, inspect how each system works, and adapt it to your game.', 'Kumpulan model dan script Roblox dengan paket RBXM yang bisa langsung diimpor ke Studio. Buka source-nya, pelajari cara kerja tiap sistem, lalu sesuaikan dengan game-mu.'),
        tags: ['Roblox Studio', 'Luau'],
        url: 'https://github.com/DranxX/MyRobloxAssets'
      },
      {
        id: 'saza-go',
        code: 'SGO',
        name: 'SAZA Bot Go',
        preview: `${assetBase}/previews/saza-go.webp`,
        scopes: ['automation'],
        categoryLabel: t('WhatsApp bot starter', 'Fondasi bot WhatsApp'),
        visibility: 'public',
        archived: false,
        fork: false,
        source: 'original',
        description: t('Build a WhatsApp bot in Go without starting its connection and storage layers from scratch. Uses whatsmeow, a plugin registry, SQLite, reconnection handling, and spam protection.', 'Starter bot WhatsApp berbasis Go dan whatsmeow. Sudah punya registry plugin, penyimpanan SQLite, reconnect, dan proteksi spam, jadi pengembangan bisa fokus ke fitur bot-nya.'),
        tags: ['Go', 'WhatsMeow', 'SQLite', 'Plugins'],
        url: 'https://github.com/DranxX/SAZA-Bot-Go'
      },
      {
        id: 'saza-js',
        code: 'SJS',
        name: 'SAZA Bot JS',
        preview: `${assetBase}/previews/saza-js.webp`,
        scopes: ['automation'],
        categoryLabel: t('WhatsApp bot starter', 'Fondasi bot WhatsApp'),
        visibility: 'public',
        archived: false,
        fork: false,
        source: 'original',
        description: t('A JavaScript starter for WhatsApp bots using Baileys. Includes formatted responses and an npm or Bun workflow as a base for adding your own commands.', 'Starter bot WhatsApp dengan JavaScript dan Baileys. Menyediakan format respons serta workflow npm atau Bun sebagai dasar untuk menambahkan command sendiri.'),
        tags: ['JavaScript', 'Baileys', 'Node.js', 'Bun'],
        url: 'https://github.com/DranxX/SAZA-Bot-JS'
      },
      {
        id: 'drx-manager',
        code: 'DRM',
        name: 'DrxManager',
        preview: `${assetBase}/previews/drx-manager.webp`,
        scopes: ['software'],
        categoryLabel: t('Personal desktop app', 'Aplikasi desktop pribadi'),
        visibility: 'public',
        archived: false,
        fork: false,
        source: 'original',
        description: t('A Windows file explorer built with Rust and egui. Color tags help organize files, while built-in previews let you inspect them without opening a separate app.', 'File explorer Windows yang saya bangun dengan Rust dan egui. Tag warna membantu mengelompokkan file, sementara preview bawaan memudahkan cek isi file tanpa membuka aplikasi lain.'),
        tags: ['Rust', 'egui', 'Windows'],
        url: 'https://github.com/DranxX/DrxManager'
      },
      {
        id: 'discord-bot',
        code: 'DSC',
        name: 'DiscordBot',
        preview: `${assetBase}/previews/discord-bot.webp`,
        scopes: ['automation'],
        categoryLabel: t('Discord bot', 'Bot Discord'),
        visibility: 'public',
        archived: false,
        fork: false,
        source: 'original',
        description: t('A Discord.js bot for running a server. Slash commands handle bans, kicks, timeouts, and bulk deletes for a moderator role, and notifiers announce new YouTube videos, TikTok posts, and live streams.', 'Bot Discord.js untuk mengelola server. Slash command menangani ban, kick, timeout, dan hapus pesan massal untuk role moderator, sementara notifier mengumumkan video YouTube, postingan TikTok, dan live terbaru.'),
        tags: ['JavaScript', 'Discord.js', 'YouTube API', 'TikTok'],
        url: 'https://github.com/DranxX/DiscordBot'
      },
      {
        id: 'chatbot',
        code: 'CHT',
        name: 'chatbot',
        scopes: ['ai', 'game'],
        categoryLabel: t('AI / NPC dialogue', 'AI / Dialog NPC'),
        visibility: 'public',
        archived: false,
        fork: false,
        source: 'original',
        description: t('A small Flask endpoint on Vercel that sends a player message to Gemini and returns a short reply in an NPC voice. Built for NPC dialogue in Roblox, and usable from any game that can make HTTP requests.', 'Endpoint Flask kecil di Vercel yang meneruskan pesan pemain ke Gemini lalu membalas singkat dengan gaya bicara NPC. Dibuat untuk dialog NPC di Roblox, tapi bisa dipakai game lain yang bisa mengirim request HTTP.'),
        tags: ['Python', 'Flask', 'Gemini', 'Vercel'],
        url: 'https://github.com/DranxX/chatbot'
      }
    ],

    technologyGroups: [
      {
        title: t('Languages', 'Bahasa pemrograman'),
        note: t('Luau and Python come first; the rest show up in projects and experiments', 'Luau dan Python paling utama; sisanya dipakai di proyek dan eksperimen'),
        items: [
          { name: 'Luau / Lua', iconSrc: `${assetBase}/brands/lua.svg`, short: 'Lua', primary: true },
          { name: 'Python', iconSrc: `${assetBase}/brands/python.svg`, short: 'Py', primary: true },
          { name: 'JavaScript', iconSrc: `${assetBase}/brands/javascript.svg`, short: 'JS' },
          { name: 'TypeScript', iconSrc: `${assetBase}/brands/typescript.svg`, short: 'TS' },
          { name: 'Go', iconSrc: `${assetBase}/brands/go.svg`, short: 'Go' },
          { name: 'Rust', iconSrc: `${assetBase}/brands/rust.svg`, iconSurface: 'mono', short: 'RS' },
          { name: 'Java', iconSrc: `${assetBase}/brands/java.svg`, short: 'JV' },
          { name: 'PHP', iconSrc: `${assetBase}/brands/php.svg`, short: 'PHP' }
        ]
      },
      {
        title: t('Game development', 'Pengembangan game'),
        note: t('Currently focused on Roblox development', 'Saat ini paling banyak digunakan untuk pengembangan di Roblox'),
        items: [
          { name: 'Roblox Studio', iconSrc: `${assetBase}/brands/roblox-studio.svg`, short: 'RBLX' },
          { name: 'Unity', iconSrc: `${assetBase}/brands/unity.svg`, iconSurface: 'mono', short: 'UN' },
          { name: 'Godot', iconSrc: `${assetBase}/brands/godot.svg`, short: 'GD' },
          { name: 'Blender', iconSrc: `${assetBase}/brands/blender.svg`, short: 'BL' },
          { name: 'Minecraft Bedrock tooling', iconSrc: `${assetBase}/brands/minecraft-bedrock.svg`, short: 'MC' }
        ]
      },
      {
        title: 'AI & data',
        note: t('For AI experiments and data processing', 'Untuk eksperimen AI dan pengolahan data'),
        items: [
          { name: 'PyTorch', iconSrc: `${assetBase}/brands/pytorch.svg`, short: 'PT' },
          { name: 'TensorFlow', iconSrc: `${assetBase}/brands/tensorflow.svg`, short: 'TF' },
          { name: 'Transformers', iconSrc: `${assetBase}/brands/huggingface.svg`, short: 'HF' },
          { name: 'scikit-learn', iconSrc: `${assetBase}/brands/scikitlearn.svg`, short: 'SK' },
          { name: 'OpenCV', iconSrc: `${assetBase}/brands/opencv.svg`, short: 'CV' }
        ]
      },
      {
        title: t('Security & infrastructure', 'Keamanan & infrastruktur'),
        note: t('Testing, containers, and deployment', 'Pengujian, container, dan deployment'),
        items: [
          { name: 'Burp Suite', iconSrc: `${assetBase}/brands/burp-suite.svg`, short: 'BS' },
          { name: 'Kali Linux', iconSrc: `${assetBase}/brands/kalilinux.svg`, short: 'KL' },
          { name: 'Docker', iconSrc: `${assetBase}/brands/docker.svg`, short: 'DK' },
          { name: 'Vercel', iconSrc: `${assetBase}/brands/vercel.svg`, iconSurface: 'mono', short: 'VC' }
        ]
      }
    ],

    languages: [
       { name: t('Indonesian', 'Bahasa Indonesia'), proficiency: 'active', proficiencyLabel: t('Active', 'Aktif'), level: t('My primary language', 'Bahasa utama saya'), flag: `${assetBase}/icons/flags/id.svg` },
       { name: t('English', 'Bahasa Inggris'), proficiency: 'active', proficiencyLabel: t('Active', 'Aktif'), level: t('Used for work', 'Digunakan untuk bekerja'), flag: `${assetBase}/icons/flags/gb.svg` },
       { name: t('Japanese', 'Bahasa Jepang'), proficiency: 'developing', proficiencyLabel: t('Developing', 'Berkembang'), level: t('General comprehension', 'Pemahaman umum'), flag: `${assetBase}/icons/flags/jp.svg` },
       { name: t('Chinese', 'Bahasa Mandarin'), proficiency: 'beginner', proficiencyLabel: t('Beginner', 'Pemula'), level: t('Early learning', 'Tahap awal belajar'), flag: `${assetBase}/icons/flags/cn.svg` },
       { name: t('French', 'Bahasa Prancis'), proficiency: 'beginner', proficiencyLabel: t('Beginner', 'Pemula'), level: t('Early learning', 'Tahap awal belajar'), flag: `${assetBase}/icons/flags/fr.svg` }
    ]
  });
})();
