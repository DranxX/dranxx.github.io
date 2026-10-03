(() => {
  const config = window.DRANXX_CONFIG;
  const isIndonesian = config?.locale === 'id';
  const t = (english, indonesian) => isIndonesian ? indonesian : english;

  window.DRANXX_CASE_STUDIES = Object.freeze({
    items: [{
      id: 'bentengan', code: 'BNT', name: 'Bentengan', route: config.routes.projectBentengan,
      role: 'Roblox Gameplay & Backend Scripter',
      status: t('Completed project', 'Proyek selesai'), platform: 'Roblox / Team PvP',
      summary: t('A team PvP game with cross-server matchmaking, capture, jail, and rescue.', 'Game PvP beregu dengan matchmaking lintas server, capture benteng, jail, dan rescue.'),
      intro: t(
        'Find a match, vote for a map, catch opponents, rescue teammates, and capture their fort. Behind that loop, I built the custom gameplay and backend scripting that connects the lobby, voting, and match servers, including player data, purchases, and recovery when a player disconnects.',
        'Cari match, pilih map, tangkap lawan, bebaskan teman, lalu rebut benteng mereka. Di balik alur itu, saya membangun scripting gameplay dan backend yang menghubungkan lobby, voting, dan server pertandingan, termasuk data pemain, transaksi, serta recovery ketika pemain terputus.'
      ),
      roleSummary: t('My role covers custom game scripting, from service boot and server rules to client controllers. I also designed the Match Found UI and modified the hit/M1 animation.', 'Saya mengerjakan scripting khusus game, dari startup service dan aturan di server sampai controller di client. Saya juga membuat visual UI Match Found dan memodifikasi animasi hit/M1.'),
      tags: ['Luau', 'MemoryStore', 'MessagingService', 'ProfileStore', 'DataStore'],
      media: config.projectMedia.bentengan, links: config.projectLinks.bentengan,
      snapshot: [
        { label: t('Format', 'Format match'), value: t('1v1 to 5v5 · solo & party', '1v1 sampai 5v5 · solo & party') },
        { label: t('Release places', 'Place rilis'), value: 'Lobby / VoteMap / Gameplay' },
        { label: t('Lobby services', 'Service lobby'), value: t('32 active services in the manifest', '32 service aktif dalam manifest') },
        { label: t('Authority', 'Aturan game'), value: t('Validated on the server', 'Divalidasi di server') }
      ],
      flow: [
        { code: '01', title: 'Lobby', description: t('Load profiles, form a party or enter a PvP room, then queue for a match. The planner fills two teams while keeping parties together.', 'Muat profil, bentuk party atau masuk room PvP, lalu antre untuk match. Planner mengisi dua tim sambil menjaga anggota party tetap bersama.') },
        { code: '02', title: 'VoteMap', description: t('Only the reserved roster can enter. Players choose from three maps, and the timer shortens as votes come in.', 'Hanya roster yang terdaftar bisa masuk. Pemain memilih dari tiga map, lalu timer dipercepat seiring vote masuk.') },
        { code: '03', title: 'Gameplay', description: t('The server controls rounds, valid hits, jail, rescue, and captures. Competitive stats are held until the result is valid.', 'Server mengatur ronde, hit yang valid, jail, rescue, dan capture. Stat kompetitif ditampung sampai hasil pertandingan dinyatakan valid.') },
        { code: '04', title: t('Back to lobby', 'Kembali ke lobby'), description: t('Apply rewards and MMR, save data, clear reservations, and return remaining players. Interrupted transfers have a recovery path.', 'Hitung reward dan MMR, simpan data, bersihkan reservasi, lalu kembalikan pemain yang tersisa. Perpindahan yang terputus punya jalur recovery.') }
      ],
      challenges: [
        {
          title: t('One player, one match', 'Satu pemain, satu match'),
          problem: t('Two lobby servers may find the same player at the same time.', 'Dua server lobby bisa menemukan pemain yang sama pada saat bersamaan.'),
          solution: t('Atomic claims in MemoryStore reserve players before dispatch. Match IDs and deduplication guard the handoff, while a claim scan recovers missed messages.', 'Klaim atomik di MemoryStore mengunci pemain sebelum dispatch. Match ID dan deduplication menjaga handoff, sementara scan klaim memulihkan pesan yang terlewat.'),
          steps: t(['Queue entry', 'Atomic claim', 'Reserved roster'], ['Antrean', 'Klaim atomik', 'Roster reservasi'])
        },
        {
          title: t('Reconnect to the right match', 'Rejoin ke match yang benar'),
          problem: t('A disconnected player should return to their team and current jail state.', 'Pemain yang terputus perlu kembali ke tim dan status jail yang sama.'),
          solution: t('A rejoin record points to the reserved match. The destination server verifies it and restores team and jail state. If the record has expired or the rejoin fails, the player goes back to the lobby.', 'Record rejoin menunjuk ke match di reserved server. Server tujuan memeriksa reservasi lalu memulihkan tim dan status jail. Jika record kedaluwarsa atau rejoin gagal, pemain kembali ke alur lobby.'),
          steps: t(['Rejoin record', 'Verify match', 'Restore state'], ['Record rejoin', 'Cek match', 'Pulihkan state'])
        },
        {
          title: t('Receipt retries without double grants', 'Receipt diulang, grant tetap sekali'),
          problem: t('Roblox can deliver a purchase receipt more than once.', 'Receipt pembelian bisa dikirim ulang oleh Roblox.'),
          solution: t('One ProcessReceipt dispatcher handles Coin and donations. PurchaseId prevents repeat grants, and acknowledgement waits until the purchase record is saved.', 'Satu dispatcher ProcessReceipt menangani Coin dan donasi. PurchaseId mencegah grant berulang, lalu receipt dikonfirmasi setelah catatan pembelian tersimpan.'),
          steps: t(['PurchaseId', 'Grant & save', 'Acknowledge'], ['PurchaseId', 'Grant & simpan', 'Konfirmasi'])
        }
      ],
      systems: [
        {
          number: '01', id: 'lifecycle', title: t('Service startup & lifecycle', 'Startup & lifecycle service'),
          description: t('Services start in a defined order, with dependency checks and cleanup when initialization fails.', 'Service dimulai dalam urutan yang jelas, dengan pengecekan dependency dan cleanup jika startup gagal.'),
          points: t([
            'The lobby manifest registers 32 active services. A dependency graph and preflight checks catch missing instances, cycles, and remote ownership conflicts.',
            'Init, Start, and PlayerLoad have separate contracts. Critical failures roll back initialized services, while noncritical failures let startup continue.',
            'Player load/unload, character respawn, and reverse-order shutdown have their own cleanup. Gameplay monitoring starts after services are ready.'
          ], [
            'Manifest lobby mendaftarkan 32 service aktif. Dependency graph dan preflight memeriksa instance yang hilang, dependency cycle, serta konflik kepemilikan remote.',
            'Init, Start, dan PlayerLoad punya kontrak terpisah. Kegagalan service kritis memicu rollback, sedangkan service nonkritis tidak menghentikan startup.',
            'Load/unload pemain, respawn karakter, dan shutdown dengan urutan terbalik punya cleanup sendiri. Monitoring gameplay baru dimulai setelah service siap.'
          ])
        },
        {
          number: '02', id: 'matchmaking', title: 'Global matchmaking & MMR',
          description: t('Players from different lobby servers share a queue. Parties stay together, and team planning considers their ratings.', 'Pemain dari server lobby berbeda bisa bertemu di antrean yang sama. Party tetap utuh, dan pembagian tim mempertimbangkan rating.'),
          points: t([
            'Solo and party entries support 1v1 through 5v5. MemoryStoreSortedMap merges global and local candidates, deduplicates them, and expires stale entries.',
            'The oldest entry anchors the search. Large MMR gaps are held initially, then the search widens as waiting time increases.',
            'An exact-fill planner fills both teams without splitting parties, minimizes the rating gap, and uses deterministic tie-breaking.',
            'MemoryStore UpdateAsync claims players atomically. MessagingService dispatch is deduplicated, and reservation reloads with claim scans cover missed messages.'
          ], [
            'Antrean solo dan party mendukung 1v1 sampai 5v5. MemoryStoreSortedMap menggabungkan kandidat global dan lokal, membuang duplikat, serta menghapus entry kedaluwarsa.',
            'Entry tertua menjadi acuan pencarian. Selisih MMR yang besar ditahan di awal, lalu rentang pencarian diperluas ketika waktu tunggu bertambah.',
            'Planner exact-fill mengisi kedua tim tanpa memecah party, mencari selisih rating tim yang kecil, dan memakai tie-break yang deterministik.',
            'UpdateAsync di MemoryStore mengklaim pemain secara atomik. Dispatch MessagingService dicegah agar tidak terkirim ganda, lalu reload reservasi dan scan klaim menangani pesan yang terlewat.'
          ])
        },
        {
          number: '03', id: 'party', title: t('Party, PvP rooms & Quick Join', 'Party, room PvP & Quick Join'),
          description: t('Join through a party or a physical PvP area. The server manages membership and locks the roster when a match starts.', 'Pemain bisa masuk lewat party atau area PvP di lobby. Server mengatur anggota dan mengunci roster ketika match dimulai.'),
          points: t([
            'Hosts choose mode and capacity, set friends-only access, kick members, transfer host ownership, or disband. A full party can auto-queue.',
            'Physical PvP areas move through setup, open, full, matching, and teleport states. Server-side touches, bounds, and barriers control membership.',
            'Paired sides must both contain players before matching. Leaving, host changes, cancellation, and intruders trigger state cleanup.',
            'Quick Join uses snapshots and revisioned deltas. A revision gap triggers a fresh snapshot, and the server still confirms area membership before joining.'
          ], [
            'Host memilih mode dan kapasitas, mengatur friends-only, kick, pindah host, atau disband. Party yang penuh bisa otomatis masuk antrean.',
            'Area PvP fisik melewati state setup, open, full, matching, dan teleport. Event Touched di server, bounds, dan barrier mengatur keanggotaan.',
            'Kedua sisi harus punya pemain sebelum matching. Pemain keluar, pergantian host, cancel, dan penyusup ditangani lewat cleanup state.',
            'Quick Join memakai snapshot penuh dan delta dengan revision. Jika ada revision yang terlewat, client meminta snapshot baru, lalu server memastikan pemain terdaftar di area.'
          ])
        },
        {
          number: '04', id: 'teleport', title: t('Cross-place teleport & rejoin', 'Teleport lintas place & rejoin'),
          description: t('Roster and team assignments travel across three places, with recovery for failed transfers and disconnects.', 'Roster dan pembagian tim dibawa melewati tiga place, dengan recovery untuk teleport gagal dan pemain yang terputus.'),
          points: t([
            'MemoryStore reservations own match ID, team, mode, roster, and reserved-server identifiers. TeleportData carries an envelope, not authority.',
            'Destination servers validate reservations and reject outsiders. Roster waits let expected players arrive before continuing.',
            'Reserve and TeleportAsync retry with backoff. TeleportInitFailed, readiness acknowledgements, and timeouts clear frozen state or return players to the lobby.',
            'Rejoin records last about 45 minutes. The destination server verifies the match, restores team and jail state, and clears ended matches and stale records.'
          ], [
            'Reservasi MemoryStore menyimpan match ID, tim, mode, roster, dan identitas reserved server. TeleportData membawa informasi, sementara reservasi server tetap menjadi sumber otoritas.',
            'Server tujuan memvalidasi reservasi dan menolak pemain di luar roster. Roster wait memberi waktu bagi pemain yang terdaftar untuk tiba.',
            'Reserve dan TeleportAsync dicoba ulang dengan backoff. TeleportInitFailed, acknowledgement kesiapan, dan timeout melepas state freeze atau mengembalikan pemain ke lobby.',
            'Record rejoin bertahan sekitar 45 menit. Server tujuan memeriksa match, memulihkan tim dan status jail, lalu membersihkan record lama serta match yang sudah selesai.'
          ])
        },
        {
          number: '05', id: 'voting', title: t('Map voting & synchronized timers', 'Voting map & sinkronisasi timer'),
          description: t('Each player has one active vote. Timers adapt to participation without allowing vote changes to extend the wait.', 'Setiap pemain punya satu vote aktif. Timer mengikuti partisipasi pemain tanpa bisa diperpanjang lewat ganti vote.'),
          points: t([
            'Three choices, live vote totals, and changes that subtract the previous choice. Server checks match ID, roster, choice, and request rate.',
            'The 90-second timer shortens to at most 20 seconds after more than half the roster votes, and at most 5 seconds once everyone votes.',
            'Ties are broken by whichever vote came first. If nobody votes, players return to the lobby. The final map is sent before the teleport.',
            'Manual GUI mounting and snapshot requests handle races between UI readiness and server events. Leaving or an invalid roster cancels the handoff.'
          ], [
            'Tiga pilihan map, jumlah vote live, dan perubahan vote yang mengurangi pilihan sebelumnya. Server memeriksa match ID, roster, pilihan, dan frekuensi request.',
            'Timer 90 detik dipangkas menjadi maksimal 20 detik saat lebih dari separuh roster sudah vote, lalu maksimal 5 detik saat semua sudah vote.',
            'Jika seri, vote yang masuk paling awal menjadi penentu. Jika tidak ada yang vote, pemain kembali ke lobby. Hasil map dikirim sebelum teleport.',
            'Mount GUI manual dan request snapshot menangani UI yang terlambat siap menerima event. Pemain keluar atau roster tidak valid membatalkan handoff.'
          ])
        },
        {
          number: '06', id: 'rounds', title: t('Rounds, jail, rescue & captures', 'Ronde, jail, rescue & capture'),
          description: t('Catch an opponent, rescue a teammate, or capture a fort. Every action feeds the same server-controlled round state.', 'Tangkap lawan, bebaskan teman, atau rebut benteng. Semua aksi mengikuti state ronde yang dikendalikan server.'),
          points: t([
            'Idle, Countdown, InProgress, and Ended connect spawns, weapons, barriers, scores, and timers. The first team to four points wins, and a 3–3 tie opens a tiebreaker.',
            'Enemy hits send players to jail, while teammate hits rescue them. Jail removes weapons and sprint state, which rescue restores. A team loses the round when all connected players are in jail.',
            'Fort captures require an active round, valid weapon, enemy fort, active rosters, and valid distance/cooldown.',
            'Win, Draw, Void, and GameStopped have separate paths. The game discards competitive stats from invalid matches, and custom matches do not grant competitive progression.',
            'Catches, rescues, captures, jail time, and contribution feed stats and deterministic MVP selection. Remaining players return to the lobby after results.'
          ], [
            'State Idle, Countdown, InProgress, dan Ended menghubungkan spawn, weapon, barrier, skor, dan timer. Tim pertama yang mencapai empat poin menang, sedangkan skor 3–3 masuk tiebreaker.',
            'Hit lawan mengirim pemain ke jail, sedangkan hit teman membebaskannya. Jail mencabut weapon dan state sprint, lalu rescue memulihkannya. Tim kalah di ronde itu jika semua anggotanya yang masih terhubung masuk jail.',
            'Capture benteng membutuhkan ronde aktif, weapon valid, benteng lawan, roster aktif, serta jarak dan cooldown yang sesuai.',
            'Win, Draw, Void, dan GameStopped punya jalur hasil terpisah. Stat kompetitif dari match tidak valid dibuang, dan custom match tidak memberi progres kompetitif.',
            'Catch, rescue, capture, waktu jail, dan kontribusi masuk ke stat serta pemilihan MVP yang deterministik. Pemain yang tersisa kembali ke lobby setelah hasil match.'
          ])
        },
        {
          number: '07', id: 'combat', title: t('Combat, weapons & movement', 'Combat, weapon & movement'),
          description: t('The client sends input, then the server checks whether a swing, hit, sprint, or slide is allowed.', 'Client mengirim input, lalu server memeriksa apakah swing, hit, sprint, atau slide boleh dilakukan.'),
          points: t([
            'Weapon ownership and equipment are checked against the catalog. Tool activation, respawn, jail, rescue, and round end share lifecycle cleanup.',
            'Swings have cooldowns and an active hit window, with one target per swing. Hits validate tool, player state, target, team, and distance, with bounded ping compensation.',
            'Server-owned sprint and stamina support keyboard, gamepad, and touch. Analog hysteresis prevents flicker, while the client smooths FOV feedback.',
            'Left/right slides validate direction, cooldown, stamina, and jail state before animation and SFX. Velocity decays during the slide, and movement monitoring allows for it.',
            'Hit/M1 animation modification includes preload, server playback, replication, priority, and cleanup. Other movement animations are integrated assets.'
          ], [
            'Kepemilikan dan equipment weapon diperiksa lewat katalog. Aktivasi Tool, respawn, jail, rescue, dan akhir ronde memakai cleanup lifecycle yang sama.',
            'Swing punya cooldown dan hit window, dengan maksimal satu target per swing. Hit memeriksa Tool, state pemain, target, tim, dan jarak, dengan kompensasi ping yang dibatasi.',
            'Sprint dan stamina dikelola server dengan input keyboard, gamepad, dan touch. Hysteresis analog mencegah sprint flicker, sementara client menghaluskan feedback FOV.',
            'Slide kiri/kanan memvalidasi arah, cooldown, stamina, dan status jail sebelum animasi serta SFX. Velocity menurun selama slide, dan monitoring physics memperhitungkannya.',
            'Modifikasi animasi hit/M1 mencakup preload, playback server, replikasi, prioritas track, dan cleanup. Animasi movement lain memakai aset yang diintegrasikan.'
          ])
        },
        {
          number: '08', id: 'data', title: t('Player data & replication', 'Data pemain & replikasi'),
          description: t('Stats, inventory, and settings persist across sessions. Clients receive what they need through snapshots and deltas.', 'Stat, inventory, dan settings tersimpan lintas sesi. Client menerima data yang dibutuhkan lewat snapshot dan delta.'),
          points: t([
            'Three ProfileStore sessions separate Stats, Inventory, and Settings. Session locks, reconciliation, migrations, and inventory repair guard loading.',
            'StatsService and GameStatsService own mutations, including finite-number checks, clamping, staged match stats, and the final TimePlayed update.',
            'Snapshots and batched StateChannel deltas feed a shared client store. Inventory and settings stay private to their owner, while public attributes expose selected profile data.',
            'PlayerRemoving and BindToClose flush changes before closing profiles. OrderedDataStore writes use coalescing, retry, backoff, and shutdown handling.'
          ], [
            'Tiga session ProfileStore memisahkan Stats, Inventory, dan Settings. Session lock, reconcile, migration, dan perbaikan inventory menjaga proses load.',
            'StatsService dan GameStatsService mengelola perubahan data, termasuk validasi angka finite, clamp, stat sementara per match, dan update terakhir TimePlayed.',
            'Snapshot penuh dan delta StateChannel per batch mengisi shared store di client. Inventory dan settings hanya bisa dilihat pemiliknya, sementara atribut publik berisi data profil terpilih.',
            'PlayerRemoving dan BindToClose menyimpan perubahan tertunda sebelum menutup profil. Write OrderedDataStore memakai coalescing, retry, backoff, dan penanganan shutdown.'
          ])
        },
        {
          number: '09', id: 'progression', title: t('Progression, rankings & profiles', 'Progres, ranking & profil pemain'),
          description: t('Match rewards, skill ratings, and public rankings each follow their own rules instead of sharing one score.', 'Reward match, rating skill, dan ranking publik memakai aturan yang terpisah, bukan satu skor untuk semuanya.'),
          points: t([
            'Score, XP, Coin, level bonuses, first-win rewards, and a daily cap apply only to valid competitive results.',
            'Hidden MMR uses expected score, placement/normal K values, opponent ratings, draws, and performance contribution. It stays separate from lifetime Score.',
            'Leaderboards track wins, captures, MVPs, streaks, games played, score, and playtime. Ranks are cached, ties keep a stable order, and each board shows a top 50 plus a top-three podium.',
            'Login streaks count days in Indonesian time (WIB). Public profiles show approved stats, roles, and inventory, while overhead roles and MVP markers follow the replicated state.'
          ], [
            'Score, XP, Coin, bonus level, reward kemenangan pertama, dan batas reward harian hanya dihitung dari hasil kompetitif yang valid.',
            'MMR tersembunyi memakai expected score, nilai K placement/normal, rating lawan, draw, dan kontribusi performa. Nilainya terpisah dari lifetime Score.',
            'Leaderboard mencatat win, capture, MVP, streak, jumlah game, score, dan playtime. Ranking di-cache, urutan posisi seri tetap stabil, dan tiap board menampilkan top 50 serta podium tiga besar.',
            'Login streak dihitung per hari dengan waktu WIB. Profil publik menampilkan stat, role, dan inventory yang diizinkan. Overhead role dan penanda MVP mengikuti state replikasi.'
          ])
        },
        {
          number: '10', id: 'economy', title: t('Inventory, shop & purchases', 'Inventory, shop & transaksi'),
          description: t('The server checks prices and ownership before grants. Receipt retries must not duplicate items or currency.', 'Server memeriksa harga dan kepemilikan sebelum grant. Pengulangan receipt tidak boleh menggandakan item atau currency.'),
          points: t([
            'Weapons, fort cosmetics, and emotes track owned, equipped, and favorite state. Equipment and emote slots are normalized on the server.',
            'Coin purchases use server prices, ownership checks, limited-item rules, and a per-player purchase guard before inventory changes.',
            'One ProcessReceipt dispatcher handles Coin and donations. PurchaseId deduplicates grants, and save confirmation precedes acknowledgement.',
            'Unavailable profiles and unknown products return NotProcessedYet. Bounded receipt caches and separate shop/donation ledgers support retry and audit.',
            'Donations update saved totals, ordered rankings, and podiums. Limited group claims validate membership on the server before a one-time grant.'
          ], [
            'Weapon, kosmetik benteng, dan emote menyimpan state owned, equipped, serta favorite. Equipment dan slot emote dinormalisasi di server.',
            'Pembelian dengan Coin memakai harga dari server, pengecekan ownership, aturan item limited, dan purchase guard per pemain sebelum inventory berubah.',
            'Satu dispatcher ProcessReceipt menangani Coin dan donasi. Record PurchaseId mencegah grant ganda, lalu pembelian dikonfirmasi setelah berhasil disimpan.',
            'Profil yang belum siap dan produk yang tidak dikenal mengembalikan NotProcessedYet. Cache receipt dibatasi, dengan ledger shop dan donasi terpisah untuk retry serta audit.',
            'Donasi memperbarui total tersimpan, ordered ranking, dan podium. Klaim item grup memvalidasi membership di server sebelum grant sekali.'
          ])
        },
        {
          number: '11', id: 'client', title: t('Match Found & client controllers', 'Match Found & controller client'),
          description: t('UI, input, camera, and audio follow server state, including cancellation and failed handoffs.', 'UI, input, kamera, dan audio mengikuti state server, termasuk saat match dibatalkan atau perpindahan gagal.'),
          points: t([
            'I designed the Match Found UI: layered panels, countdown, blur, and transition feedback. Its controller hides/restores other HUDs and locks input during handoff.',
            'The countdown is synced to the server. The teleport GUI reports when it is ready, and a guard stops the reveal from playing twice, so matchmaking and loading screens line up.',
            'Controllers connect the existing HUDs (inventory, shop, party, player list, quick join, settings, donations, and gameplay) to validation, snapshots, deltas, and error or empty states.',
            'Keyboard, gamepad, and mobile bindings clean up across respawn and cancellation. Tool activation, camera lock, and backpack replacement share the input flow.',
            'The onboarding Info gate saves completion. Notifications use bounded queues, safe RichText, expansion, and paused timing while a player reads.'
          ], [
            'Saya membuat visual UI Match Found: panel berlapis, countdown, blur, dan feedback transisi. Controller menyembunyikan lalu memulihkan HUD lain serta mengunci input saat handoff.',
            'Countdown mengikuti waktu server, dengan acknowledgement kesiapan teleport GUI dan guard agar reveal tidak muncul ganda.',
            'Controller menghubungkan HUD yang sudah ada (inventory, shop, party, player list, quick join, settings, donasi, dan gameplay) ke validasi, snapshot, delta, serta state error atau kosong.',
            'Binding keyboard, gamepad, dan mobile dibersihkan saat respawn atau match dibatalkan. Aktivasi Tool, camera lock, dan pengganti backpack mengikuti alur input ini.',
            'Info gate onboarding menyimpan status selesai. Notifikasi memakai antrean terbatas, RichText yang aman, expand, dan jeda timer saat pemain membaca.'
          ])
        },
        {
          number: '12', id: 'social', title: t('Audio, emotes & live features', 'Audio, emote & fitur live'),
          description: t('Smaller features still respect player settings, round state, and the same cleanup rules as the main game.', 'Fitur pendukung tetap mengikuti settings pemain, state ronde, dan aturan cleanup yang sama dengan gameplay utama.'),
          points: t([
            'Saved settings cover volumes, voice, shadows, and camera shake. Team voice applies distance mixing and rewires after respawn.',
            'Emotes validate ownership, slots, state, movement, cooldown, and request rate. Moving or dying stops playback and cleans up effects and weapon state.',
            'Button SFX and footsteps use shared sound groups. Footsteps respond to material and movement, with fallbacks and playback limits.',
            'Group prompts use game/time conditions, cooldowns, and a client-ready handshake. Staff announcements use rank checks, filtered text, cross-server messaging, and local fallback.',
            'Camera shake and freecam packages are integrated with permission checks, input handling, anchoring, and GUI restoration. The packages themselves are third-party work.'
          ], [
            'Settings tersimpan mencakup volume, voice, shadow, dan camera shake. Voice khusus tim mengatur mixing berdasarkan jarak dan disambungkan ulang setelah respawn.',
            'Emote memvalidasi ownership, slot, state pemain, movement, cooldown, dan frekuensi request. Bergerak atau mati menghentikan playback serta membersihkan efek dan state weapon.',
            'SFX tombol dan footsteps memakai sound group bersama. Footsteps mengikuti material dan movement, dengan fallback serta batas playback.',
            'Prompt grup mengikuti jumlah game/waktu, cooldown, dan handshake kesiapan client. Pengumuman staff memakai pengecekan rank, filter teks, pesan lintas server, dan fallback lokal.',
            'Package camera shake dan freecam diintegrasikan dengan permission, input, anchor, serta pemulihan GUI. Package dasarnya berasal dari pihak ketiga.'
          ])
        },
        {
          number: '13', id: 'network', title: t('Network validation & recovery', 'Validasi network & recovery'),
          description: t('Requests are checked before changing game state. Queue, teleport, data, and shutdown failures have explicit recovery paths.', 'Request diperiksa sebelum mengubah state game. Antrean, teleport, data, dan shutdown punya jalur recovery ketika gagal.'),
          points: t([
            'Every incoming action has one remote that owns it and is checked against a schema, number ranges, allowlists, ownership, and cooldowns. Clients cannot set prices, rewards, teams, or results.',
            'Handlers are wrapped so bad input fails safely, and repeated warnings are throttled. Movement monitoring records speed, teleport, fly, noclip, and unusual physics, with a grace period after trusted actions.',
            'General movement monitoring is mainly used for logging. The jail is stricter: escapees are pulled back, and three escapes in one session can get a player kicked.',
            'Recovery paths cover the lobby (party changes, stale queues, missed messages), transfers (failed teleports, expired rejoins, empty rosters), and data (failed profile loads, duplicate UI events, receipt saves, and flushing on shutdown).'
          ], [
            'Setiap aksi dari client punya satu remote sebagai pemiliknya, lalu diperiksa dengan schema, rentang angka, allowlist, ownership, dan cooldown. Client tidak bisa menentukan harga, reward, tim, atau hasil match.',
            'Handler dibungkus pengaman supaya input buruk tidak merusak server, dan warning yang berulang di-throttle. Monitoring movement mencatat speed, teleport, fly, noclip, dan physics yang tidak wajar, dengan masa toleransi setelah aksi yang tepercaya.',
            'Monitoring movement umum terutama dipakai untuk logging. Jail lebih ketat: pemain yang kabur ditarik kembali, dan tiga kali kabur dalam satu sesi bisa berujung kick.',
            'Jalur recovery mencakup sisi lobby (perubahan party, antrean lama, pesan terlewat), perpindahan (teleport gagal, rejoin kedaluwarsa, roster kosong), dan data (profil gagal load, event UI ganda, save receipt, dan flush saat shutdown).'
          ])
        }
      ],
      ownership: {
        built: t(['Custom gameplay and backend scripting', 'Match Found visual UI and controller', 'Hit/M1 animation modification and combat integration'], ['Scripting gameplay dan backend khusus game', 'Visual UI Match Found dan controller-nya', 'Modifikasi animasi hit/M1 serta integrasi combat']),
        integrated: t(['Wired up existing UI and assets: controllers, state, input, networking, playback, and cleanup'], ['Menyambungkan UI dan aset yang sudah ada: controller, state, input, networking, playback, dan cleanup']),
        excluded: t(['Maps, models, artwork, SFX, VFX, and other visual UI and animations are by other creators.', 'ProfileStore, Trove, Signal, and camera packages are third-party dependencies.'], ['Map, model, artwork, SFX, VFX, serta visual UI dan animasi lain dibuat oleh kreator lain.', 'ProfileStore, Trove, Signal, dan package kamera adalah dependency pihak ketiga.'])
      }
    }]
  });
})();
