# BaraRimba — Level 6: Kincir Arus Goa

## Peningkatan kesulitan
Level 6 lebih kompleks daripada Level 5. Pemain perlu mengatur debit dan arah air, menjaga kincir mencapai ambang putaran, lalu memanfaatkan mekanisme yang aktif hanya selama momentum cukup.

## Urutan gameplay
1. Arahkan semburan ke saluran pertama.
2. Atur gate agar aliran memutar kincir.
3. Pertahankan aliran sampai kincir mencapai ambang putaran.
4. Kincir menarik rantai dan mengaktifkan mekanisme pembuka jalur.
5. Geser batu dan padamkan api penghalang.
6. Selamatkan orangutan ke titik aman.

## Isi
- `reference/level6_full_visual_reference.png`
- `sprites/`: crop kategori terrain, saluran, kincir, platform/katrol, api/air, vegetasi, orangutan, properti, jalur/pintu.
- `previews/level6_contact_sheet.jpg`
- `asset-manifest.json`, `README.md`, dan `reports/visual_qa.json`.

## Transparansi dan produksi
Paket ini adalah referensi visual dengan crop kategori, bukan sprite individual final. Poster memiliki panel dan teks; pola checkerboard bukan bukti transparansi. Sprite individual masih perlu dislicing dari sumber aset yang bersih, verifikasi alpha, edge cleanup, pivot/collision, dan pengujian engine.

Mobil pemadam tidak dibuat ulang.
