# Gacha Pesan 🎰

Website kecil buat menyembunyikan pesan rahasia di dalam mesin gacha. Penerima memutar tuas, kapsul jatuh, di-tap, lalu pesannya muncul dengan efek ketik.

- Tanpa akun, tanpa server, tanpa database — isi pesan disimpan di bagian `#` pada link.
- Bisa beberapa pesan sekaligus: pisahkan dengan baris kosong, tiap putaran dapat pesan berbeda.
- Mobile-first, HTML/CSS/JS murni (tanpa build step).

## Cara pakai

1. Buka website-nya → isi **Untuk**, **Dari**, dan **Pesan**.
2. Klik **Buat link gacha** → salin / kirim lewat WhatsApp.
3. Penerima buka link → putar tuas → tap kapsul → baca pesan.

## Deploy

**Vercel**: import repo ini di vercel.com → Framework: *Other* → Deploy. Tidak perlu setting apa pun.

**GitHub Pages**: Settings → Pages → Source: *Deploy from a branch* → `main` / root.

**Lokal**: buka `index.html` langsung di browser, atau `npx serve .`

## Struktur

```
index.html   # markup + mesin gacha (SVG)
style.css    # tampilan & animasi
app.js       # logika: buat link, putar gacha, buka kapsul
```
