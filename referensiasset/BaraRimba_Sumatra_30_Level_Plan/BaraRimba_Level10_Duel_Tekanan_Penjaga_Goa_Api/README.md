# BaraRimba — Level 10: Duel Tekanan — Penjaga Goa Api

## Puncak kesulitan Sumatra
Level 10 adalah boss finale dan harus lebih sulit dari Level 9. Tantangan menggabungkan tekanan air, momentum proyektil, perlindungan batu, dua mekanisme arena, serta penyelamatan satwa yang tetap aktif selama duel.

## Urutan gameplay
1. Amati telegraph serangan bos dan hindari bola api pertama.
2. Gunakan semburan air bertekanan untuk menahan/membelokkan proyektil.
3. Aktifkan katup kiri untuk memadamkan api bawah.
4. Arahkan aliran ke turbin/gear untuk membuka jembatan atau platform.
5. Gunakan batu pelindung untuk menahan bola api dan mengaktifkan pengunci.
6. Bertahan dari pola serangan fase kedua.
7. Aktifkan mekanisme kedua untuk membuka pelindung inti api.
8. Gunakan semburan kontinu pada inti api sampai bos kalah.
9. Pastikan jalur aman dan selamatkan orangutan ke titik tujuan.

## Isi
- `reference/level10_full_visual_reference.png`
- `sprites/`: crop kategori terrain lava, struktur kayu/baja, gear, saluran/katup, api/lava, formasi goa, penjaga goa, properti fisika, pintu/jalur.
- `previews/level10_contact_sheet.jpg`
- `asset-manifest.json`, `README.md`, `reports/visual_qa.json`.

## Fairness & physics
- Boss memberi telegraph sebelum proyektil dilontarkan.
- Semburan air punya meter tekanan dan pemulihan yang terlihat.
- Bola api bisa ditahan/dibelokkan sesuai sudut dan momentum; jangan menjadikannya adu tembak biasa.
- Fase bos punya cooldown dan hitbox yang jelas.
- Satwa baru dievakuasi setelah arena aman.

## Status produksi
Paket ini adalah referensi visual dan crop kategori, bukan sprite individual transparan final. Poster mengandung panel/teks; pola checkerboard bukan bukti transparansi. Aset individual masih perlu slicing, verifikasi alpha, edge cleanup, pivot/collision, animasi, dan QA di engine.

Mobil pemadam tidak dibuat ulang.
