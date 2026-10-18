# BaraRimba — Level 5: Bak Air Pengangkat

## Progres kesulitan
Level 5 harus lebih sulit daripada Level 4. Pemain mengelola aliran dan volume air, mengoperasikan dua bak serta katup, mengatur beban batu, dan menentukan kapan memadamkan api sebelum jalur evakuasi dibuka.

## Isi paket
- `reference/level5_full_visual_reference.png`: referensi visual utuh.
- `sprites/`: crop kategori terrain, struktur/pipa, bak air, katup, platform, katrol, api, air, vegetasi, beruang madu, pintu/jalur, dan properti.
- `previews/level5_contact_sheet.jpg`: preview.
- `asset-manifest.json`: spesifikasi misi dan catatan mekanik.
- `reports/visual_qa.json`: pemeriksaan visual dan alpha.

## Urutan gameplay
1. Arahkan semburan untuk mengisi bak pertama.
2. Buka katup agar air mengalir ke bak pengarah.
3. Isi bak kedua hingga platform pengangkat naik.
4. Tempatkan/geser batu ke platform pemberat agar ketinggian stabil.
5. Padamkan api yang menutup jalur.
6. Bebaskan beruang madu dan arahkan ke titik aman.

## Status produksi
Paket ini berisi referensi visual dan crop kategori dari poster, bukan sprite individual final. Checkerboard pada poster bukan bukti transparansi. Sebelum produksi, gunakan sumber sprite individual, slicing manual, verifikasi alpha, pembersihan tepi, penentuan pivot/collision, dan uji dalam engine.

Mobil pemadam tidak dibuat ulang; gunakan aset existing.
