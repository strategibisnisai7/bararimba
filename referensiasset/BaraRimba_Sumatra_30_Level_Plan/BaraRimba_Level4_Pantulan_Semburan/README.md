# BaraRimba — Level 4: Pantulan Semburan

## Isi paket
- `reference/`: dua poster referensi visual Level 4.
- `sprites/`: sembilan crop kategori untuk audit arah aset.
- `previews/level4_contact_sheet.jpg`: preview.
- `asset-manifest.json`: objective, daftar kategori, catatan implementasi.
- `reports/visual_qa.json`: status pemeriksaan gambar dan alpha.

## Gameplay
1. Arahkan semburan air ke panel pemantul pertama.
2. Atur sudut panel untuk membelokkan aliran menuju panel kedua.
3. Pantulkan air ke api yang menghalangi mekanisme.
4. Setelah api padam, aktifkan pengunci agar jembatan terbuka.
5. Bantu harimau Sumatra melewati jalur aman menuju bendera.

## Status transparansi
Paket ini adalah referensi visual dan crop kategori. Poster utama merupakan gambar komposit; checkerboard yang tergambar bukan bukti transparansi. Crop belum merupakan sprite individual siap produksi. Perlu sumber aset terpisah, slicing, pembersihan tepi, verifikasi alpha, pivot, collision, dan QA in-engine.

Gunakan aset mobil pemadam BaraRimba yang sudah ada; mobil tidak dibuat ulang.
