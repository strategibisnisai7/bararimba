# Audit aset Level 01

Inspeksi 17 Oktober 2026. Ditemukan 21 PNG: `1.png` sampai `20.png` dan `Game Board.png`. Dimensi, ukuran file, SHA-256, statistik alpha, isi, status inspeksi, rectangle dan pivot lengkap di `asset-manifest.json`.

## Temuan

- Gameboard 1536 × 1024 RGB, tanpa alpha; berisi beberapa layar dan contoh level. Panel Level 1 hanya 384 × 288 sehingga tidak cocok menjadi background fullscreen.
- Sheet 1–12, 14–16, 18–20 berukuran 1536 × 1024. Sheet 13: 1671 × 941; sheet 17: 1672 × 941.
- Semua sheet bernomor punya kanal RGBA. Mayoritas alpha maksimum 254; ini bukan bukti bahwa seluruh background opaque. Penghitungan histogram serta komposit latar hijau membuktikan alpha 0 di ruang antarobjek. RGB tersembunyi masih berwarna, sehingga beberapa image viewer tampak menunjukkan background penuh.
- Sheet 6 memiliki alpha minimum 4, jadi tidak siap dipakai tanpa audit lebih jauh. Tidak digunakan.
- Sheet relevan 1, 2, 3, 4, 5, 11, 13, 15 dan gameboard dibuka penuh. Sheet lainnya dilihat dalam contact sheet saja; belum diverifikasi untuk produksi atau urutan animasi.
- Tidak ditemukan checkerboard palsu pada crop produksi yang diperiksa. Render desktop 1280 × 720 dan mobile landscape diperiksa. Fragmen pohon/daun dari objek tetangga pada crop dipisahkan dengan mask geometris eksplisit; alpha dan warna tepi objek utama dipertahankan.
- Sheet 13 memuat layer Jawa yang memang terpisah vertikal; beberapa awan/bukit/terrain bertumpang tindih. Polygon manual memisahkan region yang digunakan, tanpa menghapus warna highlight. Polygon tersimpan dalam manifest.
- Sprite berbeda dari grid animasi reguler. Tidak ada urutan frame yang diklaim telah siap. Fire memakai transform ringan, smoke dan splash memakai pooling.
- Logo asli di sheet 15 dipotong; tidak digambar atau dibuat ulang. Truck asli sheet 1 menghadap kanan.
- Segmen meriam sheet 2 direuse empat kali pada ukuran berbeda. Pivot kiri/kanan terukur (33,47)/(270,50) pada crop 328 × 91; source axis miring 0,73° dikoreksi saat rig dirender. Nozzle pivot (12,43), outlet (143,51). Semua diberi metadata.

## Produksi

`python scripts/prepare_assets.py` (Pillow diperlukan) menghasilkan 19 aset WebP, sekitar 713 KiB total, di `public/assets/`, tanpa menulis ke sumber. Gunakan `--only tree-large bridge` untuk mengekspor ulang sprite tertentu. Hasil disimpan atomik sebelum mengganti crop produksi agar preview tidak membaca berkas setengah jadi. Aset produksi hasil slicing sudah disertakan; pengguna tidak harus memasang Python untuk memainkan game. Canvas tidak memakai referensi sheet besar secara langsung. Koordinat logis 1280 × 720; sprite truk memakai skala 0,48, api maksimum sekitar 0,69, pohon kecil kanan maksimum 1,5 dan jembatan 1,37. Tidak ada atlas raster besar yang diperbesar menjadi background statis.

## Gap dan batas

- Tidak ada audio tersedia; efek Web Audio sintetis adalah suara sementara.
- Bentuk lengkap empat segmen sebagai rig siap produksi tidak tersedia; joint/anchor ditetapkan dari potongan segmen nyata.
- Background langit, bidang sungai dan efek air kecil adalah geometri prosedural yang mendukung sprite asli; bukan klaim aset raster final dari batch.
- Belum ada master rig/animasi berframe atau pemisahan canopy dari trunk. Sway diterapkan sangat kecil pada pohon dekoratif utuh.
- Tidak ada file region 13A–13E terpisah. Label Jawa dipilih dari isi lanskap sheet 13 dan permintaan plan.
