# BaraRimba — Level 3: Katrol dan Beban Ganda

## File
- `reference/level3_visual_reference_poster.png`: referensi visual utama.
- `reference/level3_alternate_visual_reference.png`: referensi alternatif dengan variasi komposisi.
- `sprites/`: crop kategori dari bagian showcase poster.
- `previews/level3_contact_sheet.jpg`: preview utama.
- `asset-manifest.json`: tujuan misi, daftar crop, dan catatan implementasi.
- `reports/visual_asset_qa.json`: laporan status gambar dan transparansi.

## Misi
Dorong batu dengan semburan air ke platform pemberat. Perubahan keseimbangan dua beban mengangkat platform penyelamatan. Padamkan api yang menghalangi, lalu arahkan orangutan ke titik aman.

## Status transparansi dan produksi
Paket ini adalah paket referensi visual. Gambar poster dan crop kategori masih mengandung panel, label, atau komposisi dari poster. Checkerboard yang tampak di poster bukan bukti transparansi. **Belum ada klaim bahwa crop ini adalah sprite individual siap produksi atau PNG transparan bersih.**

## Implementasi Codex
1. Gunakan gambar referensi untuk layout visual.
2. Pisahkan aset secara individual dari sumber gambar aset asli, bukan dari poster yang berisi teks/panel.
3. Siapkan sprite individual PNG RGBA dengan alpha yang diverifikasi.
4. Definisikan pivot, collision, mass, pulley constraint, platform states, dan animation metadata.
5. Uji urutan: semburan air -> batu ke pemberat -> keseimbangan beban -> platform naik -> api padam -> orangutan ke area aman.

Mobil pemadam tidak dibuat ulang.
