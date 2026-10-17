# Level 01 — Hutan dan Jembatan Jawa

## Sumber dan batas desain

Sumber visual: `referensiasset/Game Board.png`, panel gameplay kiri pada rectangle [0, 440, 384, 288]. Truk tetap menghadap kanan di tebing kiri; jembatan melintasi sungai; satu api di ujung jembatan dan satu di tanah lebih tinggi di kanan. Nama Jawa mengikuti execution plan dan lanskap gunung/hutan dari `13.png`; gameboard mencampur beberapa contoh region. Bukan rekonstruksi piksel persis dari panel 384 px yang akan pecah bila diperbesar.

Peta Indonesia, satwa, bintang, timer, inventori, kendaraan bergerak, tuas, kincir, peti, dan penghancuran jembatan tidak masuk misi ini. Contoh puzzle tersebut terlihat pada panel level lain. Tidak ada objek dinamis yang perlu impuls pada Level 01.

## Ruang permainan

Koordinat logis 1280 × 720, y positif ke bawah. Seluruh level terlihat tanpa scroll. Terrain kiri: x 0–440, permukaan y 548. Jembatan: x 432–991, y 534,5. Tebing kanan: x 980–1280, permukaan y 428. Sungai: y 603–720. Truk berada di kiri, roda pada y 548. Pivot meriam pertama di (226, 389).

Api A di (811, 535), api B di (1100, 428); tinggi visual sekitar 129 px pada intensitas penuh. Collider api berupa sensor terpisah dari sprite. Terrain dan jembatan adalah body statis Matter. Meriam bersifat rig visual/kinematik, tidak perlu body dinamis.

## Objektif dan hasil

- Menang: kedua api mencapai intensitas 0.
- Air: 100 unit; berkurang hanya saat menyemprot. Bar air memang terlihat pada gameboard. Nilai kapasitas dan konsumsi merupakan parameter implementasi yang ditetapkan untuk misi ini, bukan data yang tertulis pada gambar.
- Kalah: air habis, semua tetesan yang sedang melayang sudah selesai, dan masih ada api. Tetesan terakhir tetap dapat memenangkan level.
- Api tidak menyebar dan tidak tumbuh kembali. Tidak ada batas waktu/nyawa/skor/bintang.
- Ulangi mengembalikan seluruh api, air, rig, dan partikel ke kondisi awal.

Parameter awal: masing-masing api memiliki intensitas 100; satu tetesan mengurangi 0,8. Emisi 68 tetesan/detik, konsumsi 7,5 unit air/detik, kecepatan awal 800 px/detik, gravitasi air 580 px/detik². Timestep 1/120 detik. Pool maksimum 180 tetesan, 128 percikan, dan 28 puff asap/uap. Angka ini ditetapkan untuk vertical slice; bukan angka yang terbaca dari gameboard. Kemenangan memiliki prioritas terhadap air habis dan tetesan tersisa dibersihkan sesudah kemenangan.

## Alur dan kontrol

Menu → petunjuk singkat → gameplay → hasil → ulangi/menu. Pause berisi lanjutkan, ulangi, petunjuk, suara, dan kembali ke menu.

Mouse: gerakkan/drag pada area dunia untuk membidik; tahan tombol Semprot atau Space. Sentuh: drag satu jari untuk membidik, tahan Semprot dengan jari lain. Keyboard: panah kiri/kanan mengubah bidikan horizontal; atas/bawah mengubah elevasi; Space menyemprot; Escape/P menjeda. Semua panel menggunakan tombol DOM yang bisa difokuskan.

Target bidik dibatasi x 420–1220, y 150–590. Empat segmen berturut-turut memakai panjang 68, 58, 48, 38 px dan batas sudut dunia yang dicatat dalam `src/entities/Cannon.ts`. Nozzle mengikuti segmen keempat. Titik aim menunjukkan arah meriam; lintasan titik membantu pemain memperhitungkan gravitasi (bukan auto-target).

## Perangkat dan animasi

Landscape 16:9, fit/letterbox tanpa stretch. Overlay portrait menghentikan simulasi; kembali landscape meminta lanjutkan. Blur/tab tersembunyi menjeda dan melepas tembakan. Resize mempertahankan state.

Api berdenyut sesuai intensitas, asap naik, uap muncul hanya saat terkena air, percikan terjadi pada collision. Riak sungai, sway pohon kecil dan parallax berbasis bidikan memakai potongan sumber yang berbeda. Truk dan jembatan tetap, sesuai desain. Efek dekoratif dibatasi dan dikurangi pada framerate rendah; aturan air/api tidak berubah.
