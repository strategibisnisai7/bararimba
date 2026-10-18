# BaraRimba — Level 7: Jembatan yang Harus Dijatuhkan

## Peningkatan kesulitan
Level 7 lebih sulit dari Level 6 karena pemain harus mengurutkan pemadaman api, pelepasan pengunci, pergeseran batu pemicu, dan pengendalian momentum jembatan.

## Urutan gameplay
1. Padamkan api yang membakar area pengunci.
2. Semprot batu agar bergeser ke mekanisme pemicu.
3. Lepaskan pengunci pertama, lalu pengunci kedua.
4. Jembatan berayun/turun menggunakan gravitasi dan momentum.
5. Aktifkan stopper agar jembatan berhenti pada sudut yang bisa dilalui.
6. Bantu harimau Sumatra melintasi jembatan menuju titik aman.

## Isi
- `reference/level7_full_visual_reference.png`
- `sprites/`: crop kategori terrain, struktur jembatan, rantai/katrol, api/asap, air, vegetasi, harimau, properti, pintu/jalur.
- `previews/level7_contact_sheet.jpg`
- `asset-manifest.json`, `README.md`, dan laporan QA.

## Status produksi
Paket ini merupakan referensi visual dengan crop kategori, bukan sprite individual transparan final. Pola checkerboard pada poster bukan bukti transparansi. Aset individual perlu slicing, verifikasi alpha, edge cleanup, pivot/collision dan pengujian di engine.

Mobil pemadam tidak dibuat ulang.
