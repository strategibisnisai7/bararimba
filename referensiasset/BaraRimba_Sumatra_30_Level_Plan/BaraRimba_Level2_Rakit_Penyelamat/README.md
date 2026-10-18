# BaraRimba — Misi 2: Rakit Penyelamat

## Output
- `reference/level2_full_gameplay_reference.png`: tampilan gameplay utuh untuk referensi layout.
- `sprites/sprite_sheet_source_rgba.png`: sprite sheet sumber RGBA.
- `sprites/*/*_category_sheet.png`: crop sprite sheet per kategori.
- `previews/level2_contact_sheet.jpg`: preview referensi dan sheet.
- `asset-manifest.json`: deskripsi misi, kategori, dan catatan implementasi.
- `reports/alpha_qa.json`: hasil pemeriksaan kanal alpha.

## Misi
Dorong rakit dengan semburan air, kendalikan momentum di arus sungai bawah tanah, padamkan api penghalang, lalu arahkan tapir ke titik aman.

## Status produksi
Sprite sheet memiliki kanal alpha dengan piksel transparan, tetapi tepi/halo masih perlu pemeriksaan visual. Crop kategori belum menjadi sprite individual yang semuanya terisolasi. Karena itu paket ini adalah **paket referensi dan slicing awal**, bukan klaim bahwa semua sprite sudah siap produksi penuh.

## Integrasi Codex
1. Audit `previews/level2_contact_sheet.jpg`.
2. Slice objek individual dan bersihkan tepi.
3. Tetapkan pivot, collision, dan state animasi.
4. Implementasikan gaya dorong air, momentum rakit, tali/katrol, api, serta jalur penyelamatan tapir.
5. Uji bahwa rakit bisa berhenti di titik tujuan dan jalur evakuasi benar-benar bisa diselesaikan.

Mobil pemadam tidak dibuat ulang; gunakan aset mobil BaraRimba yang sudah ada.
