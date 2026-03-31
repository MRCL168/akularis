# Serverless OAuth proxy

Paket ini menyertakan dua contoh endpoint untuk menukar `code` OAuth GitHub menjadi access token tanpa menaruh `client_secret` di frontend:

- `cloudflare/worker.js`
- `netlify/functions/oauth-exchange.mjs`

## Cloudflare Workers
1. Install Wrangler.
2. Salin `wrangler.toml.example` menjadi `wrangler.toml`.
3. Set secret:
   - `wrangler secret put GITHUB_CLIENT_ID`
   - `wrangler secret put GITHUB_CLIENT_SECRET`
4. Deploy:
   - `wrangler deploy`
5. Masukkan URL worker ke field **OAuth Proxy URL** di panel admin.

Endpoint yang dipakai frontend:
- `POST /oauth/exchange`
- `GET /health`

## Netlify Functions
1. Simpan file function di project Netlify Anda.
2. Tambahkan environment variable:
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
3. Gunakan URL function sebagai proxy, misalnya:
   - `https://nama-site.netlify.app/.netlify/functions/oauth-exchange`

Untuk Netlify, frontend saat ini mengharapkan suffix `/oauth/exchange`, jadi paling mudah adalah menaruh reverse proxy / rewrite ke function tersebut, atau ubah kecil pada `assets/js/utils.js` bila ingin langsung ke path function.
