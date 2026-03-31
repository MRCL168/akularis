# GitHub File CMS Pro

CMS statis tanpa database untuk GitHub Pages, dengan login GitHub OAuth dan media manager yang lebih lengkap.

## Fitur utama
- File-based CMS tanpa database
- Mode Demo (`localStorage`) dan mode GitHub
- Login **GitHub OAuth** lewat endpoint serverless kecil
- Fallback **token manual** untuk uji lokal atau debugging
- Dua workflow publish:
  - **Direct publish** ke branch utama
  - **Review via Pull Request** ke working branch
- Editor **Markdown** dengan:
  - live preview
  - split / write / preview mode
  - toolbar snippet cepat
  - autosave draft lokal
- CRUD artikel lengkap
- Featured post, kategori, tag, SEO title/description
- Media manager lebih lengkap:
  - upload banyak file sekaligus
  - alt text dan caption
  - copy URL / copy Markdown
  - jadikan cover image
  - sisipkan langsung ke editor
  - hapus file dari repo
- Export / import backup JSON
- Generate otomatis file pendukung:
  - `data/search.json`
  - `data/media.json`
  - `sitemap.xml`
  - `rss.xml`
  - `robots.txt`
- Halaman detail artikel dengan rendering Markdown + daftar isi

## Struktur
- `index.html` halaman depan
- `post.html` halaman detail artikel
- `admin.html` panel admin
- `data/site.json` konfigurasi situs
- `data/posts.json` data artikel
- `data/media.json` metadata media library
- `serverless/` contoh endpoint OAuth proxy

## Uji coba lokal
Jalankan server lokal sederhana:

```bash
python3 -m http.server 8080
```

Lalu buka:
- `http://localhost:8080/cms-serius-oauth-media/index.html`
- `http://localhost:8080/cms-serius-oauth-media/admin.html`

## Setup GitHub OAuth
1. Buat **OAuth App** di GitHub.
2. Isi callback URL dengan URL `admin.html` Anda, misalnya:
   - `https://username.github.io/repository/admin.html`
3. Deploy salah satu contoh serverless di folder `serverless/`.
4. Simpan secret berikut pada platform serverless:
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
5. Di panel admin, isi:
   - Owner
   - Repository
   - Base Branch
   - GitHub OAuth Client ID
   - OAuth Proxy URL
6. Klik **Simpan Pengaturan**.
7. Klik **Login dengan GitHub**.

## Cloudflare Worker
Contoh Cloudflare Worker ada di:
- `serverless/cloudflare/worker.js`
- `serverless/cloudflare/wrangler.toml.example`

Worker menyediakan endpoint:
- `POST /oauth/exchange`
- `GET /health`

## Netlify Function
Contoh Netlify Function ada di:
- `serverless/netlify/functions/oauth-exchange.mjs`

Anda bisa isi **OAuth Proxy URL** dengan URL function penuh, misalnya:
- `https://nama-site.netlify.app/.netlify/functions/oauth-exchange`

## Cara pakai mode GitHub
1. Upload semua file dari paket ini ke repo Anda.
2. Aktifkan GitHub Pages pada branch yang dipakai.
3. Buka `admin.html`.
4. Login lewat OAuth atau pakai token manual.
5. Muat data repo.
6. Kelola artikel dan media.

## Workflow Pull Request
Pada mode ini:
- CMS membaca dari working branch jika branch tersebut ada
- jika belum ada, CMS akan membuat working branch dari base branch saat penyimpanan pertama
- tombol **Buat / buka Pull Request** akan membuat PR baru atau membuka PR yang sudah ada

## Backup & migrasi
- Gunakan **Export Backup** untuk menyimpan seluruh `site.json`, `posts.json`, dan `media.json`
- Gunakan **Import Backup** untuk memuat kembali data dari file backup
- Setelah import, klik **Sinkronkan semua** agar data tersimpan ke demo mode atau repo GitHub

## Batasan penting
- GitHub Pages tetap bersifat static hosting; OAuth exchange dilakukan lewat endpoint serverless terpisah
- Token akses tetap disimpan di browser Anda setelah login, jadi panel admin paling cocok untuk penggunaan pribadi atau tim kecil yang terpercaya
- Parser Markdown bawaan cukup untuk blog/docs ringan, namun belum selengkap static site generator besar
