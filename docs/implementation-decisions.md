# Keputusan implementasi

- Repository awal hanya berisi 21 PNG dalam `referensiasset/`; tidak ada stack aplikasi atau test yang perlu dipertahankan. Phaser 3.90 + TypeScript + Vite dipilih sesuai plan. Matter yang dibundel Phaser adalah satu-satunya sistem collision, tanpa Arcade Physics.
- Pekerjaan dilakukan di checkout lokal `D:/bararimba`, sesuai permintaan implementasi repository. Tidak ada deployment/akun hosting yang dibuat.
- Tidak ada file AGENTS.md ditemukan dalam workspace atau parent `D:/` pada inspeksi awal.
- Gameboard merupakan lembar komposisi/menu/level/sprite, bukan satu level siap pakai. Level 01 mengambil panel jembatan kiri; bukan panel rintangan kayu, kincir, atau tuas.
- `13.png` adalah satu lembar layer Jawa, bukan file terpisah 13A–13E. Tidak ada file 13B–13E ditemukan. Tidak memakai region lain.
- Sprite alpha diuji numerik dan dikompositkan pada latar hijau; warna yang terlihat pada viewer awal adalah RGB tersembunyi di area alpha 0. Tidak perlu penghapusan background berdasarkan warna. Pertahankan alpha asli, kecuali mask polygon eksplisit untuk memisahkan region yang bertumpang tindih, bila dicatat di metadata.
- Potongan aset disimpan terpisah, tidak mengubah sumber; pipeline Pillow hanya crop dan ekspor PNG/WebP. Logo dipotong dari `15.png`, tidak diregenerasi. Sheet bukan atlas animasi dengan frame seragam; api memakai satu sprite transform, bukan klaim animasi frame.
- Dua api dan suplai air terbatas berasal dari komposisi panel. Jumlah air, konsumsi, posisi terukur, kecepatan air, dan intensitas ditetapkan untuk implementasi playable dan terdokumentasi sebagai asumsi.
- Tidak ada props puzzle bergerak pada panel Level 01. Tidak menambahkan batu/peti yang tidak diminta. Dengan demikian impuls dinamis di luar lingkup misi ini.
- Air menggunakan partikel balistik pooled dengan timestep tetap 1/120 detik dan swept collision terhadap geometri body Matter yang sama. Tidak ada engine fisika kedua. Ini menghindari ribuan body air dan tunneling saat tab/frame lambat. Body statis/sensor dipisah dari visual. Air mengenai target terdekat sepanjang lintasan, tidak menembus terrain.
- Renderer mempertahankan koordinat logis tetap, DPR dibatasi maksimum 2. Rincian kompatibilitas dan hasil yang benar-benar diuji akan dicatat dalam `docs/verification.md`.
- Phaser 3.90 tidak memiliki field `GameConfig.resolution`. Karena itu framebuffer diperbesar dengan faktor DPR terbatas, kamera diberi zoom yang sama lalu dipusatkan pada (640,360); input dinormalisasi ke koordinat 1280 × 720. Type definition terpasang dan emulasi DPR 3 memverifikasi framebuffer tetap 2560 × 1440.
- Tidak ada berkas audio sumber. Efek suara pendek sintetis opsional memakai Web Audio setelah gesture pengguna; bukan rekaman/aset audio final.

Referensi API yang diperiksa: [Phaser Scale Manager](https://docs.phaser.io/phaser/concepts/scale-manager), [Matter World](https://docs.phaser.io/api-documentation/3.90.0/class/physics-matter-world). Implementasi tetap diverifikasi dengan type definition yang terpasang.
