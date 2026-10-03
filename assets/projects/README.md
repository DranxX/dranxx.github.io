# Project Assets Structure

Struktur folder aset untuk project studi kasus / showcase.

## Konvensi Folder

Setiap project diletakkan dalam subfolder tersendiri di bawah `assets/projects/<project-id>/`:

```
assets/projects/
├── README.md
└── <project-id>/
    ├── banner.webp       # Hero banner lebar untuk halaman detail studi kasus
    ├── card.webp         # Gambar landscape untuk card di projects.html
    ├── icon.webp         # Logo/ikon persegi 1:1 untuk identitas project
    └── icon_nobg.webp    # Logo transparan tanpa background untuk atribut/ornamen
```

## Spesifikasi Gambar

| Nama File | Aspek Rasio / Ukuran | Format | Penggunaan |
|---|---|---|---|
| `banner.webp` | ~16:9 atau 2:1 (lebar 1500px+) | WebP | Header banner pada halaman studi kasus |
| `card.webp` | ~16:10 atau 16:9 (1024x640px) | WebP | Banner visual pada card daftar proyek |
| `icon.webp` | 1:1 (512x512px) | WebP | Kotak logo identitas proyek |
| `icon_nobg.webp` | Asli / Transparan | WebP | Aksen, ornamen visual, atau atribut |

## Menambahkan proyek ke katalog

Daftarkan proyek di `assets/js/data.js`, pada `projects`. Katalog ini menerima semua jenis karya, termasuk game, tools, repo, dan proyek dengan halaman detail.

- `kind: 'repository'`: card membuka repo. Metadata `source`, `visibility`, `archived`, dan `fork` mengikuti repo aslinya.
- `kind: 'case-study'`: card membuka halaman detail lokal, seperti `Project_Bentengan.html`.
- `kind: 'project'`: card membuka URL proyek, misalnya halaman game atau demo.

Setiap entry memiliki `id`, `name`, `code`, `scopes`, `categoryLabel`, `description`, `tags`, dan `url`. `scopes` bisa memuat `game`, `software`, `automation`, atau `ai`; pencarian juga membaca nama, deskripsi, dan tag teknologi.

`preview` opsional dan berisi path gambar lokal, misalnya `${assetBase}/previews/<id>.webp`; validator memastikan file-nya ada. Tanpa `preview`, repo GitHub memakai preview resmi GitHub. Jika gambar gagal dimuat, card tetap menampilkan identitas, deskripsi, dan link.

## Sinkronisasi dengan GitHub

Home dan Projects mengambil daftar repo `DranxX` dari GitHub API saat halaman dibuka, lalu menyimpannya di browser selama satu jam. Repo hasil fork selalu dilewati, begitu juga repo di `github.ignore` pada `assets/js/site.config.js` (saat ini repo README profil dan repo situs ini).

- Repo yang sudah ada di `projects` tetap memakai teks, tag, kategori, dan preview dari `data.js`. Kalau repo itu dihapus, di-rename, atau berubah jadi fork, card-nya hilang; kalau di-archive, card diberi label Archived.
- Repo yang belum ada di `projects` muncul otomatis dengan nama, deskripsi, bahasa, dan topics dari GitHub. Topics `game`, `roblox`, `minecraft`, `software`, `tool`, `bot`, `automation`, `ai`, atau `machine-learning` menentukan filter kategorinya.
- Untuk teks dua bahasa, kategori, atau gambar sendiri, tambahkan repo itu ke `projects`.
- Kalau GitHub API gagal (offline atau kena batas 60 request per jam), situs memakai daftar terakhir yang tersimpan, atau `projects` di `data.js`.

## Carousel homepage

Carousel di homepage menampilkan semua proyek yang tidak di-archive, sesuai urutan katalog: proyek di `projects` lebih dulu, lalu repo baru dari GitHub. Slide bergeser setiap enam detik. Hover, fokus keyboard, sentuhan, tab browser yang disembunyikan, atau carousel yang sedang di luar layar menahan slide; setelah dilepas, hitungan berlanjut dari posisi terakhir. Garis di bawah slide menunjukkan sisa waktu dan bisa diklik untuk pindah proyek. Dengan preferensi reduced motion, slide tetap berganti tetapi tanpa animasi geser.

## Menambahkan halaman detail

1. Buat folder `assets/projects/<project-id>/` jika ada gambar proyek.
2. Daftarkan media dan link asli di `assets/js/site.config.js`; gambar bersifat opsional.
3. Masukkan ringkasan, role, alur, keputusan teknis, sistem, dan kredit di `assets/js/projects.data.js`.
4. Tambahkan halaman lokal yang memuat renderer `assets/js/projects.js`, lalu arahkan `url` pada katalog ke halaman itu.

Pisahkan ringkasan yang langsung terlihat dari rincian teknis yang dibuka lewat `details`. Klaim kontribusi mengikuti pekerjaan yang benar-benar dilakukan; kredit aset dan dependensi tetap tersedia di bagian role.
