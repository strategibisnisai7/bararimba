# BaraRimba — Level 01: Hutan & Jembatan Jawa

Game browser satu level dengan Phaser 3, TypeScript, Vite, dan geometri collision Matter.js. Bidik meriam empat sambungan dan padamkan dua titik api sebelum cadangan air habis.

## Menjalankan

Node.js 22 dan npm diperlukan. Dari folder proyek:

```powershell
npm install
npm run dev
```

Buka URL lokal yang dicetak Vite, biasanya `http://127.0.0.1:5173`. Untuk menguji melalui HP di jaringan lokal yang sama, jalankan `npm run dev -- --host 0.0.0.0`, lalu akses alamat IP komputer pada port yang dicetak Vite. Firewall dan jaringan harus mengizinkan koneksi tersebut.

```powershell
npm run typecheck
npm test
npm run build
npm run preview
```

`npm test` menggunakan Google Chrome yang terpasang (`channel: chrome` dalam `playwright.config.ts`). Bila Chrome belum ada, pasang browser yang sesuai atau ganti channel ke Chromium Playwright lalu jalankan `npx playwright install chromium`. Build produksi dihasilkan di `dist/`; sajikan melalui HTTP, jangan membuka `index.html` dengan `file://`.

## Kontrol

| Perangkat | Bidik | Semprot | Jeda |
| --- | --- | --- | --- |
| Mouse | Gerakkan/drag pada area hutan | Tahan tombol Semprot atau Space | Tombol jeda, Escape, atau P |
| Keyboard | Tombol panah | Tahan Space | Escape atau P |
| Sentuh | Drag satu jari pada area hutan | Tahan Semprot dengan jari lain | Tombol jeda |

Landscape menjadi orientasi utama. Portrait dan kehilangan fokus otomatis menjeda; kembali ke gameplay melalui **Lanjutkan misi**. Tidak ada autosave antar-reload; progres dipertahankan saat resize dan selama tab tetap terbuka.

## Aset dan desain

- `referensiasset/`: 21 PNG sumber, tidak diubah.
- `public/assets/`: 19 potongan WebP produksi dan metadata sprite. Logo asli dipertahankan.
- Kampanye Sumatra (level 2-1 … 2-10, id 16–25): sumber di `referensiasset/BaraRimba_Sumatra_30_Level_Plan/`, sprite di `public/assets/sumatra/` dibuat oleh `python scripts/prepare_sumatra.py` (Pillow, numpy, scipy). Audit, pemetaan aset, kekurangan dan status: [docs/sumatra-integration.md](docs/sumatra-integration.md).
- `scripts/prepare_assets.py`: slicing yang dapat diulang; memerlukan Pillow (`python -m pip install Pillow`). Hanya diperlukan untuk mengubah atau menyiapkan ulang aset; bukan syarat menjalankan game.
- [Audit aset](docs/asset-audit.md), [manifest](docs/asset-manifest.json), [spesifikasi level](docs/level-01-jawa.md), [keputusan implementasi](docs/implementation-decisions.md), [hasil verifikasi](docs/verification.md).

Air memakai pool maksimum 180 tetesan, timestep 1/120 detik, dan collision sepanjang perpindahan terhadap vertex body Matter. Api memiliki sensor dan intensitas terpisah dari sprite. Truk/jembatan tetap sesuai panel Level 1; tidak ada puzzle dinamis atau satwa sebagai objektif. Efek suara sintetis bersifat sementara karena sumber tidak menyertakan audio.

`src/scenes/` mengatur alur dan lingkungan (`Sumatra.ts`: mekanisme Sumatra); `entities/` menyimpan rig meriam; `systems/` mengelola air, api, efek dan suara; `physics/` menyimpan swept collision; `ui/` mengelola panel serta kontrol DOM.

Diagnostik baca-saja `window.__BARARIMBA__.snapshot()` tersedia hanya pada development untuk verifikasi. Test memainkan level melalui input browser, tanpa mengubah HP, air, atau state secara langsung. Build produksi tidak mengekspos diagnostik ini.
