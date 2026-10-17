# Verifikasi Level 01 ? 17 Oktober 2026

Level 01 playable dan sudah diuji sampai menang maupun kalah. Tidak ada blocker implementasi untuk lingkup dua api, truk tetap, dan jembatan tetap.

## Build dan pengujian

| Pemeriksaan | Hasil |
| --- | --- |
| `npm run typecheck` saat vertical slice siap | Lulus setelah koreksi tipe API Phaser. |
| `npm run build` pada implementasi akhir | Lulus: TypeScript dan build produksi Vite. |
| `npm test` | 7 lulus; 1 gagal karena selector test memilih dua tombol Ulangi level. |
| `npm test -- --grep 'pause, focus loss'` setelah selector dibatasi ke dialog | 1 lulus. Total 8 skenario telah lulus; suite penuh tidak diulang tanpa kebutuhan. |
| Playthrough versi produksi melalui `npm run preview` | HTTP 200; kedua api padam; hasil menang muncul dengan 63% air pada percobaan ini; tidak ada error browser. |
| Diagnostik development di produksi | `window.__BARARIMBA__` bernilai undefined. |
| SHA-256 sumber terhadap manifest audit | 21/21 PNG sesuai; sumber tidak diubah. |

Build menghasilkan JavaScript 1.511,42 kB (350,57 kB gzip), CSS 13,11 kB (3,91 kB gzip), dan HTML 1,25 kB. Vite mengeluarkan **peringatan chunk >500 kB** karena engine Phaser dibundel bersama game. Ini bukan kegagalan build. Ada 19 sprite WebP sekitar 713 KiB total; PNG referensi sekitar puluhan MB tidak masuk build. Dua koreksi crop terakhir pada pohon/jembatan disalin ke `dist/` beserta metadata tanpa mengulang kompilasi kode yang tidak berubah; kesamaan seluruh aset public/dist diverifikasi dengan hash.

Delapan skenario yang diuji:

1. Tetesan cepat tidak menembus jembatan tipis untuk mencapai api di belakangnya.
2. Sensor api yang padam tidak lagi menghalangi air; permukaan solid berikutnya tetap terdeteksi.
3. Tumbukan diagonal, parallel miss, dan segmen panjang nol stabil.
4. Menu ? tutorial ? empat pivot berubah ? air memadamkan dua api ? menang ? retry ? menu. Jumlah body tetap 6, pool air maksimum 180.
5. Keyboard aim, pause, pelepasan Space, focus loss, pengaturan suara, petunjuk, resume, dan restart mempertahankan/reset state dengan benar.
6. Air habis menunggu semua tetesan yang melayang selesai sebelum kalah; retry memulihkan air/api/efek.
7. Kegagalan memuat aset menampilkan petunjuk pemulihan, bukan memulai scene rusak.
8. Dua sentuhan browser melalui Chrome DevTools Protocol: bidik dan tembak serentak, drag saat menembak, touch cancel, landscape/portrait, DPR cap, state tetap, dan kontrol tetap masuk viewport.

## Browser dan pengukuran

- Windows; Node.js 22.20.0; Vite 6.4.4; TypeScript 5.9.3; Phaser 3.90.0; Playwright 1.64.1.
- Google Chrome **155.0.8059.84**, headless, desktop 1280 ? 720.
- Emulasi mobile 844 ? 390 / 390 ? 844, sentuhan dan DPR perangkat 3. Framebuffer terukur **2560 ? 1440**, maksimum DPR 2.
- Sampel 5 detik saat menyemprot: 300 interval RAF, rerata **16,66 ms**, P95 **16,80 ms**; 133 tetesan aktif dan 6 body Matter pada snapshot. Efek tidak perlu diturunkan pada sampel ini. Detail: [browser-metrics.json](browser-metrics.json).
- Sampel headless ini diambil dalam sesi yang juga menjalankan build; bukan benchmark perangkat pengguna atau jaminan 60 FPS pada HP.
- Hasil smoke produksi: [production-smoke.json](production-smoke.json).

Screenshot diperiksa untuk menu, tutorial, gameplay, hasil menang, dan kedua orientasi mobile: [menu](screenshots/menu.png), [gameplay](screenshots/gameplay.png), [menang](screenshots/production-win.png), [landscape](screenshots/mobile-landscape.png), [portrait](screenshots/mobile-portrait.png). Slicing akhir dicek kembali pada render, termasuk tepi pohon dan bagian bawah jembatan.

## Keterbatasan yang masih berlaku

- Belum diuji pada HP Android/iPhone fisik, Safari, atau Firefox. Belum ada pengukuran baterai/panas/performa HP. Emulasi bukan pengganti pengujian perangkat nyata.
- Suara berupa cue Web Audio sintetis sementara; tidak ada sumber audio dalam referensi. Toggle diuji, tetapi kualitas audio belum dinilai melalui pendengaran pada perangkat.
- Api, asap, dan pohon memakai transform/efek pooled; sumber bukan atlas animasi berframe. Polygon pemisahan beberapa layer masih merupakan batas artistik crop dari lembar referensi, bukan master aset terpisah.
- Sky, river plane, lintasan air dan ikon kontrol menggunakan geometri prosedural. Truk, meriam, logo, terrain, api dan scenery menggunakan potongan aset asli.
- Tidak ada props puzzle dinamis pada panel Level 1. Impuls kayu/peti/tuas tidak termasuk lingkup misi ini.
- Progres bertahan selama resize/pause pada halaman yang sama; reload memulai ulang. Tidak ada backend, deployment, atau packaging Android pada lingkup ini.
