# BaraRimba — Level 8: Bendungan Gambut

## Peningkatan kesulitan
Level 8 lebih sulit daripada Level 7 karena pemain mengatur dua jalur air, dua pintu air, tinggi air pada dua cekungan, dan dua titik api. Luapan memengaruhi batu dan platform sehingga urutan tindakan penting.

## Urutan gameplay
1. Arahkan semburan ke saluran utama.
2. Buka pintu air kiri untuk memadamkan api pertama.
3. Atur pintu air kanan untuk memadamkan api kedua.
4. Jaga tinggi air agar platform tidak terangkat/terendam berlebihan.
5. Kendalikan luapan agar mendorong batu ke posisi pemicu.
6. Buka jalur akhir dan pastikan tidak ada api tersisa.
7. Selamatkan rusa Sumatra ke titik aman.

## Isi
- `reference/level8_full_visual_reference.png`
- `sprites/`: crop kategori terrain, bendungan, saluran/pintu air, platform/katrol, api/air, vegetasi rawa, rusa, properti, pintu/jalur.
- `previews/level8_contact_sheet.jpg`
- `asset-manifest.json`, `README.md`, `reports/visual_qa.json`.

## Status produksi
Paket ini adalah referensi visual dan crop kategori, bukan sprite individual transparan final. Poster mengandung panel dan teks; checkerboard yang terlihat bukan bukti transparansi. Untuk produksi, lakukan slicing individual, verifikasi alpha, edge cleanup, pivot/collision, dan uji di engine.

Mobil pemadam tidak dibuat ulang.
