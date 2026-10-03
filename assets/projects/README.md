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

`preview` opsional. Gunakan gambar asli proyek atau preview resmi repo; jika gambar gagal dimuat, card tetap menampilkan identitas, deskripsi, dan link. Corpus-cleaner memakai preview resmi GitHub yang disimpan di `assets/previews/corpus-cleaner.png`.

`featuredProjectIds` memilih maksimal lima proyek untuk carousel. Gunakan ID dari katalog yang sama agar preview dan card tetap konsisten. Slide bergeser otomatis setiap enam detik dan berhenti saat hover, fokus keyboard, atau tab browser disembunyikan. Tombol play/pause, panah, dan pilihan nama proyek tetap tersedia. Preferensi reduced motion memulai carousel dalam keadaan dijeda; pengunjung masih bisa memutarnya sendiri.

## Menambahkan halaman detail

1. Buat folder `assets/projects/<project-id>/` jika ada gambar proyek.
2. Daftarkan media dan link asli di `assets/js/site.config.js`; gambar bersifat opsional.
3. Masukkan ringkasan, role, alur, keputusan teknis, sistem, dan kredit di `assets/js/projects.data.js`.
4. Tambahkan halaman lokal yang memuat renderer `assets/js/projects.js`, lalu arahkan `url` pada katalog ke halaman itu.

Pisahkan ringkasan yang langsung terlihat dari rincian teknis yang dibuka lewat `details`. Klaim kontribusi mengikuti pekerjaan yang benar-benar dilakukan; kredit aset dan dependensi tetap tersedia di bagian role.
