# Integrasi Kalimantan — Level 3-1 … 3-30

Sumber: `referensiasset/BaraRimba_Kalimantan_All_Levels/` (30 paket kandidat, ±4.900 file, 172 MB). Kampanye dibangun di atas engine yang sama dengan Jawa dan Sumatra: truk, meriam, sistem air dan api, collision Matter, loader per-grup, HUD, menang/kalah, reset. Tidak ada game paralel.

## 1. Struktur

| Bagian | Isi |
| --- | --- |
| Region | `REGIONS.kalimantan`: id 36–65, kode 3-1…3-30, boss di 50 (3-15, *Penjaga Akar Raksasa*) dan 65 (3-30, *Jantung Bara Gambut*). Kartu Kalimantan di Peta Indonesia terbuka; 3-1 terbuka, berikutnya berurutan. |
| Tema | `peat` di `World.ts`: sungai hitam bertanin, tanah gambut gelap, latar hutan berkabut (lapisan hutan Jawa diwarnai ulang + pita kabut). |
| Data level | `src/config/kalimantanLevels.ts`, pola konfigurasi yang sama dengan Sumatra (`LevelDef` + `sm`). Tiap level memakai urutan misi dari `config/levelN_missions.json` paketnya. |
| Kit mekanisme | `src/scenes/KalimantanKit.ts` + tipe di `src/config/kalimantanKit.ts`. |
| Mekanisme yang dipakai ulang | gerbang/tombol/reservoir (`Puzzles`), rakit, jembatan engsel, bak + katup + lift, kincir + gerbang rantai, sekat bakar (bara merambat), kereta gantung (kini juga bisa diputar dial dan tampil sebagai rakit tarik), boss + perisai. |
| Uji | `tests/kalimantan.spec.ts`: satu pemain berskrip generik memainkan ke-30 level hanya dengan tombol (D/A, W/S, Q/E, Spasi). |

### Kit Kalimantan

| Komponen | Dipakai untuk (istilah paket) |
| --- | --- |
| `vents` | vent gambut: kelembapan ≥ 84% ditahan 2 detik (beberapa 82/85%, 2,5 detik); `inspect` = melacak titik asap |
| `dials` set (+ / −) | pintu air / sluice, tuas, damper, crank, winch kereta |
| `dials` pull | winch akar elastis (melar bila terlalu tegang), pompa sifon (priming) |
| `balances` | pintu A/B/C atau ruang tekanan diseimbangkan bersamaan |
| `sockets` | gelondongan di soket / cradle / tambatan |
| `clears` | intake / penangkap kayu dibersihkan |
| `fogs` | asap / kabut yang menghilang setelah langkahnya selesai |
| `floats` | tikar / pulau gambut yang stabil setelah dijangkar |
| `sequences` | katup berurutan (V3→V2→V1), panel ventilasi, klem akar |
| `crane` | crane drum pelampung (3-4) |
| `companion` | satwa kedua (3-8: orangutan + beruang madu) |
| `steps` | daftar misi di HUD (M1/7 …) dan panah kuning ke target langkah saat ini |
| `pulse` | dial yang hanya menerima air saat denyut akar rendah (3-26, 3-27) |

## 2. Pemetaan level

| Kode | Judul | Misi (sesuai paket) | Satwa |
| --- | --- | --- | --- |
| 3-1 | Bara di Tepi Sungai | api A/B, log ke soket, kincir → pintu air, jembatan, api C | Orangutan |
| 3-2 | Kayu Menghalangi Arus | bara tali rak, tuas bypass ke tengah, pintu bypass → arus, 2 log jadi lintasan | Bekantan |
| 3-3 | Rawa yang Bergerak | bara gambut, jangkar akar, 2 log balok pembagi beban di antara tikar gambut | Bekantan |
| 3-4 | Dermaga Terapung | api pos jaga, crane 2 drum, pintu air, dermaga apung | Anak beruang madu |
| 3-5 | Sarang di Seberang | vent akar tambat, pintu kecil, 2 log di bawah pulau, akar elastis | Anak rangkong |
| 3-6 | Bara di Bawah Tanah | 3 titik asap, katup V3→V2→V1, slab inspeksi, bak + katup ke 3 kantong bara | Beruang madu |
| 3-7 | Bara Menjalar | lacak asap, akar ke ceruk, tutup udara + relief, parit pemutus (bara merambat), rakit | Trenggiling |
| 3-8 | Bara Menyebar di Rawa | bak hulu ≥55%, cabang samping, 4 node bara, 2 log; **dua satwa** | Orangutan + beruang madu |
| 3-9 | Kabut dan Arus Balik | baca asap, akar tumbang, panel B→A (kabut hilang), 3 kantong bara, bypass, winch akar | Owa |
| 3-10 | Titik Bara Terakhir | petakan vent, V3→V2, winch hatch, reservoir 55%, pintu utama + bypass, parit, soket log | Bekantan |
| 3-11 | Akar Raksasa | bara pangkal akar, pengunci, log ke cradle, 2 pintu, parit, akar elastis | Bekantan |
| 3-12 | Pintu Air Ganda | api kiri, gerbang hulu + reservoir, relief, kanal tengah 35–70%, rakit, bara akar | Rangkong |
| 3-13 | Jalur Rakit Arus Balik | api awal, pintu hulu + reservoir, bypass, rakit ditarik winch (tertahan bara pulau tengah), pulang | Orangutan |
| 3-14 | Lorong Kabut dan Tiga Pintu | vent hulu (kabut), pintu A + kolam penyeimbang, B/C, akar pegas, vent manifold | Anak beruang madu |
| **3-15** | **Penjaga Akar Raksasa** (boss) | 3 simpul bara berurutan, manifold, inti terbuka berkala, padamkan inti | Beruang madu |
| 3-16 | Nadi Rawa Terakhir | vent 85%, pompa manifold, A/B/C 20/45/30, akar pegas, 2 vent, pod penyelamat | Bekantan |
| 3-17 | Lorong Asap dan Kayu Tenggelam | vent masuk, 2 shutter (asap), naikkan air, 3 retakan berurutan, rakit | Anak rangkong |
| 3-18 | Pulau Gambut Bergerak | vent, bypass 35–55%, log pemberat, pulau gambut ke tambatan, vent M→D, gerbang akar | Kura-kura sungai |
| 3-19 | Menara Napas Gambut | vent, damper atap, A/B + sifon → cistern, sprinkler ke vent di bawah atap, akar, pintu C, keranjang kanopi | Anak rangkong |
| 3-20 | Gerbang Sungai Mati | intake, vent, A/B/C 60/35/25, log ke tambatan, 2 vent, tuas gerbang akar | Anak berang-berang |
| 3-21 | Punggung Gambut Retak | vent, intake + pemberat ke rel, A/B/C, akar di atas retakan, vent tengah, relief + vent hilir | Trenggiling Sunda |
| 3-22 | Simpul Arus Purba | vent, intake, A/B/C 45/30/40, akar, 2 vent, pintu ikan ≥80%, kolam ≥90% | Anak pesut Mahakam |
| 3-23 | Labirin Akar Tenggelam | intake ke ceruk, vent, A/B/C + sifon (dinding akar 1 turun), lengkung akar, 2 vent (dinding 2), pusaran | Kucing bakau |
| 3-24 | Kubah Kabut Gambut | vent, sifon, pengisap kabut 3 dtk, A/B/C 40/35/25, 2 vent, akar | Orangutan muda |
| 3-25 | Delta Arus Berbalik | intake, vent, A/B/C 55/25/45, roda pembalik arus (gerbang rantai), akar, 2 vent | Anak bekantan |
| 3-26 | Bendungan Akar Berdenyut | penangkap kayu, vent, sifon + ruang A ≥70%, ruang denyut (hanya saat denyut rendah), 2 vent, akar | Anak beruang madu |
| 3-27 | Koridor Bara Terakhir | layar intake, vent A, sifon + pintu, bara merambat di koridor, seam B→C, akar (denyut), kanal | Anak gajah kerdil |
| 3-28 | Gerbang Nadi Purba | intake, sifon, ruang 50/35/30, vent hulu→hilir (iris terbuka), akar, keranjang | Anak rangkong gading |
| 3-29 | Ambang Jantung Gambut | intake, sifon, ruang A/B/C, 3 vent, 3 saluran pendingin sekaligus, jangkar (iris) | Anak kucing merah |
| **3-30** | **Jantung Bara Gambut** (boss akhir) | segel vent A→B→C, sifon + ruang, 3 jet pendingin, 3 klem, padamkan jantung saat terbuka | Orangutan muda |

## 3. Aset

Hanya yang belum ada di repo yang diimpor (`scripts/prepare_kalimantan.py`, 9 file, ±185 KB WebP dari paket 172 MB):

| Aset | Sumber | Catatan |
| --- | --- | --- |
| `kalimantan/sluice`, `waterwheel`, `raft` | L1 `structures/`, `objects/` (lukisan) | gaya cocok dengan game |
| `kalimantan/boss-akar` | L15 `effects/png/boss_phase_01.png` | vektor datar |
| `kalimantan/boss-heart` | L30 `assets/boss/boss_01_core_heart.png` | vektor datar |
| `animals/owa`, `pesut`, `kucing-bakau`, `kucing-merah` | L9, L22, L23, L29 | vektor datar — satu-satunya sumber spesies ini |

Dipakai ulang dari repo: orangutan, bekantan, beruang madu, rangkong, trenggiling, berang-berang, kura-kura, anak gajah, api, gelondongan, tanah, latar hutan, serta komponen mekanisme Sumatra (tiang, katrol, balok, jembatan tali, bendera, rakit). Sprite paket yang menempelkan teks label di gambar ("ORANGUTAN MUDA", "JUVENILE ORANGUTAN") sengaja tidak dipakai. Kendaraan tidak diubah.

## 4. Perubahan engine bersama

- `World`: tema `peat`; slot rakit-gelondongan terisi dari sisi jauh dulu (semua level lama memakai 1 slot, jadi tidak berubah); penjatuhan log pengganti hanya bila tidak ada log yang masih bisa dipakai.
- `Puzzles`, `Sumatra.ts`, `SumatraTrials.ts`: id `fire:N`, `floatgap`, katup bak, bak dengan pita, kereta gantung ber-id (`id`, `id:home`) dan ber-dial, rakit dengan `after`, respawn gelondongan (`minX`), sekat bakar dengan `after`.
- `LevelScene`: menang juga menunggu satwa kedua; perisai boss memakai id mekanisme (yang sudah selesai tetap dihitung) dan jendela buka/tutup.
- `Boss`: sprite/skala/moncong per boss, boss tanpa lompatan (satu perch), `sealedPace`, `noJet`.
- `GameUI`: papan 30 petak (8 kolom), petak boss kedua, gambar boss per level, koleksi 8 kolom (22 satwa).
- Panah kuning objektif (`SumatraWorld.focus()`) untuk level berkit; tes membaca penanda yang sama.

## 5. Status verifikasi

- Ke-30 level dimuat dan diselesaikan oleh pemain berskrip generik (`tests/kalimantan.spec.ts`).
- Boss 3-15: 5/5 menang setelah penyetelan; 3-30: 3/3. Pertarungan boss tetap acak.
- Regresi: spesifikasi Jawa dan Sumatra dijalankan ulang (lihat laporan perubahan).

## 6. Masalah yang belum selesai

1. **Kualitas aset paket.** Sebagian besar sprite per level adalah placeholder vektor datar. Empat spesies baru dan dua boss memakai sprite datar itu dan terlihat lebih sederhana daripada aset lukisan game. Perlu sprite lukisan pengganti.
2. **Simulasi hidrolik disederhanakan.** Rumus debit, buoyancy probe, beda tinggi air, dan arus dalam m/s di paket diterjemahkan menjadi dial dengan zona hijau, vent dengan kelembapan, dan bak dengan pita. Toleransi ±5% diperlebar menjadi sekitar ±8%, karena air yang masih melayang terus memutar dial setelah semprotan dilepas.
3. **Pendekatan per level.**
   - 3-4: dermaga didorong pemain melawan arus, bukan dibawa arus dari pintu air.
   - 3-16: syarat "vent hulu tetap basah" tidak ditegakkan.
   - Keranjang penyelamat sebagian besar diwakili satwa yang berjalan sendiri atau rakit/kereta yang diputar dial.
4. **Urutan.** Urutan dikunci untuk komponen kit. Mekanisme lama (rakit, katup bak) hanya diurutkan oleh tata letak dan daftar misi, belum dikunci keras.
5. **Belum diuji pemain manusia.** Tingkat kesulitan baru diuji dengan pemain berskrip. Beberapa level panjang untuk bot (3-14, 3-27). Waktu tahan vent dan respons dial perlu playtest.
6. **Tampilan tema.** Tema masih memakai lapisan hutan Jawa yang diwarnai ulang. Belum ada parallax lukisan khas Kalimantan seperti di concept art (lapisan parallax paket berupa vektor datar).
7. **HUD boss.** Gambar HUD boss (panel misi dan bar boss) masih bertuliskan "Pembakar Hutan" karena teks itu menyatu di gambar.
8. **Chapter berikutnya.** `referensiasset/` belum berisi paket untuk Sulawesi, Bali, Nusa Tenggara, atau Papua. Chapter berikutnya belum bisa dibangun dari dokumentasi.
