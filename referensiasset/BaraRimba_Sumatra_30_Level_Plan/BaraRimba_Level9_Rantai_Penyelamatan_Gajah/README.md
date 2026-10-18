# BaraRimba — Level 9: Rantai Penyelamatan Gajah

## Peningkatan kesulitan
Level 9 lebih sulit daripada Level 8. Urutan tindakan sangat penting: api harus dipadamkan sebelum kayu penopang dipindahkan. Salah urutan mengubah keadaan arena, tetapi harus ada jalur pemulihan agar pemain tidak terkunci permanen.

## Urutan gameplay
1. Padamkan api yang membakar kayu penopang rantai.
2. Lepaskan pengunci setelah kayu aman.
3. Turunkan batang kayu berengsel menjadi jembatan sementara.
4. Dorong batu ke cekungan pemicu untuk mengaktifkan katrol.
5. Pastikan platform/jalur akhir stabil dan api sudah padam.
6. Selamatkan anak gajah Sumatra ke titik aman.

## Isi
- `reference/level9_full_visual_reference.png`
- `sprites/`: crop kategori terrain, kayu/rantai, mekanisme/platform, api/air, vegetasi, anak gajah, properti, batu/dinding, pintu/jalur.
- `previews/level9_contact_sheet.jpg`
- `asset-manifest.json`, `README.md`, `reports/visual_qa.json`.

## Status produksi
Paket ini adalah referensi visual dan crop kategori, bukan sprite individual transparan final. Poster memiliki panel/teks; checkerboard bukan bukti transparansi. Perlu slicing per objek, verifikasi alpha, pembersihan tepi, pivot/collision dan QA di engine.

Mobil pemadam tidak dibuat ulang.
