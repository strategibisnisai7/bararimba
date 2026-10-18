# BaraRimba — Kampanye Sumatra 30 Level

**Keputusan:** 30 level, dibagi menjadi 10 kelompok misi × 3 level.

## Aturan produksi
- Lanjutkan repository game Jawa yang sudah berjalan; jangan membuat game paralel.
- Reuse mobil pemadam, semburan air, pemadaman api, fisika, kamera, HUD, pause, win/lose, dan reset yang sudah ada.
- Utamakan variasi layout, posisi, massa, sudut, urutan, timing, kondisi mekanisme, dan target penyelamatan.
- Sprite baru hanya dibuat jika aset modular yang tersedia tidak cukup.
- Sumatra harus berbeda secara visual dari Jawa: goa karst, sungai bawah tanah, hutan hujan, akar besar, rawa gambut dan satwa Sumatra.
- Setiap level harus punya solusi yang dapat diuji, jalur evakuasi yang valid, dan reset yang mengembalikan semua state.

## Daftar 30 level

### Misi 1 — Goa Sumatra — Penyelamatan Anak Gajah
- **Bioma:** Goa karst, akar hutan hujan, sungai bawah tanah
- **Satwa:** Anak gajah Sumatra

**Level 1: Batu Pembuka** — Mudah
- Tujuan: Dorong satu batu dengan semburan untuk membuka pintu goa.
- Aset inti: batu_fisika, pintu_batu, api, anak_gajah
- Fokus: Mengenal dorongan air dan benda dinamis.

**Level 2: Akar Penyangga** — Mudah-menengah
- Tujuan: Padamkan api pada akar, lalu dorong batu agar akar yang menghalangi turun menjadi pijakan.
- Aset inti: akar, batu_fisika, api, anak_gajah
- Fokus: Urutan pemadaman sebelum menggeser penghalang.

**Level 3: Jalur Runtuh** — Menengah
- Tujuan: Gunakan semburan untuk memindahkan dua batu dalam urutan tepat; satu batu menjadi stopper agar jalur tidak runtuh.
- Aset inti: batu_fisika, kayu_berengsel, stopper, anak_gajah
- Fokus: Konsekuensi fisika dengan solusi pemulihan.

### Misi 2 — Rakit Penyelamat
- **Bioma:** Sungai bawah tanah, tebing karst, air terjun
- **Satwa:** Tapir

**Level 4: Rakit Mulai Bergerak** — Mudah
- Tujuan: Dorong rakit kosong ke tepian aman dengan semburan air.
- Aset inti: rakit, arus, batu
- Fokus: Belajar arah gaya dan momentum.

**Level 5: Beban di Atas Rakit** — Menengah
- Tujuan: Geser batu ke rakit agar draft dan keseimbangannya berubah; kendalikan rakit supaya tidak menabrak dinding.
- Aset inti: rakit, batu_fisika, arus, tapir
- Fokus: Momentum dan distribusi beban.

**Level 6: Arus Berlawanan** — Sulit
- Tujuan: Atur dua dorongan dari posisi berbeda untuk melewati pusaran dan berhenti di dermaga penyelamatan.
- Aset inti: rakit, arus, pilar_batu, tapir
- Fokus: Timing, momentum, dan pengereman.

### Misi 3 — Katrol dan Beban Ganda
- **Bioma:** Tebing hutan dan ruang goa
- **Satwa:** Orangutan Sumatra

**Level 7: Katrol Pertama** — Mudah-menengah
- Tujuan: Dorong satu batu ke platform pemberat untuk mengangkat jembatan pendek.
- Aset inti: katrol, tali, batu, platform
- Fokus: Pengenalan hubungan beban dan platform.

**Level 8: Dua Beban Berbeda** — Menengah
- Tujuan: Pilih batu yang tepat untuk sisi katrol agar platform berhenti pada ketinggian sasaran.
- Aset inti: katrol, dua_beban, platform, orangutan
- Fokus: Membandingkan berat dan posisi.

**Level 9: Keseimbangan Kritis** — Sulit
- Tujuan: Atur dua beban dan geser stopper agar platform stabil sementara api di jalur dipadamkan.
- Aset inti: katrol_ganda, stopper, batu, api, orangutan
- Fokus: Keseimbangan ditambah urutan tindakan.

### Misi 4 — Pantulan Semburan
- **Bioma:** Celah batu, air terjun, ruang goa
- **Satwa:** Harimau Sumatra

**Level 10: Sudut Pertama** — Menengah
- Tujuan: Putar satu panel agar semburan mencapai api di balik dinding.
- Aset inti: panel_pemantul, api, harimau
- Fokus: Belajar sudut pantulan.

**Level 11: Dua Pantulan** — Menengah-sulit
- Tujuan: Atur dua panel dengan sudut berbeda untuk memadamkan api dan membuka pengunci.
- Aset inti: dua_panel_pemantul, api, pengunci
- Fokus: Rantai sudut dan target.

**Level 12: Pantulan Bergerak** — Sulit
- Tujuan: Gunakan panel yang terayun dan timing semburan untuk mengenai target saat terbuka.
- Aset inti: panel_berengsel, api, pengunci, harimau
- Fokus: Akurasi dan timing tanpa pixel-perfect aim.

### Misi 5 — Bak Air Pengangkat
- **Bioma:** Goa lembap, pipa kayu, bak penampung
- **Satwa:** Beruang madu

**Level 13: Isi Bak** — Menengah
- Tujuan: Isi satu bak sampai platform mencapai ketinggian yang dibutuhkan.
- Aset inti: bak_air, platform_lift, katup
- Fokus: Air sebagai beban.

**Level 14: Dua Bak dan Katup** — Sulit
- Tujuan: Atur urutan katup untuk mengalirkan air ke bak kedua tanpa kehilangan tinggi air pertama.
- Aset inti: dua_bak, katup, pipa, platform_lift
- Fokus: Pengelolaan volume dan urutan.

**Level 15: Beban Penyeimbang** — Sulit
- Tujuan: Kombinasikan volume air dan batu penyeimbang agar platform berhenti di antara dua batas.
- Aset inti: dua_bak, batu, katrol, platform_lift, beruang_madu
- Fokus: Kontrol presisi dengan beberapa variabel.

### Misi 6 — Kincir Arus Goa
- **Bioma:** Goa berarus, air terjun, saluran batu
- **Satwa:** Orangutan Sumatra

**Level 16: Putar Kincir** — Menengah
- Tujuan: Arahkan aliran ke kincir hingga mencapai ambang putaran untuk membuka pintu.
- Aset inti: kincir, saluran, pintu
- Fokus: Hubungan aliran dan putaran.

**Level 17: Atur Debit** — Sulit
- Tujuan: Atur katup agar kincir tidak terlalu lambat atau terlalu cepat ketika menarik rantai.
- Aset inti: kincir, katup, rantai, platform
- Fokus: Debit dan momentum berkelanjutan.

**Level 18: Putaran Berantai** — Sangat sulit
- Tujuan: Jaga kincir tetap berputar sambil mengalihkan sebagian aliran untuk memadamkan api.
- Aset inti: kincir, dua_saluran, katup, api, orangutan
- Fokus: Trade-off antara mekanisme dan pemadaman.

### Misi 7 — Jembatan yang Harus Dijatuhkan
- **Bioma:** Jurang hutan, sungai bawah tanah, akar besar
- **Satwa:** Harimau Sumatra

**Level 19: Lepas Pengunci** — Menengah
- Tujuan: Padamkan api di pengunci lalu lepaskan jembatan ke posisi melintang.
- Aset inti: jembatan_berengsel, pengunci, api
- Fokus: Gravitasi dan urutan.

**Level 20: Ayunan Jembatan** — Sulit
- Tujuan: Atur pelepasan dan stopper agar jembatan tidak berayun melewati titik lintas.
- Aset inti: jembatan_berengsel, stopper, rantai
- Fokus: Momentum dan batas sudut.

**Level 21: Jembatan Berantai** — Sangat sulit
- Tujuan: Geser batu sebagai penahan, lepaskan dua pengunci dalam urutan tepat, lalu stabilkan jembatan.
- Aset inti: jembatan_segmen, dua_pengunci, batu, harimau
- Fokus: Beberapa mekanisme dan solusi pemulihan.

### Misi 8 — Bendungan Gambut
- **Bioma:** Rawa gambut Sumatra, kanal gelap, akar dan vegetasi rawa
- **Satwa:** Rusa Sumatra

**Level 22: Kanal Pertama** — Menengah
- Tujuan: Buka satu pintu air untuk mengalirkan air ke titik api tanpa membanjiri pijakan.
- Aset inti: bendungan, pintu_air, api, rusa
- Fokus: Aliran terarah dan tinggi air.

**Level 23: Dua Jalur** — Sulit
- Tujuan: Bagi aliran ke dua kanal dan tentukan api mana yang dipadamkan lebih dulu.
- Aset inti: dua_kanal, dua_pintu_air, dua_api
- Fokus: Prioritas dan aliran bercabang.

**Level 24: Luapan Pemicu** — Sangat sulit
- Tujuan: Kendalikan luapan agar mendorong batu ke pemicu, tetapi jangan sampai merendam jalur evakuasi.
- Aset inti: dua_kanal, luapan, batu, platform, rusa
- Fokus: Air mengubah posisi objek dan akses.

### Misi 9 — Rantai Penyelamatan Gajah
- **Bioma:** Goa hutan, kayu tua, batu dan akar
- **Satwa:** Anak gajah Sumatra

**Level 25: Padamkan Penyangga** — Menengah
- Tujuan: Padamkan api sebelum menggeser kayu penyangga.
- Aset inti: api, kayu_berengsel, rantai
- Fokus: Mempelajari konsekuensi urutan.

**Level 26: Jembatan Sementara** — Sulit
- Tujuan: Turunkan kayu berengsel dan dorong batu untuk mengunci posisi jembatan.
- Aset inti: kayu_berengsel, batu, stopper, anak_gajah
- Fokus: Kombinasi momentum dan penguncian.

**Level 27: Rantai Reaksi** — Sangat sulit
- Tujuan: Padamkan dua api dalam urutan yang benar, atur kayu dan batu, lalu buka jalur tanpa membuat soft-lock.
- Aset inti: dua_api, dua_kayu, katrol, batu, anak_gajah
- Fokus: Puzzle multi-langkah dengan pemulihan.

### Misi 10 — Duel Tekanan — Penjaga Goa Api
- **Bioma:** Arena goa karst Sumatra dengan akar, pakis, dan batu berpendar
- **Satwa:** Orangutan Sumatra

**Level 28: Penjaga Terbangun** — Sulit
- Tujuan: Pelajari telegraph bola api dan belokkan satu proyektil dengan semburan air.
- Aset inti: boss, bola_api, pressure_meter
- Fokus: Pengenalan bos yang terbaca.

**Level 29: Dua Ancaman** — Sangat sulit
- Tujuan: Hadapi dua bola api dengan jeda berbeda; gunakan batu pelindung dan arahkan satu proyektil ke mekanisme.
- Aset inti: boss, dua_bola_api, batu_pelindung, gear
- Fokus: Prioritas, momentum, dan perlindungan.

**Level 30: Inti Goa Api** — Puncak
- Tujuan: Aktifkan dua mekanisme saat bertahan dari serangan, buka inti bos, padamkan inti, lalu selamatkan orangutan.
- Aset inti: boss_multi_fase, dua_katup, gear, inti_api, orangutan
- Fokus: Gabungan seluruh keterampilan; pola adil dan bisa dipulihkan.

## Implementasi bertahap

1. Audit format level/config dan loader pada game Jawa.
2. Implementasikan satu level Sumatra vertikal-slice dengan aset modular dan mekanisme yang ada.
3. Validasi fisika, solusi, reset, performa, dan keterbacaan.
4. Jadikan hasilnya template untuk 29 level berikutnya.
5. Uji tiap level secara individual; jangan menandai level selesai hanya karena konfigurasi berhasil dimuat.

## Status
Dokumen ini adalah rancangan level yang terstruktur, bukan klaim bahwa 30 level sudah diimplementasikan di repository game. Untuk integrasi langsung diperlukan akses ke repository game aktual.